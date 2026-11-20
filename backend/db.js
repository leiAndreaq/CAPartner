// One shared connection to the database. Every file uses this one.
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// An idle database connection can break (database restarted, network cut). Without this line Node
// treats that as an unhandled error and stops the whole backend. Now it is only logged, and the pool
// opens a fresh connection on the next request.
pool.on('error', (err) => {
  console.error('Database connection problem (the backend keeps running): ' + err.message);
});

module.exports = pool;
