// Enforcer settings (phone app): edit name and contact number, change password.
//   Name / contact: saved right away (audited).
//   Password: current password + new strong password -> code to the enforcer's email -> confirm
//   Email: only the admin can change it.
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { audit } = require('../audit');
const { sendEmail } = require('../mailer');
const { createCode, cancelCode, checkCode, codeError } = require('../otp');
const { checkStrength } = require('../passwords');
const { signStep, readToken, requireEnforcer } = require('../auth');

const router = express.Router();

const PH_MOBILE = /^(09\d{9}|\+639\d{9})$/;
const START_AGAIN = { error: 'This request expired. Please start again.' };
const LOCKED = { error: 'Too many wrong passwords. This account is locked. Ask your admin to unlock it.' };

async function getSettings() {
  const result = await pool.query(
    'SELECT otp_valid_minutes, max_failed_logins FROM app_settings WHERE id = 1'
  );
  return result.rows[0];
}

// Checks the enforcer's current password. Wrong passwords count toward the lock, like at login.
// Returns null if right, or [status, body] to send back.
async function checkCurrentPassword(enforcerId, password, settings) {
  const found = await pool.query(
    'SELECT password_hash, failed_login_count FROM enforcers WHERE id = $1',
    [enforcerId]
  );
  const enforcer = found.rows[0];
  if (await bcrypt.compare(String(password || ''), enforcer.password_hash)) {
    await pool.query('UPDATE enforcers SET failed_login_count = 0 WHERE id = $1', [enforcerId]);
    return null;
  }
  const count = enforcer.failed_login_count + 1;
  const lockNow = count >= settings.max_failed_logins;
  await pool.query('UPDATE enforcers SET failed_login_count = $1, is_locked = $2 WHERE id = $3', [
    count,
    lockNow,
    enforcerId,
  ]);
  await audit(
    lockNow ? 'enforcer_locked' : 'enforcer_password_failed',
    lockNow
      ? 'Enforcer account locked after too many wrong passwords (settings)'
      : 'Wrong current password in enforcer settings',
    { enforcerId }
  );
  return lockNow ? [423, LOCKED] : [401, { error: 'Current password is wrong.' }];
}

// EDIT NAME AND CONTACT NUMBER
router.patch('/me', requireEnforcer, async (req, res) => {
  try {
    const fullName = String(req.body.fullName ?? '').trim();
    const contactNo = String(req.body.contactNo ?? '').trim().replace(/[\s-]/g, '');
    if (fullName.length < 2 || fullName.length > 100) {
      return res.status(400).json({ error: 'Name must be 2 to 100 characters.' });
    }
    if (contactNo && !PH_MOBILE.test(contactNo)) {
      return res.status(400).json({ error: 'Contact number must be a PH mobile number, like 09171234567.' });
    }

    await pool.query('UPDATE enforcers SET full_name = $1, contact_no = $2 WHERE id = $3', [
      fullName,
      contactNo || null,
      req.enforcer.id,
    ]);
    await audit('enforcer_profile_updated', 'Enforcer updated their name or contact number', {
      enforcerId: req.enforcer.id,
    });
    res.json({ message: 'Profile saved.', fullName, contactNo: contactNo || null });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// CHANGE PASSWORD, step 1: current password + new strong password
router.post('/account/change-password/start', requireEnforcer, async (req, res) => {
  try {
    const newPassword = String(req.body.newPassword || '');
    const problem = checkStrength(newPassword, req.enforcer.email);
    if (problem) return res.status(400).json({ error: problem });
    if (newPassword === String(req.body.oldPassword || '')) {
      return res.status(400).json({ error: 'New password must be different from the current one.' });
    }

    const settings = await getSettings();
    const wrong = await checkCurrentPassword(req.enforcer.id, req.body.oldPassword, settings);
    if (wrong) return res.status(wrong[0]).json(wrong[1]);

    const otp = await createCode({ enforcerId: req.enforcer.id }, 'change_password', settings.otp_valid_minutes);
    try {
      await sendEmail(
        req.enforcer.email,
        'Confirm your CAPartner password change',
        `<p>Your CAPartner confirmation code is:</p>
         <p style="font-size:24px;letter-spacing:4px"><b>${otp.code}</b></p>
         <p>It is valid for ${settings.otp_valid_minutes} minutes and works once.</p>
         <p>If you did not ask for this, someone may know your password. Tell your admin.</p>`
      );
    } catch (mailError) {
      console.error('Could not send code email: ' + mailError.message);
      await cancelCode(otp.id);
      return res.status(502).json({ error: 'We could not send the code email. Please try again.' });
    }

    await audit('enforcer_pw_change_started', 'Enforcer asked to change password, code sent', {
      enforcerId: req.enforcer.id,
    });
    res.json({
      message: 'A 6-digit code was sent to your email.',
      pendingToken: signStep(
        { sub: req.enforcer.id, typ: 'enforcer-change-password' },
        settings.otp_valid_minutes
      ),
      codeValidMinutes: settings.otp_valid_minutes,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// CHANGE PASSWORD, step 2: the code + the same new password again
router.post('/account/change-password/confirm', requireEnforcer, async (req, res) => {
  try {
    const pending = readToken(String(req.body.pendingToken || ''), 'enforcer-change-password');
    if (!pending || pending.sub !== req.enforcer.id) return res.status(401).json(START_AGAIN);

    const newPassword = String(req.body.newPassword || '');
    const problem = checkStrength(newPassword, req.enforcer.email);
    if (problem) return res.status(400).json({ error: problem });

    const result = await checkCode(
      { enforcerId: req.enforcer.id },
      'change_password',
      String(req.body.code || '').trim()
    );
    if (!result.ok) return res.status(401).json(codeError(result));

    const current = await pool.query('SELECT password_hash FROM enforcers WHERE id = $1', [req.enforcer.id]);
    if (await bcrypt.compare(newPassword, current.rows[0].password_hash)) {
      return res.status(400).json({ error: 'New password must be different from the current one.' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE enforcers SET password_hash = $1, failed_login_count = 0 WHERE id = $2', [
      newHash,
      req.enforcer.id,
    ]);
    await audit('enforcer_password_changed', 'Enforcer password was changed', { enforcerId: req.enforcer.id });
    res.json({ message: 'Your password was changed.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

module.exports = router;
