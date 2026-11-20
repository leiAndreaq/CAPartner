// What the phone app sends and reads while an enforcer is logged in.
//   Thresholds: the admin's vital-sign limits, kept on the phone.
//   Readings:   batches of cap readings saved on the phone first (SQLite) and sent when online.
//   Alerts:     SOS and health alerts; event_uid makes a re-sent alert count once.
//   Clips:      camera videos, uploaded one file per request.
// The phone keeps everything until the server says it is saved, so every write here is safe to repeat.
const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const pool = require('../db');
const { audit } = require('../audit');
const { requireEnforcer } = require('../auth');

const router = express.Router();

const UUID_RULE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_READINGS_PER_BATCH = 500;
const MAX_CLIP_BYTES = 200 * 1024 * 1024;
const MEDIA_DIR = path.join(__dirname, '..', 'uploads', 'media');
const NO_CAP = { error: 'No cap is assigned to you yet. Ask your admin to assign one.' };

// A number in [min, max], or null when missing. Throws on anything else.
function numberIn(value, min, max, name) {
  if (value === undefined || value === null) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new Error(`${name} must be a number from ${min} to ${max}.`);
  }
  return number;
}

// A time that is not in the future (2 minutes of clock drift allowed). Throws otherwise.
function pastTime(value, name) {
  const time = new Date(String(value || ''));
  if (Number.isNaN(time.getTime()) || time.getTime() > Date.now() + 2 * 60 * 1000) {
    throw new Error(`${name} must be a valid time that is not in the future.`);
  }
  return time;
}

function text(value, maxLength) {
  if (value === undefined || value === null) return null;
  return String(value).trim().slice(0, maxLength) || null;
}

// THRESHOLDS: the limits the admin set in the web app's settings.
router.get('/settings', requireEnforcer, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT heart_rate_max_bpm, body_temp_max_c, low_battery_threshold_pct, updated_at
       FROM app_settings WHERE id = 1`
    );
    const settings = result.rows[0];
    res.json({
      heartRateMaxBpm: settings.heart_rate_max_bpm,
      bodyTempMaxC: Number(settings.body_temp_max_c),
      lowBatteryPct: settings.low_battery_threshold_pct,
      updatedAt: settings.updated_at,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// READINGS: { readings: [{ recordedAt, heartRateBpm, bodyTempC, motion, latitude, longitude,
//                          batteryPct, connection }] }
// A reading already saved (same cap and recordedAt) is skipped, so a batch can be re-sent.
router.post('/telemetry', requireEnforcer, async (req, res) => {
  const capId = req.enforcer.cap_id;
  if (!capId) return res.status(409).json(NO_CAP);

  const readings = req.body.readings;
  if (!Array.isArray(readings) || readings.length === 0) {
    return res.status(400).json({ error: 'Send at least one reading.' });
  }
  if (readings.length > MAX_READINGS_PER_BATCH) {
    return res.status(400).json({ error: `Send at most ${MAX_READINGS_PER_BATCH} readings at a time.` });
  }

  let rows;
  try {
    rows = readings.map((r, i) => {
      const motion = r.motion ?? null;
      if (motion !== null && !['moving', 'stationary'].includes(motion)) {
        throw new Error(`Reading ${i + 1}: motion must be "moving" or "stationary".`);
      }
      const connection = r.connection ?? 'internet';
      if (!['internet', 'lora', 'offline'].includes(connection)) {
        throw new Error(`Reading ${i + 1}: connection must be "internet", "lora" or "offline".`);
      }
      return [
        pastTime(r.recordedAt, `Reading ${i + 1}: recordedAt`),
        numberIn(r.heartRateBpm, 0, 300, 'heartRateBpm'),
        numberIn(r.bodyTempC, 25, 45, 'bodyTempC'),
        motion,
        numberIn(r.latitude, -90, 90, 'latitude'),
        numberIn(r.longitude, -180, 180, 'longitude'),
        numberIn(r.batteryPct, 0, 100, 'batteryPct'),
        connection,
      ];
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let saved = 0;
    for (const row of rows) {
      const result = await client.query(
        `INSERT INTO telemetry
           (cap_id, enforcer_id, recorded_at, heart_rate_bpm, body_temp_c, motion,
            latitude, longitude, battery_pct, connection)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (cap_id, recorded_at) DO NOTHING`,
        [capId, req.enforcer.id, ...row]
      );
      saved += result.rowCount;
    }

    // The cap's latest state, for the admin's live view.
    const latest = rows.reduce((a, b) => (b[0] > a[0] ? b : a));

    // Connection history: write a row only when the cap's connection type changes.
    const newConnection = latest[7];
    const before = await client.query('SELECT connection FROM caps WHERE id = $1 FOR UPDATE', [capId]);
    if (newConnection !== before.rows[0].connection && newConnection !== 'offline') {
      const hasHistory = (await client.query(
        'SELECT 1 FROM connection_events WHERE cap_id = $1 LIMIT 1', [capId])).rowCount > 0;
      const event = !hasHistory ? 'paired' : newConnection === 'lora' ? 'fallback' : 'restored';
      await client.query(
        `INSERT INTO connection_events (cap_id, occurred_at, connection, event)
         VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
        [capId, latest[0], newConnection, event]
      );
    }
    await client.query(
      `UPDATE caps SET
         last_sync_at = now(),
         connection = $2,
         battery_pct = COALESCE($3, battery_pct),
         last_latitude = COALESCE($4, last_latitude),
         last_longitude = COALESCE($5, last_longitude)
       WHERE id = $1`,
      [capId, latest[7], latest[6], latest[4], latest[5]]
    );
    await client.query('COMMIT');
    res.json({ received: rows.length, saved });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  } finally {
    client.release();
  }
});

// ALERTS: { eventUid, type: 'sos'|'health', origin: 'mobile_app'|'cap_button'|'vitals_rule',
//           title, detail, occurredAt, locationText?, latitude?, longitude?,
//           heartRateBpm?, bodyTempC?, sosHoldSeconds? }
router.post('/alerts', requireEnforcer, async (req, res) => {
  const b = req.body;
  const eventUid = String(b.eventUid || '');
  if (!UUID_RULE.test(eventUid)) return res.status(400).json({ error: 'eventUid must be a UUID.' });

  const kinds = {
    'sos:mobile_app': 'manual',
    'sos:cap_button': 'manual',
    'health:vitals_rule': 'auto',
  };
  const source = kinds[`${b.type}:${b.origin}`];
  if (!source) return res.status(400).json({ error: 'Unknown alert type or origin.' });

  let values;
  try {
    const title = text(b.title, 100);
    const detail = text(b.detail, 2000);
    if (!title || !detail) throw new Error('title and detail are required.');
    values = [
      eventUid,
      b.type,
      source,
      b.origin,
      req.enforcer.cap_id,
      req.enforcer.id,
      title,
      detail,
      text(b.locationText, 200),
      numberIn(b.latitude, -90, 90, 'latitude'),
      numberIn(b.longitude, -180, 180, 'longitude'),
      numberIn(b.heartRateBpm, 0, 300, 'heartRateBpm'),
      numberIn(b.bodyTempC, 25, 45, 'bodyTempC'),
      numberIn(b.sosHoldSeconds, 0, 600, 'sosHoldSeconds'),
      pastTime(b.occurredAt, 'occurredAt'),
    ];
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  try {
    const result = await pool.query(
      `INSERT INTO alerts
         (event_uid, type, source, origin, cap_id, enforcer_id, title, detail, location_text,
          latitude, longitude, heart_rate_bpm, body_temp_c, sos_hold_seconds, occurred_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (event_uid) DO NOTHING
       RETURNING id`,
      values
    );
    if (result.rowCount === 1 && b.type === 'sos') {
      await audit('enforcer_sos', 'Enforcer sent an SOS', { enforcerId: req.enforcer.id });
    }
    const id = result.rows[0]?.id
      ?? (await pool.query('SELECT id FROM alerts WHERE event_uid = $1', [eventUid])).rows[0].id;
    res.json({ id, status: result.rowCount === 1 ? 'created' : 'already_saved' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// ALERT STATUS: the phone asks whether the admin has answered its alert (SOS "help is on the way").
// Read-only, and an enforcer can only see their own alerts. 404 = not found (the phone treats it as "not yet").
router.get('/alerts/:eventUid', requireEnforcer, async (req, res) => {
  if (!UUID_RULE.test(req.params.eventUid)) return res.status(404).json({ error: 'Alert not found.' });
  try {
    const result = await pool.query(
      `SELECT status, acknowledged_at, responder_dispatched
       FROM alerts WHERE event_uid = $1 AND enforcer_id = $2`,
      [req.params.eventUid, req.enforcer.id]
    );
    const alert = result.rows[0];
    if (!alert) return res.status(404).json({ error: 'Alert not found.' });
    res.json({
      status: alert.status,
      acknowledgedAt: alert.acknowledged_at,
      responderDispatched: alert.responder_dispatched,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// CLIPS: the video file is the request body (Content-Type video/mp4).
//   POST /enforcer/media?eventUid=...&recordedAt=...&durationSeconds=...
router.post('/media', requireEnforcer, async (req, res) => {
  const eventUid = String(req.query.eventUid || '');
  if (!UUID_RULE.test(eventUid)) return res.status(400).json({ error: 'eventUid must be a UUID.' });
  if (!String(req.headers['content-type'] || '').startsWith('video/')) {
    return res.status(415).json({ error: 'Send the clip as a video file.' });
  }
  const declared = Number(req.headers['content-length']);
  if (declared > MAX_CLIP_BYTES) return res.status(413).json({ error: 'The clip is too large.' });

  let recordedAt;
  let duration;
  try {
    recordedAt = pastTime(req.query.recordedAt, 'recordedAt');
    duration = numberIn(req.query.durationSeconds, 0, 3600, 'durationSeconds');
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  try {
    const existing = await pool.query(
      `SELECT id, enforcer_id FROM media WHERE event_uid = $1 AND upload_status = 'uploaded'`,
      [eventUid]
    );
    if (existing.rows[0]) {
      req.resume(); // Already have it: drop the re-sent file.
      return res.json({ id: existing.rows[0].id, status: 'already_saved' });
    }

    // Stream to a temporary name, so a broken upload never leaves a half file under the real one.
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
    const fileName = `${crypto.randomUUID()}.mp4`;
    const finalPath = path.join(MEDIA_DIR, fileName);
    const tempPath = `${finalPath}.part`;
    const size = await new Promise((resolve, reject) => {
      let bytes = 0;
      const out = fs.createWriteStream(tempPath);
      req.on('data', (chunk) => {
        bytes += chunk.length;
        if (bytes > MAX_CLIP_BYTES) {
          req.destroy();
          out.destroy();
          reject(Object.assign(new Error('The clip is too large.'), { status: 413 }));
        }
      });
      req.on('aborted', () => reject(new Error('Upload stopped before the end.')));
      out.on('error', reject);
      out.on('finish', () => resolve(bytes));
      req.pipe(out);
    }).catch((err) => {
      fs.rmSync(tempPath, { force: true });
      throw err;
    });
    fs.renameSync(tempPath, finalPath);

    const saved = await pool.query(
      `INSERT INTO media
         (event_uid, source, kind, enforcer_id, cap_id, recorded_at, duration_seconds,
          size_bytes, file_url, upload_status, uploaded_at)
       VALUES ($1, 'phone', 'video', $2, $3, $4, $5, $6, $7, 'uploaded', now())
       ON CONFLICT (event_uid) DO UPDATE SET
         size_bytes = EXCLUDED.size_bytes, file_url = EXCLUDED.file_url,
         upload_status = 'uploaded', uploaded_at = now()
       RETURNING id`,
      [eventUid, req.enforcer.id, req.enforcer.cap_id, recordedAt, duration, size, `media/${fileName}`]
    );
    await audit('enforcer_clip_uploaded', 'Enforcer uploaded a camera clip', {
      enforcerId: req.enforcer.id,
    });
    res.json({ id: saved.rows[0].id, status: 'created' });
  } catch (err) {
    if (err.status === 413) return res.status(413).json({ error: err.message });
    console.error(err.message);
    if (!res.headersSent) res.status(500).json({ error: 'Something went wrong.' });
  }
});

module.exports = router;
