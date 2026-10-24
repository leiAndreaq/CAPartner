// Admin login: step 1 = email + password, step 2 = 6-digit code from email.
const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { audit } = require('../audit');
const { sendEmail } = require('../mailer');
const { signPending, signAccess, readToken, requireAdmin } = require('../auth');

const router = express.Router();

const MAX_CODE_TRIES = 5;
const WRONG_LOGIN = { error: 'Invalid email or password.' };
const LOCKED = { error: 'Too many wrong passwords. This account is locked.' };

// Used so a wrong email takes as long to answer as a right one (no clue for attackers).
const DUMMY_HASH = bcrypt.hashSync('this-password-is-never-used', 12);

async function getSettings() {
  const result = await pool.query(
    `SELECT otp_valid_minutes, auto_signout_minutes, max_failed_logins
     FROM app_settings WHERE id = 1`
  );
  return result.rows[0];
}

// STEP 1: email + password
router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const settings = await getSettings();
    const found = await pool.query(
      `SELECT id, email, password_hash, is_active, is_locked, failed_login_count
       FROM admins WHERE lower(email) = $1`,
      [email]
    );
    const admin = found.rows[0];

    const passwordOk = await bcrypt.compare(password, admin ? admin.password_hash : DUMMY_HASH);

    if (!admin || !admin.is_active) {
      await audit('admin_login_failed', 'Admin login failed: unknown or inactive account', {
        usernameTried: email,
      });
      return res.status(401).json(WRONG_LOGIN);
    }

    if (admin.is_locked) {
      await audit('admin_login_blocked', 'Admin login blocked: account is locked', {
        adminId: admin.id,
      });
      return res.status(423).json(LOCKED);
    }

    if (!passwordOk) {
      const count = admin.failed_login_count + 1;
      const lockNow = count >= settings.max_failed_logins;
      await pool.query('UPDATE admins SET failed_login_count = $1, is_locked = $2 WHERE id = $3', [
        count,
        lockNow,
        admin.id,
      ]);
      await audit(
        lockNow ? 'admin_locked' : 'admin_login_failed',
        lockNow
          ? 'Admin account locked after too many wrong passwords'
          : 'Admin login failed: wrong password',
        { adminId: admin.id }
      );
      return res.status(lockNow ? 423 : 401).json(lockNow ? LOCKED : WRONG_LOGIN);
    }

    // Password is right: reset the counter, then send the code.
    await pool.query('UPDATE admins SET failed_login_count = 0 WHERE id = $1', [admin.id]);

    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    const codeHash = await bcrypt.hash(code, 10);

    // A new login cancels any older unused code.
    await pool.query(
      `UPDATE otp_codes SET used_at = now()
       WHERE admin_id = $1 AND purpose = 'login_2fa' AND used_at IS NULL`,
      [admin.id]
    );
    const saved = await pool.query(
      `INSERT INTO otp_codes (admin_id, purpose, code_hash, expires_at)
       VALUES ($1, 'login_2fa', $2, now() + make_interval(mins => $3))
       RETURNING id`,
      [admin.id, codeHash, settings.otp_valid_minutes]
    );

    try {
      await sendEmail(
        admin.email,
        'Your CAPartner login code',
        `<p>Your CAPartner login code is:</p>
         <p style="font-size:24px;letter-spacing:4px"><b>${code}</b></p>
         <p>It is valid for ${settings.otp_valid_minutes} minutes and works once.</p>
         <p>If you did not try to log in, you can ignore this email.</p>`
      );
    } catch (mailError) {
      console.error('Could not send code email: ' + mailError.message);
      await pool.query('UPDATE otp_codes SET used_at = now() WHERE id = $1', [saved.rows[0].id]);
      await audit('admin_code_email_failed', 'Login code email could not be sent', {
        adminId: admin.id,
      });
      return res.status(502).json({ error: 'We could not send the code email. Please try again.' });
    }

    await audit('admin_code_sent', 'Admin password accepted, login code emailed', {
      adminId: admin.id,
    });
    res.json({
      message: 'A 6-digit code was sent to your email.',
      pendingToken: signPending(admin.id, settings.otp_valid_minutes),
      codeValidMinutes: settings.otp_valid_minutes,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// STEP 2: the 6-digit code
router.post('/verify-code', async (req, res) => {
  try {
    const code = String(req.body.code || '').trim();
    const pending = readToken(String(req.body.pendingToken || ''), 'admin-pending');
    if (!pending || !/^\d{6}$/.test(code)) {
      return res.status(401).json({ error: 'Invalid or expired code. Please log in again.' });
    }

    const adminResult = await pool.query(
      'SELECT id, email, full_name, is_active, is_locked FROM admins WHERE id = $1',
      [pending.sub]
    );
    const admin = adminResult.rows[0];
    if (!admin || !admin.is_active || admin.is_locked) {
      return res.status(401).json({ error: 'Invalid or expired code. Please log in again.' });
    }

    const otpResult = await pool.query(
      `SELECT id, code_hash FROM otp_codes
       WHERE admin_id = $1 AND purpose = 'login_2fa'
         AND used_at IS NULL AND expires_at > now()
       ORDER BY created_at DESC LIMIT 1`,
      [admin.id]
    );
    const otp = otpResult.rows[0];
    if (!otp) {
      return res.status(401).json({ error: 'Invalid or expired code. Please log in again.' });
    }

    // Count this try first, so fast parallel guesses cannot beat the limit.
    const counted = await pool.query(
      `UPDATE otp_codes SET attempts = attempts + 1
       WHERE id = $1 AND used_at IS NULL AND attempts < $2
       RETURNING attempts`,
      [otp.id, MAX_CODE_TRIES]
    );
    if (counted.rowCount === 0) {
      await pool.query('UPDATE otp_codes SET used_at = now() WHERE id = $1', [otp.id]);
      await audit('admin_code_blocked', 'Login code used up after too many wrong tries', {
        adminId: admin.id,
      });
      return res.status(401).json({ error: 'Too many wrong codes. Please log in again.' });
    }

    const match = await bcrypt.compare(code, otp.code_hash);
    if (!match) {
      await audit('admin_code_failed', 'Wrong login code entered', { adminId: admin.id });
      const left = MAX_CODE_TRIES - counted.rows[0].attempts;
      return res.status(401).json({ error: 'Wrong code.', triesLeft: left });
    }

    // Right code: it works once only.
    const used = await pool.query(
      'UPDATE otp_codes SET used_at = now() WHERE id = $1 AND used_at IS NULL RETURNING id',
      [otp.id]
    );
    if (used.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid or expired code. Please log in again.' });
    }

    const settings = await getSettings();
    await audit('admin_login', 'Admin logged in', { adminId: admin.id });
    res.json({
      token: signAccess(admin.id, settings.auto_signout_minutes),
      expiresInMinutes: settings.auto_signout_minutes,
      admin: { id: admin.id, email: admin.email, fullName: admin.full_name },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Test route: shows who is logged in. Only works with a full login pass.
router.get('/me', requireAdmin, (req, res) => {
  res.json({ id: req.admin.id, email: req.admin.email, fullName: req.admin.full_name });
});

module.exports = router;
