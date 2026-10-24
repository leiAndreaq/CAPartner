// Admin settings: change own email, change own password. Both need the current password and an emailed code.
//   Email:    current password + new email  -> code sent to the NEW email     -> confirm
//   Password: current password + new password -> code sent to the CURRENT email -> confirm
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { audit } = require('../audit');
const { sendEmail } = require('../mailer');
const { createCode, cancelCode, checkCode, codeError } = require('../otp');
const { checkStrength } = require('../passwords');
const { signStep, readToken, requireAdmin } = require('../auth');

const router = express.Router();
router.use(requireAdmin);

const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const START_AGAIN = { error: 'This request expired. Please start again.' };
const LOCKED = { error: 'Too many wrong passwords. This account is locked.' };

async function getSettings() {
  const result = await pool.query(
    'SELECT otp_valid_minutes, max_failed_logins FROM app_settings WHERE id = 1'
  );
  return result.rows[0];
}

// Checks the admin's current password. Wrong passwords count toward the lock, like at login.
// Returns null if right, or [status, body] to send back.
async function checkCurrentPassword(adminId, password, settings) {
  const found = await pool.query(
    'SELECT password_hash, failed_login_count FROM admins WHERE id = $1',
    [adminId]
  );
  const admin = found.rows[0];
  if (await bcrypt.compare(String(password || ''), admin.password_hash)) {
    await pool.query('UPDATE admins SET failed_login_count = 0 WHERE id = $1', [adminId]);
    return null;
  }
  const count = admin.failed_login_count + 1;
  const lockNow = count >= settings.max_failed_logins;
  await pool.query('UPDATE admins SET failed_login_count = $1, is_locked = $2 WHERE id = $3', [
    count,
    lockNow,
    adminId,
  ]);
  await audit(
    lockNow ? 'admin_locked' : 'admin_password_failed',
    lockNow
      ? 'Admin account locked after too many wrong passwords (settings)'
      : 'Wrong current password in admin settings',
    { adminId }
  );
  return lockNow ? [423, LOCKED] : [401, { error: 'Current password is wrong.' }];
}

async function sendCode(to, title, otp, minutes) {
  await sendEmail(
    to,
    title,
    `<p>Your CAPartner confirmation code is:</p>
     <p style="font-size:24px;letter-spacing:4px"><b>${otp.code}</b></p>
     <p>It is valid for ${minutes} minutes and works once.</p>
     <p>If you did not ask for this, someone may know your admin password. Change it now.</p>`
  );
}

// CHANGE EMAIL, step 1: current password + new email
router.post('/change-email/start', async (req, res) => {
  try {
    const newEmail = String(req.body.newEmail || '').trim().toLowerCase();
    if (!EMAIL_RULE.test(newEmail) || newEmail.length > 150) {
      return res.status(400).json({ error: 'A valid new email is required.' });
    }
    if (newEmail === req.admin.email.toLowerCase()) {
      return res.status(400).json({ error: 'That is already your email.' });
    }

    const settings = await getSettings();
    const wrong = await checkCurrentPassword(req.admin.id, req.body.password, settings);
    if (wrong) return res.status(wrong[0]).json(wrong[1]);

    const otp = await createCode({ adminId: req.admin.id }, 'change_email', settings.otp_valid_minutes);
    try {
      await sendCode(newEmail, 'Confirm your new CAPartner admin email', otp, settings.otp_valid_minutes);
    } catch (mailError) {
      console.error('Could not send code email: ' + mailError.message);
      await cancelCode(otp.id);
      return res.status(502).json({ error: 'We could not send the code to the new email. Check it and try again.' });
    }

    await audit('admin_email_change_started', 'Admin asked to change email, code sent to new email', {
      adminId: req.admin.id,
    });
    res.json({
      message: `A 6-digit code was sent to ${newEmail}.`,
      pendingToken: signStep(
        { sub: req.admin.id, typ: 'admin-change-email', email: newEmail },
        settings.otp_valid_minutes
      ),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// CHANGE EMAIL, step 2: the code from the new email
router.post('/change-email/confirm', async (req, res) => {
  try {
    const pending = readToken(String(req.body.pendingToken || ''), 'admin-change-email');
    if (!pending || pending.sub !== req.admin.id) return res.status(401).json(START_AGAIN);

    const result = await checkCode({ adminId: req.admin.id }, 'change_email', String(req.body.code || '').trim());
    if (!result.ok) return res.status(401).json(codeError(result));

    const oldEmail = req.admin.email;
    try {
      // username is the email for admins, so both change together.
      await pool.query('UPDATE admins SET email = $1, username = $1 WHERE id = $2', [
        pending.email,
        req.admin.id,
      ]);
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'That email is already used.' });
      throw err;
    }

    await audit('admin_email_changed', 'Admin email was changed', { adminId: req.admin.id });
    try {
      await sendEmail(
        oldEmail,
        'Your CAPartner admin email was changed',
        `<p>The CAPartner admin email was changed from this address to a new one.</p>
         <p>If you did not do this, contact your team right away.</p>`
      );
    } catch (mailError) {
      console.error('Could not send notice to old email: ' + mailError.message);
    }
    res.json({ message: 'Your admin email was changed. Use the new email next time you log in.', email: pending.email });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// CHANGE PASSWORD, step 1: current password + new strong password
router.post('/change-password/start', async (req, res) => {
  try {
    const newPassword = String(req.body.newPassword || '');
    const problem = checkStrength(newPassword, req.admin.email);
    if (problem) return res.status(400).json({ error: problem });
    if (newPassword === String(req.body.oldPassword || '')) {
      return res.status(400).json({ error: 'New password must be different from the current one.' });
    }

    const settings = await getSettings();
    const wrong = await checkCurrentPassword(req.admin.id, req.body.oldPassword, settings);
    if (wrong) return res.status(wrong[0]).json(wrong[1]);

    const otp = await createCode({ adminId: req.admin.id }, 'change_password', settings.otp_valid_minutes);
    try {
      await sendCode(req.admin.email, 'Confirm your CAPartner password change', otp, settings.otp_valid_minutes);
    } catch (mailError) {
      console.error('Could not send code email: ' + mailError.message);
      await cancelCode(otp.id);
      return res.status(502).json({ error: 'We could not send the code email. Please try again.' });
    }

    await audit('admin_password_change_started', 'Admin asked to change password, code sent', {
      adminId: req.admin.id,
    });
    res.json({
      message: 'A 6-digit code was sent to your email.',
      pendingToken: signStep({ sub: req.admin.id, typ: 'admin-change-password' }, settings.otp_valid_minutes),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// CHANGE PASSWORD, step 2: the code + the same new password again
router.post('/change-password/confirm', async (req, res) => {
  try {
    const pending = readToken(String(req.body.pendingToken || ''), 'admin-change-password');
    if (!pending || pending.sub !== req.admin.id) return res.status(401).json(START_AGAIN);

    const newPassword = String(req.body.newPassword || '');
    const problem = checkStrength(newPassword, req.admin.email);
    if (problem) return res.status(400).json({ error: problem });

    const result = await checkCode({ adminId: req.admin.id }, 'change_password', String(req.body.code || '').trim());
    if (!result.ok) return res.status(401).json(codeError(result));

    const current = await pool.query('SELECT password_hash FROM admins WHERE id = $1', [req.admin.id]);
    if (await bcrypt.compare(newPassword, current.rows[0].password_hash)) {
      return res.status(400).json({ error: 'New password must be different from the current one.' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE admins SET password_hash = $1, failed_login_count = 0 WHERE id = $2', [
      newHash,
      req.admin.id,
    ]);
    await audit('admin_password_changed', 'Admin password was changed', { adminId: req.admin.id });
    res.json({ message: 'Your password was changed. Use the new password next time you log in.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

module.exports = router;
