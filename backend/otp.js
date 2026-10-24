// 6-digit email codes for enforcers and for admin account changes.
// owner is { adminId } or { enforcerId }. Codes are stored only as a hash.
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('./db');

const MAX_CODE_TRIES = 5;

function ownerColumn(owner) {
  if (owner.adminId) return ['admin_id', owner.adminId];
  if (owner.enforcerId) return ['enforcer_id', owner.enforcerId];
  throw new Error('Code owner is missing');
}

// Makes a new code (older unused codes for the same purpose stop working).
async function createCode(owner, purpose, minutes) {
  const [column, id] = ownerColumn(owner);
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const codeHash = await bcrypt.hash(code, 10);

  await pool.query(
    `UPDATE otp_codes SET used_at = now()
     WHERE ${column} = $1 AND purpose = $2 AND used_at IS NULL`,
    [id, purpose]
  );
  const saved = await pool.query(
    `INSERT INTO otp_codes (${column}, purpose, code_hash, expires_at)
     VALUES ($1, $2, $3, now() + make_interval(mins => $4))
     RETURNING id`,
    [id, purpose, codeHash, minutes]
  );
  return { code, id: saved.rows[0].id };
}

async function cancelCode(codeId) {
  await pool.query('UPDATE otp_codes SET used_at = now() WHERE id = $1', [codeId]);
}

// Returns { ok: true } or { ok: false, reason: 'none' | 'blocked' | 'wrong', triesLeft }.
async function checkCode(owner, purpose, code) {
  const [column, id] = ownerColumn(owner);
  if (!/^\d{6}$/.test(String(code || ''))) return { ok: false, reason: 'none' };

  const found = await pool.query(
    `SELECT id, code_hash FROM otp_codes
     WHERE ${column} = $1 AND purpose = $2
       AND used_at IS NULL AND expires_at > now()
     ORDER BY created_at DESC LIMIT 1`,
    [id, purpose]
  );
  const otp = found.rows[0];
  if (!otp) return { ok: false, reason: 'none' };

  // Count this try first, so fast parallel guesses cannot beat the limit.
  const counted = await pool.query(
    `UPDATE otp_codes SET attempts = attempts + 1
     WHERE id = $1 AND used_at IS NULL AND attempts < $2
     RETURNING attempts`,
    [otp.id, MAX_CODE_TRIES]
  );
  if (counted.rowCount === 0) {
    await cancelCode(otp.id);
    return { ok: false, reason: 'blocked' };
  }

  if (!(await bcrypt.compare(String(code), otp.code_hash))) {
    return { ok: false, reason: 'wrong', triesLeft: MAX_CODE_TRIES - counted.rows[0].attempts };
  }

  // Right code: it works once only.
  const used = await pool.query(
    'UPDATE otp_codes SET used_at = now() WHERE id = $1 AND used_at IS NULL RETURNING id',
    [otp.id]
  );
  return used.rowCount === 1 ? { ok: true } : { ok: false, reason: 'none' };
}

// Turns a failed check into the answer sent to the app.
function codeError(result) {
  if (result.reason === 'wrong') return { error: 'Wrong code.', triesLeft: result.triesLeft };
  if (result.reason === 'blocked') return { error: 'Too many wrong codes. Please start again.' };
  return { error: 'Invalid or expired code. Please start again.' };
}

module.exports = { createCode, cancelCode, checkCode, codeError };
