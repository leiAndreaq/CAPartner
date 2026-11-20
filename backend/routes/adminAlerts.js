// Admin: alerts from the phones (SOS, health). List, mark as read, acknowledge, dispatch, resolve.
// Status goes new -> acknowledged -> resolved. "Read" is per admin (alert_reads);
// "responder dispatched" is its own flag. The 'pending' status is not used.
const express = require('express');
const pool = require('../db');
const { audit } = require('../audit');
const { requireAdmin } = require('../auth');

const router = express.Router();
router.use(requireAdmin);

const STATUSES = ['new', 'acknowledged', 'resolved'];
const TYPES = ['sos', 'health', 'connection', 'device', 'camera'];
const NOT_FOUND = { error: 'Alert not found.' };

function toAlert(a) {
  return {
    id: Number(a.id),
    type: a.type,
    source: a.source,
    origin: a.origin,
    title: a.title,
    detail: a.detail,
    status: a.status,
    isRead: a.is_read,
    enforcer: a.enforcer_id ? { id: a.enforcer_id, fullName: a.enforcer_name, badgeNo: a.badge_no } : null,
    capCode: a.cap_code,
    locationText: a.location_text,
    latitude: a.latitude === null ? null : Number(a.latitude),
    longitude: a.longitude === null ? null : Number(a.longitude),
    heartRateBpm: a.heart_rate_bpm,
    bodyTempC: a.body_temp_c === null ? null : Number(a.body_temp_c),
    sosHoldSeconds: a.sos_hold_seconds,
    acknowledgedBy: a.acknowledged_by_name,
    acknowledgedAt: a.acknowledged_at,
    responderDispatched: a.responder_dispatched,
    responderDispatchedAt: a.responder_dispatched_at,
    occurredAt: a.occurred_at,
    createdAt: a.created_at,
  };
}

// LIST: ?status=new|acknowledged|resolved|open  &type=sos|health|...  &afterId=123  &limit=100
// "open" = not resolved yet. afterId returns only alerts newer than that id (for polling).
router.get('/', async (req, res) => {
  try {
    const status = req.query.status ? String(req.query.status) : null;
    const type = req.query.type ? String(req.query.type) : null;
    if (status && status !== 'open' && !STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Unknown status filter.' });
    }
    if (type && !TYPES.includes(type)) return res.status(400).json({ error: 'Unknown type filter.' });
    const afterId = req.query.afterId ? Number(req.query.afterId) : null;
    if (afterId !== null && !Number.isInteger(afterId)) {
      return res.status(400).json({ error: 'afterId must be a whole number.' });
    }
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 200);

    const result = await pool.query(
      `SELECT a.*, e.full_name AS enforcer_name, e.badge_no, c.cap_code,
              ack.full_name AS acknowledged_by_name, (r.alert_id IS NOT NULL) AS is_read
       FROM alerts a
       LEFT JOIN enforcers e ON e.id = a.enforcer_id
       LEFT JOIN caps c ON c.id = a.cap_id
       LEFT JOIN admins ack ON ack.id = a.acknowledged_by
       LEFT JOIN alert_reads r ON r.alert_id = a.id AND r.admin_id = $1
       WHERE ($2::text IS NULL OR ($2 = 'open' AND a.status <> 'resolved') OR a.status = $2)
         AND ($3::text IS NULL OR a.type = $3)
         AND ($4::bigint IS NULL OR a.id > $4)
       ORDER BY a.created_at DESC, a.id DESC
       LIMIT $5`,
      [req.admin.id, status, type, afterId, limit]
    );

    // Numbers for the badges, whatever the filter.
    const summary = await pool.query(
      `SELECT count(*) FILTER (WHERE a.status <> 'resolved')::int AS open,
              count(*) FILTER (WHERE a.status = 'new')::int AS unacknowledged,
              count(*) FILTER (WHERE a.status = 'new' AND a.type = 'sos')::int AS open_sos,
              count(*) FILTER (WHERE r.alert_id IS NULL)::int AS unread,
              COALESCE(max(a.id), 0)::bigint AS latest_id
       FROM alerts a
       LEFT JOIN alert_reads r ON r.alert_id = a.id AND r.admin_id = $1`,
      [req.admin.id]
    );
    const s = summary.rows[0];
    res.json({
      alerts: result.rows.map(toAlert),
      summary: {
        open: s.open,
        unacknowledged: s.unacknowledged,
        openSos: s.open_sos,
        unread: s.unread,
        latestId: Number(s.latest_id),
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

function alertId(req) {
  return /^\d+$/.test(req.params.id) ? req.params.id : null;
}

// One line for the audit log, without anything private.
async function describe(id) {
  const result = await pool.query(
    `SELECT a.type, e.full_name FROM alerts a LEFT JOIN enforcers e ON e.id = a.enforcer_id WHERE a.id = $1`,
    [id]
  );
  const a = result.rows[0];
  return a ? `alert #${id} (${a.type.toUpperCase()}${a.full_name ? ` from ${a.full_name}` : ''})` : `alert #${id}`;
}

async function markRead(adminId, id) {
  await pool.query(
    'INSERT INTO alert_reads (admin_id, alert_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [adminId, id]
  );
}

// MARK AS READ (safe to repeat)
router.post('/:id/read', async (req, res) => {
  try {
    const id = alertId(req);
    if (!id) return res.status(404).json(NOT_FOUND);
    try {
      await markRead(req.admin.id, id);
    } catch (err) {
      if (err.code === '23503') return res.status(404).json(NOT_FOUND);
      throw err;
    }
    res.json({ message: 'Marked as read.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Runs one status change; answers 404 when the alert is missing, 409 when the change does not apply.
async function change(req, res, sql, auditType, verb, conflictMessage, doneMessage) {
  try {
    const id = alertId(req);
    if (!id) return res.status(404).json(NOT_FOUND);
    const result = await pool.query(sql, [id, req.admin.id]);
    if (result.rowCount === 0) {
      const exists = await pool.query('SELECT 1 FROM alerts WHERE id = $1', [id]);
      return exists.rowCount === 0
        ? res.status(404).json(NOT_FOUND)
        : res.status(409).json({ error: conflictMessage });
    }
    await markRead(req.admin.id, id);
    await audit(auditType, `Admin ${verb} ${await describe(id)}`, {
      adminId: req.admin.id,
      targetEnforcerId: result.rows[0].enforcer_id,
    });
    res.json({ message: doneMessage });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

// ACKNOWLEDGE: new -> acknowledged
router.post('/:id/acknowledge', (req, res) =>
  change(
    req,
    res,
    `UPDATE alerts SET status = 'acknowledged', acknowledged_by = $2, acknowledged_at = now()
     WHERE id = $1 AND status = 'new'
     RETURNING enforcer_id`,
    'alert_acknowledged',
    'acknowledged',
    'This alert was already acknowledged or resolved.',
    'Alert acknowledged.'
  )
);

// RESPONDER DISPATCHED (also acknowledges a new alert)
router.post('/:id/dispatch', (req, res) =>
  change(
    req,
    res,
    `UPDATE alerts SET responder_dispatched = true, responder_dispatched_at = now(),
       status = CASE WHEN status = 'new' THEN 'acknowledged' ELSE status END,
       acknowledged_by = COALESCE(acknowledged_by, $2),
       acknowledged_at = COALESCE(acknowledged_at, now())
     WHERE id = $1 AND NOT responder_dispatched AND status <> 'resolved'
     RETURNING enforcer_id`,
    'alert_dispatched',
    'marked responder dispatched for',
    'A responder was already marked as dispatched, or the alert is resolved.',
    'Responder marked as dispatched.'
  )
);

// RESOLVE (also acknowledges a new alert)
router.post('/:id/resolve', (req, res) =>
  change(
    req,
    res,
    `UPDATE alerts SET status = 'resolved',
       acknowledged_by = COALESCE(acknowledged_by, $2),
       acknowledged_at = COALESCE(acknowledged_at, now())
     WHERE id = $1 AND status <> 'resolved'
     RETURNING enforcer_id`,
    'alert_resolved',
    'resolved',
    'This alert is already resolved.',
    'Alert resolved.'
  )
);

module.exports = router;
