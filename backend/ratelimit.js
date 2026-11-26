// Slows down guessing: each address (IP) may POST only so many times to a path in a time window.
// Kept in memory (no extra package). If anything goes wrong in here, the request is let through,
// so this file can never stop the server or block a normal login.
const hits = new Map(); // "ip|path" -> { count, resetAt }

function limit({ max, windowMs }) {
  return function rateLimit(req, res, next) {
    try {
      if (req.method !== 'POST') return next();
      const now = Date.now();
      const key = `${req.ip}|${req.baseUrl}${req.path}`;
      let entry = hits.get(key);
      if (!entry || entry.resetAt <= now) {
        entry = { count: 0, resetAt: now + windowMs };
        hits.set(key, entry);
      }
      entry.count += 1;
      if (entry.count > max) {
        res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
        return res.status(429).json({ error: 'Too many attempts. Please wait a few minutes and try again.' });
      }
    } catch (err) {
      console.error('Rate limiter problem (request allowed): ' + err.message);
    }
    next();
  };
}

// Forget old entries so memory cannot grow forever.
const cleaner = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of hits) {
    if (entry.resetAt <= now) hits.delete(key);
  }
}, 60 * 1000);
cleaner.unref(); // never keeps the server alive on its own

function resetForTests() {
  hits.clear();
}

module.exports = { limit, resetForTests };
