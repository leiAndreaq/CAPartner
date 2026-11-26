// Unlocks an admin account that was locked by too many wrong passwords.
// Run it yourself on the computer that has the backend:  node unlock-admin.js
// It does not start the server, and it changes nothing except the lock and the wrong-password counter.
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function main() {
  const result = await pool.query(
    `UPDATE admins SET is_locked = false, failed_login_count = 0
     WHERE is_locked RETURNING id, email`
  );
  if (result.rowCount === 0) {
    console.log('No admin account is locked. Nothing was changed.');
    return;
  }
  for (const admin of result.rows) {
    await pool.query(
      `INSERT INTO audit_logs (action_type, description, target_enforcer_id)
       VALUES ('admin_unlocked', $1, NULL)`,
      [`Admin account ${admin.email} was unlocked from the server computer`]
    );
    console.log('Unlocked: ' + admin.email);
  }
}

main()
  .catch((err) => {
    console.error('Could not unlock: ' + err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
