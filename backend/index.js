require('dotenv').config();
const express = require('express');
const pool = require('./db');

// Last line of defence: a stray error is written to the log instead of stopping the whole backend.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled problem (the backend keeps running): ' + (reason && reason.message ? reason.message : reason));
});
process.on('uncaughtException', (err) => {
  console.error('Unexpected problem (the backend keeps running): ' + err.message);
});

const app = express();
app.disable('x-powered-by');

// Simple safety headers on every answer.
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'no-referrer');
  next();
});

// Slow down password / code guessing (per address). Normal use never gets near these numbers.
const { limit } = require('./ratelimit');
const guessLimit = limit({ max: 30, windowMs: 10 * 60 * 1000 });
const emailLimit = limit({ max: 15, windowMs: 10 * 60 * 1000 });
app.use(['/admin/login', '/admin/verify-code', '/enforcer/login', '/enforcer/verify-code', '/enforcer/change-password'], guessLimit);
app.use('/enforcer/forgot-password', emailLimit);

app.use(express.json());
// A request with no JSON body gets an empty one, so the routes answer "field is required" (400)
// instead of failing with a server error (500).
app.use((req, res, next) => {
  if (req.body === undefined) req.body = {};
  next();
});

// A text containing the NUL character (\u0000) makes PostgreSQL throw an error, which would be a 500.
// It is never valid input, so it is refused up front with a clean 400.
function hasNul(value, depth = 0) {
  if (typeof value === 'string') return value.includes('\u0000');
  if (value === null || typeof value !== 'object' || depth > 20) return false;
  return Object.values(value).some((inner) => hasNul(inner, depth + 1));
}
app.use((req, res, next) => {
  if (hasNul(req.body) || hasNul(req.query)) return res.status(400).json({ error: 'Bad request.' });
  next();
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

const live = require('./routes/live');
app.use('/admin/live', live.admin);
app.use('/enforcer/live', live.enforcer);

app.use('/admin/account', require('./routes/adminAccount'));
app.use('/admin', require('./routes/adminAuth'));
app.use('/enforcers', require('./routes/enforcers'));
app.use('/enforcer', require('./routes/enforcerAuth'));
app.use('/enforcer', require('./routes/enforcerAccount'));
app.use('/enforcer', require('./routes/enforcerData'));
app.use('/admin/media', require('./routes/adminMedia'));
app.use('/admin/alerts', require('./routes/adminAlerts'));
app.use('/admin', require('./routes/adminData'));
app.use('/', require('./routes/stationData'));

// Safety net: never show error details or file paths to the outside world.
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Bad request.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'The request is too large.' });
  }
  console.error(err.message);
  res.status(500).json({ error: 'Something went wrong.' });
});

app.listen(process.env.PORT, () => {
  console.log('Backend running on port ' + process.env.PORT);
});
