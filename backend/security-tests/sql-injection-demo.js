// SQL INJECTION DEMO (read-only): the same attack against an UNSAFE query and against the way CAPartner does it.
// Run:  node security-tests/sql-injection-demo.js     (also: npm run security:demo)
// It only reads. Nothing is changed.
require('dotenv').config({ quiet: true });
const pool = require('../db');

const attack = "x' OR '1'='1";

(async () => {
  const total = Number((await pool.query('SELECT count(*) FROM audit_logs')).rows[0].count);
  console.log(`The audit log has ${total} rows. A search for the action type  ${attack}  should find 0 rows (no such type).\n`);

  // UNSAFE: the user's text is glued into the SQL (what hackers hope for). NOT used anywhere in CAPartner.
  const unsafeSql = `SELECT count(*) FROM audit_logs WHERE action_type = '${attack}'`;
  const unsafe = Number((await pool.query(unsafeSql)).rows[0].count);
  console.log('UNSAFE way (text glued into SQL):');
  console.log('  SQL sent to the database -> ' + unsafeSql);
  console.log(`  rows found               -> ${unsafe}   ${unsafe === total ? '<-- INJECTION WORKED: the attacker got every row' : ''}\n`);

  // SAFE: how CAPartner does it (routes/adminData.js): the text travels separately as a parameter.
  const safeSql = 'SELECT count(*) FROM audit_logs WHERE ($1::text IS NULL OR action_type = $1)';
  const safe = Number((await pool.query(safeSql, [attack])).rows[0].count);
  console.log('SAFE way (CAPartner: parameter $1):');
  console.log('  SQL sent to the database -> ' + safeSql);
  console.log('  value sent separately    -> ' + JSON.stringify(attack));
  console.log(`  rows found               -> ${safe}   ${safe === 0 ? '<-- the attack text was treated as plain data, so it matched nothing' : ''}\n`);

  console.log(unsafe === total && safe === 0 ? 'RESULT: parameterized queries stop the injection.' : 'RESULT: unexpected, check the output above.');
  await pool.end();
})().catch((err) => { console.error(err.message); process.exit(1); });
