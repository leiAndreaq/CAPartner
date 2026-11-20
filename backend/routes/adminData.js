// Admin: live overview, system settings, own preferences, activity (audit) log.
// Mounted at /admin next to the login routes, so every route checks requireAdmin itself.
const express = require('express');
const pool = require('../db');
const { audit } = require('../audit');
const { requireAdmin } = require('../auth');

const router = express.Router();

// A cap counts as offline when the phone has not synced for this long (it syncs every minute).
const OFFLINE_AFTER_MINUTES = 5;

// OVERVIEW: every cap with its latest state, worked out from the newest data
// (caps.status is not trusted; nothing keeps it up to date).
//   offline   = no sync for OFFLINE_AFTER_MINUTES
//   attention = an alert that is not resolved, or (while online) the latest reading is over
//               the admin's limits, or the battery is low
router.get('/overview', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.cap_code, c.battery_pct, c.connection, c.last_sync_at,
              c.last_latitude, c.last_longitude,
              e.id AS enforcer_id, e.full_name, e.badge_no, s.name AS sector,
              t.recorded_at, t.heart_rate_bpm, t.body_temp_c, t.motion,
              (c.last_sync_at IS NULL OR c.last_sync_at < now() - make_interval(mins => $1)) AS is_offline,
              (SELECT count(*)::int FROM alerts a
                WHERE a.status <> 'resolved'
                  AND (a.cap_id = c.id OR (e.id IS NOT NULL AND a.enforcer_id = e.id))) AS open_alerts,
              st.heart_rate_max_bpm, st.body_temp_max_c, st.low_battery_threshold_pct
       FROM caps c
       CROSS JOIN app_settings st
       LEFT JOIN enforcers e ON e.cap_id = c.id AND e.is_active
       LEFT JOIN sectors s ON s.id = e.sector_id
       LEFT JOIN LATERAL (
         SELECT recorded_at, heart_rate_bpm, body_temp_c, motion
         FROM telemetry WHERE cap_id = c.id
         ORDER BY recorded_at DESC LIMIT 1
       ) t ON true
       WHERE st.id = 1
       ORDER BY c.cap_code`,
      [OFFLINE_AFTER_MINUTES]
    );

    const caps = result.rows.map((r) => {
      const reasons = [];
      if (r.open_alerts > 0) reasons.push(`${r.open_alerts} open alert${r.open_alerts > 1 ? 's' : ''}`);
      if (!r.is_offline) {
        if (r.heart_rate_bpm !== null && r.heart_rate_bpm > r.heart_rate_max_bpm) reasons.push('High heart rate');
        if (r.body_temp_c !== null && Number(r.body_temp_c) > Number(r.body_temp_max_c)) {
          reasons.push('High body temperature');
        }
        if (r.battery_pct !== null && r.battery_pct < r.low_battery_threshold_pct) reasons.push('Low battery');
      }
      const status = reasons.length > 0 ? 'attention' : r.is_offline ? 'offline' : 'normal';
      return {
        capCode: r.cap_code,
        status,
        attentionReasons: reasons,
        connection: r.is_offline ? 'offline' : r.connection,
        batteryPct: r.battery_pct,
        lastSyncAt: r.last_sync_at,
        latitude: r.last_latitude === null ? null : Number(r.last_latitude),
        longitude: r.last_longitude === null ? null : Number(r.last_longitude),
        enforcer: r.enforcer_id
          ? { id: r.enforcer_id, fullName: r.full_name, badgeNo: r.badge_no, sector: r.sector }
          : null,
        latest: r.recorded_at
          ? {
              recordedAt: r.recorded_at,
              heartRateBpm: r.heart_rate_bpm,
              bodyTempC: r.body_temp_c === null ? null : Number(r.body_temp_c),
              motion: r.motion,
            }
          : null,
        openAlerts: r.open_alerts,
      };
    });

    const openAlerts = await pool.query("SELECT count(*)::int AS n FROM alerts WHERE status <> 'resolved'");
    res.json({
      offlineAfterMinutes: OFFLINE_AFTER_MINUTES,
      counts: {
        caps: caps.length,
        online: caps.filter((c) => c.connection !== 'offline').length,
        needsAttention: caps.filter((c) => c.status === 'attention').length,
        openAlerts: openAlerts.rows[0].n,
      },
      caps,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// SETTINGS: the same limits as the CHECK rules in database/schema.sql.
const SETTING_RULES = {
  heart_rate_max_bpm: { min: 60, max: 250, label: 'Max heart rate (BPM)' },
  body_temp_max_c: { min: 35, max: 43, decimals: 1, label: 'Max body temperature (°C)' },
  low_battery_threshold_pct: { min: 1, max: 99, label: 'Low battery (%)' },
  max_failed_logins: { min: 1, max: 10, label: 'Wrong passwords before lock' },
  otp_valid_minutes: { min: 1, max: 30, label: 'Email code valid (minutes)' },
  temp_password_valid_hours: { min: 1, max: 336, label: 'Temporary password valid (hours)' },
  max_enforcers: { min: 1, max: 50, label: 'Max enforcer accounts' },
};

async function readSettings() {
  const result = await pool.query(
    `SELECT s.*, a.full_name AS updated_by_name
     FROM app_settings s LEFT JOIN admins a ON a.id = s.updated_by_admin_id
     WHERE s.id = 1`
  );
  const s = result.rows[0];
  const values = {};
  for (const key of Object.keys(SETTING_RULES)) values[key] = Number(s[key]);
  return { values, rules: SETTING_RULES, updatedAt: s.updated_at, updatedBy: s.updated_by_name };
}

router.get('/settings', requireAdmin, async (req, res) => {
  try {
    res.json(await readSettings());
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Body: any of the SETTING_RULES keys. Only the given ones change.
router.patch('/settings', requireAdmin, async (req, res) => {
  const changes = {};
  for (const [key, value] of Object.entries(req.body || {})) {
    // Own keys only: names like "constructor" or "__proto__" must not count as settings.
    const rule = Object.hasOwn(SETTING_RULES, key) ? SETTING_RULES[key] : null;
    if (!rule) return res.status(400).json({ error: `Unknown setting: ${/^\w{1,40}$/.test(key) ? key : '(invalid name)'}.` });
    const number = Number(value);
    const step = rule.decimals ? 10 ** rule.decimals : 1;
    if (
      value === null || value === '' || typeof value === 'boolean' || !Number.isFinite(number) ||
      Math.abs(Math.round(number * step) - number * step) > 1e-9
    ) {
      return res.status(400).json({
        error: `${rule.label} must be a ${rule.decimals ? 'number with at most 1 decimal' : 'whole number'}.`,
      });
    }
    if (number < rule.min || number > rule.max) {
      return res.status(400).json({ error: `${rule.label} must be from ${rule.min} to ${rule.max}.` });
    }
    changes[key] = rule.decimals ? Math.round(number * step) / step : number;
  }
  if (Object.keys(changes).length === 0) return res.status(400).json({ error: 'Nothing to change.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const before = (await client.query('SELECT * FROM app_settings WHERE id = 1 FOR UPDATE')).rows[0];

    if (changes.max_enforcers !== undefined) {
      const active = await client.query('SELECT count(*)::int AS n FROM enforcers WHERE is_active');
      if (changes.max_enforcers < active.rows[0].n) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: `There are already ${active.rows[0].n} active enforcers. Delete some first, or keep the limit at ${active.rows[0].n} or more.`,
        });
      }
    }

    const keys = Object.keys(changes).filter((k) => Number(before[k]) !== changes[k]);
    if (keys.length > 0) {
      const sets = keys.map((k, i) => `${k} = $${i + 1}`);
      await client.query(
        `UPDATE app_settings SET ${sets.join(', ')}, updated_by_admin_id = $${keys.length + 1}, updated_at = now()
         WHERE id = 1`,
        [...keys.map((k) => changes[k]), req.admin.id]
      );
    }
    await client.query('COMMIT');

    if (keys.length > 0) {
      const list = keys.map((k) => `${SETTING_RULES[k].label} ${Number(before[k])} -> ${changes[k]}`).join('; ');
      await audit('settings_updated', `Admin changed settings: ${list}`, { adminId: req.admin.id });
    }
    res.json({ message: keys.length > 0 ? 'Settings saved.' : 'No changes.', ...(await readSettings()) });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  } finally {
    client.release();
  }
});

// PREFERENCES: this admin's own switches. The row is made with the defaults on first use.
const PREFERENCES = {
  audible_siren: 'audibleSiren',
  desktop_notifications: 'desktopNotifications',
  lora_fallback_alerts: 'loraFallbackAlerts',
  low_battery_warnings: 'lowBatteryWarnings',
  gps_sync: 'gpsSync',
};

async function readPreferences(adminId) {
  await pool.query('INSERT INTO admin_preferences (admin_id) VALUES ($1) ON CONFLICT DO NOTHING', [adminId]);
  const row = (await pool.query('SELECT * FROM admin_preferences WHERE admin_id = $1', [adminId])).rows[0];
  const prefs = {};
  for (const [column, name] of Object.entries(PREFERENCES)) prefs[name] = row[column];
  return prefs;
}

router.get('/preferences', requireAdmin, async (req, res) => {
  try {
    res.json(await readPreferences(req.admin.id));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Body: any of { audibleSiren, desktopNotifications, loraFallbackAlerts, lowBatteryWarnings, gpsSync } as true/false.
router.patch('/preferences', requireAdmin, async (req, res) => {
  try {
    const byName = Object.fromEntries(Object.entries(PREFERENCES).map(([c, n]) => [n, c]));
    const changes = [];
    for (const [name, value] of Object.entries(req.body || {})) {
      if (!Object.hasOwn(byName, name)) return res.status(400).json({ error: `Unknown preference: ${/^\w{1,40}$/.test(name) ? name : '(invalid name)'}.` });
      if (typeof value !== 'boolean') return res.status(400).json({ error: `${name} must be true or false.` });
      changes.push([byName[name], value, name]);
    }
    if (changes.length === 0) return res.status(400).json({ error: 'Nothing to change.' });

    await readPreferences(req.admin.id); // makes the row if needed
    await pool.query(
      `UPDATE admin_preferences SET ${changes.map(([c], i) => `${c} = $${i + 2}`).join(', ')} WHERE admin_id = $1`,
      [req.admin.id, ...changes.map(([, v]) => v)]
    );
    await audit(
      'preferences_updated',
      `Admin changed preferences: ${changes.map(([, v, n]) => `${n} ${v ? 'on' : 'off'}`).join(', ')}`,
      { adminId: req.admin.id }
    );
    res.json({ message: 'Preferences saved.', ...(await readPreferences(req.admin.id)) });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// ACTIVITY LOG: ?type=enforcer_created  &page=1  &limit=25. Newest first.
router.get('/audit', requireAdmin, async (req, res) => {
  try {
    const type = req.query.type ? String(req.query.type).slice(0, 30) : null;
    const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
    const page = Math.max(Number(req.query.page) || 1, 1);

    const total = await pool.query(
      'SELECT count(*)::int AS n FROM audit_logs WHERE ($1::text IS NULL OR action_type = $1)',
      [type]
    );
    const result = await pool.query(
      `SELECT l.id, l.occurred_at, l.action_type, l.description, l.username_tried,
              a.full_name AS admin_name, ae.full_name AS enforcer_name, te.full_name AS target_name
       FROM audit_logs l
       LEFT JOIN admins a ON a.id = l.actor_admin_id
       LEFT JOIN enforcers ae ON ae.id = l.actor_enforcer_id
       LEFT JOIN enforcers te ON te.id = l.target_enforcer_id
       WHERE ($1::text IS NULL OR l.action_type = $1)
       ORDER BY l.occurred_at DESC, l.id DESC
       LIMIT $2 OFFSET $3`,
      [type, limit, (page - 1) * limit]
    );
    const types = await pool.query('SELECT DISTINCT action_type FROM audit_logs ORDER BY action_type');

    res.json({
      entries: result.rows.map((l) => ({
        id: Number(l.id),
        occurredAt: l.occurred_at,
        type: l.action_type,
        description: l.description,
        actor: l.admin_name
          ? { kind: 'admin', name: l.admin_name }
          : l.enforcer_name
            ? { kind: 'enforcer', name: l.enforcer_name }
            : { kind: 'unknown', name: l.username_tried || 'Unknown' },
        target: l.target_name,
      })),
      total: total.rows[0].n,
      page,
      pages: Math.max(Math.ceil(total.rows[0].n / limit), 1),
      types: types.rows.map((t) => t.action_type),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

module.exports = router;
