// Enforcer login (phone app).
//   New or forgotten phone: email + password, then a 6-digit code from email.
//   First login ever: also set a new strong password.
//   Same phone after the Sunday cut-off: email + password only.
const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { audit } = require('../audit');
const { sendEmail } = require('../mailer');
const { createCode, cancelCode, checkCode, codeError } = require('../otp');
const { checkStrength } = require('../passwords');
const { signStep, signEnforcerAccess, readToken, requireEnforcer } = require('../auth');

const router = express.Router();

const WRONG_LOGIN = { error: 'Invalid email or password.' };
const LOCKED = { error: 'Too many wrong passwords. This account is locked. Ask your admin to unlock it.' };
const START_AGAIN = { error: 'Invalid or expired code. Please log in again.' };

// Used so a wrong email takes as long to answer as a right one (no clue for attackers).
const DUMMY_HASH = bcrypt.hashSync('this-password-is-never-used', 12);

async function getSettings() {
  const result = await pool.query(
    'SELECT otp_valid_minutes, max_failed_logins FROM app_settings WHERE id = 1'
  );
  return result.rows[0];
}

// The phone keeps a secret random key. We only store its scramble, like a password.
function hashDeviceKey(deviceKey) {
  return crypto.createHash('sha256').update(deviceKey).digest('hex');
}

function sameHash(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// Remembers this phone and gives the weekly login pass.
async function registerPhoneAndLogIn(enforcerId, deviceKeyHash) {
  const registeredAt = new Date();
  await pool.query(
    'UPDATE enforcers SET device_key_hash = $1, device_registered_at = $2 WHERE id = $3',
    [deviceKeyHash, registeredAt, enforcerId]
  );
  return signEnforcerAccess(enforcerId, registeredAt);
}

function loggedIn(pass, enforcer) {
  return {
    status: 'logged_in',
    token: pass.token,
    expiresAt: pass.expiresAt,
    enforcer: { id: enforcer.id, email: enforcer.email, fullName: enforcer.full_name },
  };
}

// STEP 1: email + password (+ the phone's key)
router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const deviceKey = String(req.body.deviceKey || '');
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    if (deviceKey.length < 32 || deviceKey.length > 200) {
      return res.status(400).json({ error: 'The app did not send a valid phone key.' });
    }

    const settings = await getSettings();
    const found = await pool.query(
      `SELECT id, email, full_name, password_hash, is_locked, failed_login_count,
              must_change_password, temp_password_expires_at, device_key_hash, device_registered_at
       FROM enforcers WHERE lower(email) = $1 AND is_active`,
      [email]
    );
    const enforcer = found.rows[0];

    const passwordOk = await bcrypt.compare(password, enforcer ? enforcer.password_hash : DUMMY_HASH);

    if (!enforcer) {
      await audit('enforcer_login_failed', 'Enforcer login failed: unknown or inactive account', {
        usernameTried: email,
      });
      return res.status(401).json(WRONG_LOGIN);
    }
    const who = { enforcerId: enforcer.id };

    if (enforcer.is_locked) {
      await audit('enforcer_login_blocked', 'Enforcer login blocked: account is locked', who);
      return res.status(423).json(LOCKED);
    }

    if (!passwordOk) {
      const count = enforcer.failed_login_count + 1;
      const lockNow = count >= settings.max_failed_logins;
      await pool.query(
        'UPDATE enforcers SET failed_login_count = $1, is_locked = $2 WHERE id = $3',
        [count, lockNow, enforcer.id]
      );
      await audit(
        lockNow ? 'enforcer_locked' : 'enforcer_login_failed',
        lockNow
          ? 'Enforcer account locked after too many wrong passwords'
          : 'Enforcer login failed: wrong password',
        who
      );
      return res.status(lockNow ? 423 : 401).json(lockNow ? LOCKED : WRONG_LOGIN);
    }

    await pool.query('UPDATE enforcers SET failed_login_count = 0 WHERE id = $1', [enforcer.id]);

    if (
      enforcer.must_change_password &&
      enforcer.temp_password_expires_at &&
      enforcer.temp_password_expires_at < new Date()
    ) {
      await audit('enforcer_temp_expired', 'Enforcer used an expired temporary password', who);
      return res.status(403).json({
        error: 'Your temporary password has expired. Ask your admin to resend your login.',
      });
    }

    const deviceKeyHash = hashDeviceKey(deviceKey);

    // Same registered phone: no code needed.
    if (!enforcer.must_change_password && sameHash(enforcer.device_key_hash, deviceKeyHash)) {
      const pass = signEnforcerAccess(enforcer.id, enforcer.device_registered_at);
      await audit('enforcer_login', 'Enforcer logged in on the registered phone', who);
      return res.json(loggedIn(pass, enforcer));
    }

    // New or forgotten phone: send a code.
    const otp = await createCode(who, 'login_2fa', settings.otp_valid_minutes);
    try {
      await sendEmail(
        enforcer.email,
        'Your CAPartner login code',
        `<p>Your CAPartner login code is:</p>
         <p style="font-size:24px;letter-spacing:4px"><b>${otp.code}</b></p>
         <p>It is valid for ${settings.otp_valid_minutes} minutes and works once.</p>
         <p>If you did not try to log in, tell your admin.</p>`
      );
    } catch (mailError) {
      console.error('Could not send code email: ' + mailError.message);
      await cancelCode(otp.id);
      await audit('enforcer_code_email_failed', 'Login code email could not be sent', who);
      return res.status(502).json({ error: 'We could not send the code email. Please try again.' });
    }

    await audit('enforcer_code_sent', 'Enforcer password accepted, login code emailed', who);
    res.json({
      status: 'code_sent',
      message: 'A 6-digit code was sent to your email. Check your spam folder too.',
      pendingToken: signStep(
        { sub: enforcer.id, typ: 'enforcer-pending', dkh: deviceKeyHash },
        settings.otp_valid_minutes
      ),
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
    const pending = readToken(String(req.body.pendingToken || ''), 'enforcer-pending');
    if (!pending) return res.status(401).json(START_AGAIN);

    const found = await pool.query(
      `SELECT id, email, full_name, is_active, is_locked, must_change_password
       FROM enforcers WHERE id = $1`,
      [pending.sub]
    );
    const enforcer = found.rows[0];
    if (!enforcer || !enforcer.is_active || enforcer.is_locked) {
      return res.status(401).json(START_AGAIN);
    }
    const who = { enforcerId: enforcer.id };

    const result = await checkCode(who, 'login_2fa', String(req.body.code || '').trim());
    if (!result.ok) {
      if (result.reason !== 'none') {
        await audit(
          result.reason === 'blocked' ? 'enforcer_code_blocked' : 'enforcer_code_failed',
          result.reason === 'blocked'
            ? 'Login code used up after too many wrong tries'
            : 'Wrong login code entered',
          who
        );
      }
      return res.status(401).json(codeError(result));
    }

    // First login: the only thing allowed next is setting a new password.
    if (enforcer.must_change_password) {
      await audit('enforcer_code_ok', 'Enforcer code accepted, must set a new password', who);
      return res.json({
        status: 'must_change_password',
        setupToken: signStep({ sub: enforcer.id, typ: 'enforcer-setup', dkh: pending.dkh }, 15),
      });
    }

    const pass = await registerPhoneAndLogIn(enforcer.id, pending.dkh);
    await audit('enforcer_login', 'Enforcer logged in and registered a phone', who);
    res.json(loggedIn(pass, enforcer));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// STEP 3 (first login only): set a new strong password
router.post('/change-password', async (req, res) => {
  try {
    const setup = readToken(String(req.body.setupToken || ''), 'enforcer-setup');
    if (!setup) return res.status(401).json(START_AGAIN);

    const found = await pool.query(
      `SELECT id, email, full_name, password_hash, is_active, is_locked, must_change_password
       FROM enforcers WHERE id = $1`,
      [setup.sub]
    );
    const enforcer = found.rows[0];
    if (!enforcer || !enforcer.is_active || enforcer.is_locked || !enforcer.must_change_password) {
      return res.status(401).json(START_AGAIN);
    }

    const newPassword = String(req.body.newPassword || '');
    const problem = checkStrength(newPassword, enforcer.email);
    if (problem) return res.status(400).json({ error: problem });
    if (await bcrypt.compare(newPassword, enforcer.password_hash)) {
      return res.status(400).json({ error: 'New password must be different from the temporary one.' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    const changed = await pool.query(
      `UPDATE enforcers
       SET password_hash = $1, must_change_password = false, temp_password_expires_at = NULL,
           activated_at = COALESCE(activated_at, now())
       WHERE id = $2 AND must_change_password
       RETURNING id`,
      [newHash, enforcer.id]
    );
    if (changed.rowCount === 0) return res.status(401).json(START_AGAIN);

    const pass = await registerPhoneAndLogIn(enforcer.id, setup.dkh);
    await audit('enforcer_activated', 'Enforcer set a new password and registered a phone', {
      enforcerId: enforcer.id,
    });
    res.json(loggedIn(pass, enforcer));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Logout: forget this phone. The next login needs password + code again.
router.post('/logout', requireEnforcer, async (req, res) => {
  try {
    await pool.query(
      'UPDATE enforcers SET device_key_hash = NULL, device_registered_at = NULL WHERE id = $1',
      [req.enforcer.id]
    );
    await audit('enforcer_logout', 'Enforcer logged out', { enforcerId: req.enforcer.id });
    res.json({ message: 'Logged out.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// My profile: name, sector and the cap this enforcer may pair with.
router.get('/me', requireEnforcer, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.id, e.email, e.full_name, e.badge_no, s.name AS sector, c.cap_code
       FROM enforcers e
       LEFT JOIN sectors s ON s.id = e.sector_id
       LEFT JOIN caps c ON c.id = e.cap_id
       WHERE e.id = $1`,
      [req.enforcer.id]
    );
    const me = result.rows[0];
    res.json({
      id: me.id,
      email: me.email,
      fullName: me.full_name,
      badgeNo: me.badge_no,
      sector: me.sector,
      capCode: me.cap_code,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

module.exports = router;
