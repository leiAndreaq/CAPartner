// Writes one line to the audit log. Never put passwords or codes in the description.
const pool = require('./db');

async function audit(actionType, description, who = {}) {
  try {
    await pool.query(
      `INSERT INTO audit_logs
         (action_type, description, actor_admin_id, actor_enforcer_id, target_enforcer_id, username_tried)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        actionType,
        description,
        who.adminId || null,
        who.enforcerId || null,
        who.targetEnforcerId || null,
        who.usernameTried ? String(who.usernameTried).slice(0, 50) : null,
      ]
    );
  } catch (err) {
    // A problem with the log must never break a login.
    console.error('Audit log failed: ' + err.message);
  }
}

module.exports = { audit };
