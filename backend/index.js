require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT count(*) FROM stations');
    res.json({ status: 'ok', stations: result.rows[0].count });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ status: 'error' });
  }
});

app.listen(process.env.PORT, () => {
  console.log('Backend running on port ' + process.env.PORT);
});