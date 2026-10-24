// Admin: lists for forms (sectors to pick, caps to assign).
const express = require('express');
const pool = require('../db');
const { requireAdmin } = require('../auth');

const router = express.Router();

router.get('/sectors', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.name, st.name AS station
       FROM sectors s JOIN stations st ON st.id = s.station_id
       ORDER BY s.name`
    );
    res.json({ sectors: result.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Each cap with the active enforcer it belongs to (empty = free to assign).
router.get('/caps', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.cap_code, c.status, c.connection, c.battery_pct, e.full_name AS assigned_to
       FROM caps c
       LEFT JOIN enforcers e ON e.cap_id = c.id AND e.is_active
       ORDER BY c.cap_code`
    );
    res.json({
      caps: result.rows.map((c) => ({
        capCode: c.cap_code,
        status: c.status,
        connection: c.connection,
        batteryPct: c.battery_pct,
        assignedTo: c.assigned_to,
      })),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

module.exports = router;
