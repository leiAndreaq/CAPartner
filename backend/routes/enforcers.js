// Admin: add, list, force logout, delete (hide), resend login, unlock enforcers.
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { audit } = require('../audit');
const { sendEmail } = require('../mailer');
const { makeTempPassword } = require('../passwords');
const { requireAdmin } = require('../auth');

const router = express.Router();
router.use(requireAdmin);

const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RULE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOT_FOUND = { error: 'Enforcer not found.' };

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}

function cleanText(value, maxLength) {
  const text = String(value ?? '').trim();
  return text.length > maxLength ? null : text;
}

// Emails the temporary password. The admin never sees it, and it is never logged.
async function sendLoginEmail(enforcer, tempPassword, hours) {
  await sendEmail(
    enforcer.email,
    'Your CAPartner account',
    `<p>Hello ${escapeHtml(enforcer.full_name)},</p>
     <p>An account was made for you in CAPartner.</p>
     <p>Email: <b>${escapeHtml(enforcer.email)}</b><br>
        Temporary password: <b style="font-size:18px;letter-spacing:2px">${escapeHtml(tempPassword)}</b></p>
     <p>The temporary password works for <b>${hours} hours</b>. When you first log in, you will get a
        6-digit code by email and then you must set your own new password.</p>
     <p>CAPartner App Link</p>
     <p>If you did not expect this email, tell your station admin.</p>`
  );
}

// Makes a fresh temporary password and saves only its hash.
async function newTempPassword() {
  const tempPassword = makeTempPassword();
  return { tempPassword, hash: await bcrypt.hash(tempPassword, 12) };
}

// List of active enforcers.
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.id, e.full_name, e.email, e.badge_no, e.contact_no, s.name AS sector, c.cap_code,
              e.is_locked, e.must_change_password, e.activated_at, e.temp_password_expires_at,
              e.device_registered_at, e.created_at
       FROM enforcers e
       LEFT JOIN sectors s ON s.id = e.sector_id
       LEFT JOIN caps c ON c.id = e.cap_id
       WHERE e.is_active
       ORDER BY e.created_at`
    );
    const settings = await pool.query('SELECT max_enforcers FROM app_settings WHERE id = 1');
    res.json({
      maxEnforcers: settings.rows[0].max_enforcers,
      enforcers: result.rows.map((e) => ({
        id: e.id,
        fullName: e.full_name,
        email: e.email,
        badgeNo: e.badge_no,
        contactNo: e.contact_no,
        sector: e.sector,
        capCode: e.cap_code,
        isLocked: e.is_locked,
        hasSetPassword: !e.must_change_password,
        tempPasswordExpired:
          e.must_change_password && e.temp_password_expires_at !== null && e.temp_password_expires_at < new Date(),
        phoneRegistered: e.device_registered_at !== null,
        activatedAt: e.activated_at,
        createdAt: e.created_at,
      })),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Add an enforcer. Body: fullName, email, sectorId, badgeNo (optional), contactNo (optional), capCode (optional).
router.post('/', async (req, res) => {
  const fullName = cleanText(req.body.fullName, 100);
  const email = cleanText(req.body.email, 150)?.toLowerCase();
  const badgeNo = cleanText(req.body.badgeNo, 30);
  const contactNo = cleanText(req.body.contactNo, 20);
  const capCode = cleanText(req.body.capCode, 20);
  const sectorId = Number(req.body.sectorId);

  if (!fullName) return res.status(400).json({ error: 'Full name is required (max 100 characters).' });
  if (!email || !EMAIL_RULE.test(email)) return res.status(400).json({ error: 'A valid email is required.' });
  if (!Number.isInteger(sectorId) || sectorId < 1) return res.status(400).json({ error: 'Sector is required.' });
  if (badgeNo === null) return res.status(400).json({ error: 'Badge number is too long (max 30).' });
  if (contactNo === null) return res.status(400).json({ error: 'Contact number is too long (max 20).' });
  if (capCode === null) return res.status(400).json({ error: 'Cap code is too long.' });

  const client = await pool.connect();
  let enforcer;
  let tempPassword;
  let hours;
  try {
    await client.query('BEGIN');
    // Lock the settings row so two admins clicking at once cannot pass the limit.
    const settings = await client.query(
      'SELECT max_enforcers, temp_password_valid_hours FROM app_settings WHERE id = 1 FOR UPDATE'
    );
    const { max_enforcers: maxEnforcers, temp_password_valid_hours: validHours } = settings.rows[0];
    hours = validHours;

    const active = await client.query('SELECT count(*)::int AS n FROM enforcers WHERE is_active');
    if (active.rows[0].n >= maxEnforcers) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: `Only ${maxEnforcers} enforcer accounts are allowed. Delete one first.` });
    }

    const sector = await client.query('SELECT id FROM sectors WHERE id = $1', [sectorId]);
    if (sector.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'That sector does not exist.' });
    }

    let capId = null;
    if (capCode) {
      const cap = await client.query(
        `SELECT c.id, e.id AS taken_by FROM caps c
         LEFT JOIN enforcers e ON e.cap_id = c.id
         WHERE c.cap_code = $1`,
        [capCode]
      );
      if (cap.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'That cap does not exist.' });
      }
      if (cap.rows[0].taken_by) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'That cap already belongs to another enforcer.' });
      }
      capId = cap.rows[0].id;
    }

    const temp = await newTempPassword();
    tempPassword = temp.tempPassword;
    const saved = await client.query(
      `INSERT INTO enforcers
         (full_name, email, password_hash, sector_id, badge_no, contact_no, cap_id,
          must_change_password, temp_password_expires_at, created_by_admin_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, now() + make_interval(hours => $8), $9)
       RETURNING id, full_name, email`,
      [fullName, email, temp.hash, sectorId, badgeNo || null, contactNo || null, capId, validHours, req.admin.id]
    );
    enforcer = saved.rows[0];
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    if (err.code === '23505') {
      const what = err.constraint === 'enforcers_badge_no_key' ? 'badge number' : 'email';
      return res.status(409).json({ error: `That ${what} is already used by another enforcer.` });
    }
    console.error(err.message);
    return res.status(500).json({ error: 'Something went wrong.' });
  } finally {
    client.release();
  }

  await audit('enforcer_created', `Admin created enforcer account for ${enforcer.email}`, {
    adminId: req.admin.id,
    targetEnforcerId: enforcer.id,
  });

  try {
    await sendLoginEmail(enforcer, tempPassword, hours);
  } catch (mailError) {
    console.error('Could not send account email: ' + mailError.message);
    await audit('enforcer_email_failed', 'Account email could not be sent', {
      adminId: req.admin.id,
      targetEnforcerId: enforcer.id,
    });
    return res.status(201).json({
      id: enforcer.id,
      emailSent: false,
      message: 'Account created, but the email could not be sent. Use "Resend login" to try again.',
    });
  }

  res.status(201).json({
    id: enforcer.id,
    emailSent: true,
    message: `Account created. The temporary password was emailed to ${enforcer.email}.`,
  });
});

// Finds one active enforcer by id, or null.
async function findActive(id) {
  if (!UUID_RULE.test(id)) return null;
  const result = await pool.query(
    'SELECT id, full_name, email FROM enforcers WHERE id = $1 AND is_active',
    [id]
  );
  return result.rows[0] || null;
}

// Force logout: the phone is forgotten. The next login needs password + code.
router.post('/:id/force-logout', async (req, res) => {
  try {
    const enforcer = await findActive(req.params.id);
    if (!enforcer) return res.status(404).json(NOT_FOUND);
    await pool.query(
      'UPDATE enforcers SET device_key_hash = NULL, device_registered_at = NULL WHERE id = $1',
      [enforcer.id]
    );
    await audit('enforcer_force_logout', `Admin forced logout of ${enforcer.email}`, {
      adminId: req.admin.id,
      targetEnforcerId: enforcer.id,
    });
    res.json({ message: `${enforcer.full_name} was logged out.` });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Delete = hide. History stays, the cap and the email are freed, the login ends.
router.delete('/:id', async (req, res) => {
  try {
    const enforcer = await findActive(req.params.id);
    if (!enforcer) return res.status(404).json(NOT_FOUND);
    await pool.query(
      `UPDATE enforcers
       SET is_active = false, cap_id = NULL, device_key_hash = NULL, device_registered_at = NULL
       WHERE id = $1`,
      [enforcer.id]
    );
    await pool.query(
      'UPDATE otp_codes SET used_at = now() WHERE enforcer_id = $1 AND used_at IS NULL',
      [enforcer.id]
    );
    await audit('enforcer_deleted', `Admin deleted (hid) enforcer ${enforcer.email}`, {
      adminId: req.admin.id,
      targetEnforcerId: enforcer.id,
    });
    res.json({ message: `${enforcer.full_name} was deleted. Their history is kept.` });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Resend login: new temporary password, unlocked, phone forgotten. Also works for "forgot password".
router.post('/:id/resend', async (req, res) => {
  try {
    const enforcer = await findActive(req.params.id);
    if (!enforcer) return res.status(404).json(NOT_FOUND);

    const settings = await pool.query('SELECT temp_password_valid_hours FROM app_settings WHERE id = 1');
    const hours = settings.rows[0].temp_password_valid_hours;
    const temp = await newTempPassword();
    await pool.query(
      `UPDATE enforcers
       SET password_hash = $1, must_change_password = true,
           temp_password_expires_at = now() + make_interval(hours => $2),
           failed_login_count = 0, is_locked = false,
           device_key_hash = NULL, device_registered_at = NULL
       WHERE id = $3`,
      [temp.hash, hours, enforcer.id]
    );

    try {
      await sendLoginEmail(enforcer, temp.tempPassword, hours);
    } catch (mailError) {
      console.error('Could not send account email: ' + mailError.message);
      await audit('enforcer_email_failed', 'Resend login email could not be sent', {
        adminId: req.admin.id,
        targetEnforcerId: enforcer.id,
      });
      return res.status(502).json({ error: 'The email could not be sent. Please try "Resend login" again.' });
    }

    await audit('enforcer_login_resent', `Admin resent login to ${enforcer.email}`, {
      adminId: req.admin.id,
      targetEnforcerId: enforcer.id,
    });
    res.json({ message: `A new temporary password was emailed to ${enforcer.email}.` });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Unlock after too many wrong passwords.
router.post('/:id/unlock', async (req, res) => {
  try {
    const enforcer = await findActive(req.params.id);
    if (!enforcer) return res.status(404).json(NOT_FOUND);
    await pool.query(
      'UPDATE enforcers SET is_locked = false, failed_login_count = 0 WHERE id = $1',
      [enforcer.id]
    );
    await audit('enforcer_unlocked', `Admin unlocked ${enforcer.email}`, {
      adminId: req.admin.id,
      targetEnforcerId: enforcer.id,
    });
    res.json({ message: `${enforcer.full_name} was unlocked.` });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

module.exports = router;
