// One-time script: creates the FIRST admin. Refuses to run if an admin already exists.
// Run it yourself:  node create-admin.js
require('dotenv').config();
const readline = require('readline');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
let muted = false;
const originalWrite = rl._writeToOutput.bind(rl);
rl._writeToOutput = (text) => {
  if (!muted) return originalWrite(text);
  if (text.includes('\n') || text.includes('\r')) process.stdout.write('\n');
};

function ask(question, hidden) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      muted = false;
      resolve(answer.trim());
    });
    muted = Boolean(hidden);
  });
}

async function main() {
  const existing = await pool.query('SELECT count(*) FROM admins');
  if (Number(existing.rows[0].count) > 0) {
    console.log('An admin already exists. This script only creates the FIRST admin. Nothing was changed.');
    return;
  }

  const email = (await ask('Admin email: ')).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.log('That does not look like an email address. Nothing was changed.');
    return;
  }
  const fullName = await ask('Admin full name: ');
  if (!fullName) {
    console.log('Name cannot be empty. Nothing was changed.');
    return;
  }
  const password = await ask('Password (nothing shows while you type): ', true);
  if (password.length < 10) {
    console.log('Password must be at least 10 characters. Nothing was changed.');
    return;
  }
  const again = await ask('Type the password again: ', true);
  if (password !== again) {
    console.log('The two passwords are different. Nothing was changed.');
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    'INSERT INTO admins (username, password_hash, full_name, email) VALUES ($1, $2, $3, $4)',
    [email, hash, fullName, email]
  );
  console.log('First admin created: ' + email);
}

main()
  .catch((err) => console.error('Failed: ' + err.message))
  .finally(async () => {
    rl.close();
    await pool.end();
  });