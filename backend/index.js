require('dotenv').config();
const express = require('express');
const pool = require('./db');

const app = express();
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT count(*) FROM stations');
    res.json({ status: 'ok', stations: result.rows[0].count });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ status: 'error' });
  }
});

app.use('/admin/account', require('./routes/adminAccount'));
app.use('/admin', require('./routes/adminAuth'));
app.use('/enforcers', require('./routes/enforcers'));
app.use('/enforcer', require('./routes/enforcerAuth'));
app.use('/enforcer', require('./routes/enforcerAccount'));
app.use('/', require('./routes/stationData'));

// Safety net: never show error details or file paths to the outside world.
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Bad request.' });
  }
  console.error(err.message);
  res.status(500).json({ error: 'Something went wrong.' });
});

app.listen(process.env.PORT, () => {
  console.log('Backend running on port ' + process.env.PORT);
});
