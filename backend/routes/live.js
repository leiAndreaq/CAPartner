// LIVE CAMERA: the admin watches an enforcer's phone camera live (WebRTC).
//   This server only passes the connection messages (offer / answer / network candidates) between
//   the phone and the admin's browser. The video itself goes straight from the phone to the browser.
//   The phone also records the same video, and uploads it with POST /enforcer/media when the live stops,
//   so it shows up in "Saved recordings".
// Messages are kept in memory and removed as soon as they are read (nothing is stored in the database
// except the audit log lines).
const express = require('express');
const pool = require('../db');
const { audit } = require('../audit');
const { requireAdmin, requireEnforcer } = require('../auth');

const adminRouter = express.Router();
const enforcerRouter = express.Router();
adminRouter.use(requireAdmin);

const UUID_RULE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE_GONE_MS = 20 * 1000; // no poll from the phone for this long = offline
const MAX_QUEUE = 300;

// Free public STUN server works for most same-network and many home networks.
// For phones on mobile data add a TURN server: LIVE_ICE_SERVERS='[{"urls":"turn:...","username":"..","credential":".."}]'
function iceServers() {
  try {
    const custom = JSON.parse(process.env.LIVE_ICE_SERVERS || '');
    if (Array.isArray(custom) && custom.length) return custom;
  } catch (err) {
    // Not set or not valid JSON: use the default below.
  }
  return [{ urls: 'stun:stun.l.google.com:19302' }];
}

// One entry per enforcer: { wantLive, live, sessionId, lastSeen, startedAt, toPhone, toAdmin }
const sessions = new Map();

function sessionOf(enforcerId) {
  if (!sessions.has(enforcerId)) {
    sessions.set(enforcerId, { wantLive: false, live: false, sessionId: 0, lastSeen: 0, startedAt: null, toPhone: [], toAdmin: [] });
  }
  return sessions.get(enforcerId);
}

function stateOf(session) {
  if (Date.now() - session.lastSeen > PHONE_GONE_MS) return 'offline';
  if (session.live) return 'live';
  if (session.wantLive) return 'starting';
  return 'ready';
}

// If the phone stops polling in the middle of a live, the live is over (the phone uploads its recording later).
function expire(session) {
  if (Date.now() - session.lastSeen > PHONE_GONE_MS) {
    session.live = false;
    session.wantLive = false;
    session.toPhone = [];
    session.toAdmin = [];
  }
}

function push(queue, message) {
  queue.push(message);
  if (queue.length > MAX_QUEUE) queue.splice(0, queue.length - MAX_QUEUE);
}

function drain(queue) {
  return queue.splice(0, queue.length);
}

// A valid signal: { type, data (object) }
function readSignal(body, allowedTypes) {
  const type = String(body?.type || '');
  const data = body?.data;
  if (!allowedTypes.includes(type) || !data || typeof data !== 'object' || Array.isArray(data)) return null;
  return { type, data };
}

// ------------------------------------------------------------------ ADMIN

// Every active enforcer with a live state: offline | ready | starting | live
adminRouter.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.id, e.full_name, c.cap_code
       FROM enforcers e LEFT JOIN caps c ON c.id = e.cap_id
       WHERE e.is_active ORDER BY e.created_at, e.full_name`
    );
    res.json({
      iceServers: iceServers(),
      cameras: result.rows.map((row) => {
        const session = sessionOf(row.id);
        expire(session);
        return {
          enforcerId: row.id,
          fullName: row.full_name,
          capCode: row.cap_code,
          state: stateOf(session),
          sessionId: session.sessionId,
          startedAt: session.live ? session.startedAt : null,
        };
      }),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Ask the phone to start streaming.
adminRouter.post('/:id/start', async (req, res) => {
  if (!UUID_RULE.test(req.params.id)) return res.status(404).json({ error: 'Enforcer not found.' });
  try {
    const session = sessionOf(req.params.id);
    expire(session);
    if (stateOf(session) === 'offline') {
      return res.status(409).json({ error: 'This phone is offline, so it cannot go live.' });
    }
    if (session.wantLive || session.live) return res.json({ sessionId: session.sessionId, state: stateOf(session) });
    session.wantLive = true;
    session.sessionId += 1;
    session.toPhone = [];
    session.toAdmin = [];
    await audit('live_started', 'Admin started a live camera view', {
      adminId: req.admin.id,
      targetEnforcerId: req.params.id,
    });
    res.json({ sessionId: session.sessionId, state: 'starting' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Ask the phone to stop streaming. The phone then uploads its recording.
adminRouter.post('/:id/stop', async (req, res) => {
  if (!UUID_RULE.test(req.params.id)) return res.status(404).json({ error: 'Enforcer not found.' });
  try {
    const session = sessionOf(req.params.id);
    if (session.wantLive || session.live) {
      session.wantLive = false;
      await audit('live_stopped', 'Admin stopped a live camera view', {
        adminId: req.admin.id,
        targetEnforcerId: req.params.id,
      });
    }
    res.json({ message: 'Live stopped. The recording is saved when the phone finishes uploading it.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Admin browser -> phone: the answer and network candidates.
adminRouter.post('/:id/signal', (req, res) => {
  if (!UUID_RULE.test(req.params.id)) return res.status(404).json({ error: 'Enforcer not found.' });
  const signal = readSignal(req.body, ['answer', 'ice']);
  if (!signal) return res.status(400).json({ error: 'Bad signal.' });
  const session = sessionOf(req.params.id);
  push(session.toPhone, { ...signal, sessionId: session.sessionId });
  res.json({ ok: true });
});

// Phone -> admin browser: the offer and network candidates. The browser asks every moment or so.
adminRouter.get('/:id/signal', (req, res) => {
  if (!UUID_RULE.test(req.params.id)) return res.status(404).json({ error: 'Enforcer not found.' });
  const session = sessionOf(req.params.id);
  expire(session);
  res.json({ state: stateOf(session), sessionId: session.sessionId, messages: drain(session.toAdmin) });
});

// ------------------------------------------------------------------ PHONE

// The phone asks every second or two. This also tells the server the phone is online.
//   command: 'start' (begin streaming) | 'stop' (end streaming) | null
enforcerRouter.get('/poll', requireEnforcer, (req, res) => {
  const session = sessionOf(req.enforcer.id);
  session.lastSeen = Date.now();
  let command = null;
  if (session.wantLive && !session.live) command = 'start';
  if (!session.wantLive && session.live) command = 'stop';
  res.json({
    command,
    sessionId: session.sessionId,
    iceServers: iceServers(),
    messages: drain(session.toPhone),
  });
});

// The phone says it is streaming ('live') or finished ('stopped').
enforcerRouter.post('/status', requireEnforcer, async (req, res) => {
  const state = String(req.body?.state || '');
  if (!['live', 'stopped'].includes(state)) return res.status(400).json({ error: 'state must be live or stopped.' });
  try {
    const session = sessionOf(req.enforcer.id);
    session.lastSeen = Date.now();
    if (state === 'live') {
      session.live = true;
      session.startedAt = new Date().toISOString();
    } else {
      const wasLive = session.live;
      session.live = false;
      session.wantLive = false;
      session.toPhone = [];
      session.toAdmin = [];
      if (wasLive) {
        await audit('live_ended', 'Live camera ended', { enforcerId: req.enforcer.id });
      }
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Phone -> admin browser: the offer and network candidates.
enforcerRouter.post('/signal', requireEnforcer, (req, res) => {
  const signal = readSignal(req.body, ['offer', 'ice']);
  if (!signal) return res.status(400).json({ error: 'Bad signal.' });
  const session = sessionOf(req.enforcer.id);
  session.lastSeen = Date.now();
  push(session.toAdmin, { ...signal, sessionId: session.sessionId });
  res.json({ ok: true });
});

module.exports = { admin: adminRouter, enforcer: enforcerRouter };
