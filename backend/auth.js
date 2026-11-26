// Login passes (tokens) and the guard that protects admin-only routes.
require('dotenv').config();
const jwt = require('jsonwebtoken');
const pool = require('./db');

const SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET.length < 32) {
  throw new Error('JWT_SECRET is missing or too short. Add a long random value to .env');
}

// "pending" = password was right, waiting for the email code. It can do nothing else.
function signPending(adminId, minutes) {
  return jwt.sign({ sub: adminId, typ: 'admin-pending' }, SECRET, {
    algorithm: 'HS256',
    expiresIn: minutes * 60,
  });
}

// "admin" = fully logged in, until the admin clicks Log out (no time limit; the web app keeps it
// only while the browser is open). lat = login time in milliseconds; Log out writes 'admin_logout'
// to the audit log, and requireAdmin refuses every pass made before that.
function signAccess(adminId) {
  return jwt.sign({ sub: adminId, typ: 'admin', lat: Date.now() }, SECRET, { algorithm: 'HS256' });
}

// Any short-lived pass for one step (example: 'enforcer-pending', 'admin-change-email').
function signStep(payload, minutes) {
  return jwt.sign(payload, SECRET, { algorithm: 'HS256', expiresIn: minutes * 60 });
}

// The enforcer's weekly login ends Sunday 11:59:59 PM Philippine time (UTC+8, no daylight saving).
function sundayCutoff(now = new Date()) {
  const MANILA_MS = 8 * 60 * 60 * 1000;
  const local = new Date(now.getTime() + MANILA_MS);
  const daysToSunday = (7 - local.getUTCDay()) % 7;
  const end = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate() + daysToSunday,
    23, 59, 59
  );
  return new Date(end - MANILA_MS);
}

// "enforcer" = fully logged in on one registered phone, until Sunday night.
// dev = when that phone was registered; logout and force logout change it, which ends this pass.
function signEnforcerAccess(enforcerId, deviceRegisteredAt) {
  const expiresAt = sundayCutoff();
  const token = jwt.sign(
    {
      sub: enforcerId,
      typ: 'enforcer',
      dev: new Date(deviceRegisteredAt).getTime(),
      exp: Math.floor(expiresAt.getTime() / 1000),
    },
    SECRET,
    { algorithm: 'HS256' }
  );
  return { token, expiresAt };
}

function readToken(token, expectedType) {
  try {
    const payload = jwt.verify(token, SECRET, { algorithms: ['HS256'] });
    return payload.typ === expectedType ? payload : null;
  } catch (err) {
    return null;
  }
}

// Put this in front of any route that only a fully logged-in admin may use.
async function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const payload = readToken(token, 'admin');
    if (!payload || typeof payload.lat !== 'number') return res.status(401).json({ error: 'Please log in.' });

    const result = await pool.query(
      `SELECT a.id, a.email, a.full_name, a.is_active, a.is_locked,
              (SELECT max(l.occurred_at) FROM audit_logs l
                WHERE l.actor_admin_id = a.id AND l.action_type = 'admin_logout') AS last_logout_at
       FROM admins a WHERE a.id = $1`,
      [payload.sub]
    );
    const admin = result.rows[0];
    if (!admin || !admin.is_active || admin.is_locked) {
      return res.status(401).json({ error: 'Please log in.' });
    }
    // Logged out after this pass was made: the pass no longer works.
    if (admin.last_logout_at && admin.last_logout_at.getTime() >= payload.lat) {
      return res.status(401).json({ error: 'Please log in.' });
    }
    delete admin.last_logout_at;
    req.admin = admin;
    next();
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

// Put this in front of any route that only a logged-in enforcer may use.
async function requireEnforcer(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const payload = readToken(token, 'enforcer');
    if (!payload) return res.status(401).json({ error: 'Please log in.' });

    const result = await pool.query(
      `SELECT id, email, full_name, sector_id, cap_id, is_active, is_locked, device_registered_at
       FROM enforcers WHERE id = $1`,
      [payload.sub]
    );
    const enforcer = result.rows[0];
    if (
      !enforcer ||
      !enforcer.is_active ||
      enforcer.is_locked ||
      !enforcer.device_registered_at ||
      enforcer.device_registered_at.getTime() !== payload.dev
    ) {
      return res.status(401).json({ error: 'Please log in.' });
    }
    req.enforcer = enforcer;
    next();
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

module.exports = {
  signPending,
  signAccess,
  signStep,
  signEnforcerAccess,
  sundayCutoff,
  readToken,
  requireAdmin,
  requireEnforcer,
};
