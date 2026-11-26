// SECURITY ATTACK SIMULATION for the CAPartner backend.
//
// Run:  node security-tests/attack-simulation.js        (from the backend folder; also: npm run security)
//
// What it does: starts a SEPARATE copy of the backend on port 3199 (your normal server on 3000 is not touched),
// with e-mail sending and the audit log switched off, so no e-mails are sent and the Activity Log stays clean.
// Then it attacks that copy like a hacker would and prints PASS / FAIL for every attack.
//
// It never tries wrong passwords on real accounts (that would lock them) and it only sends writes that the
// server must refuse before they reach the database. It reads the real database only to learn ids and to prove
// that nothing changed after the attacks.
process.env.PORT = process.env.SECURITY_TEST_PORT || '3199';
require('dotenv').config({ quiet: true });
const jwt = require('jsonwebtoken');

// ---- switch off e-mail and audit log for this run only
function stub(relative, exports) {
  const file = require.resolve(relative);
  require.cache[file] = { id: file, filename: file, loaded: true, exports, children: [], paths: [] };
}
const sentEmails = [];
stub('../audit', { audit: async () => {} });
stub('../mailer', { sendEmail: async (to, subject) => { sentEmails.push({ to, subject }); } });

const pool = require('../db');
const { signAccess, signPending, signStep, signEnforcerAccess } = require('../auth');
const { resetForTests } = require('../ratelimit');
require('../index.js'); // starts listening on PORT

const BASE = `http://127.0.0.1:${process.env.PORT}`;
const SECRET = process.env.JWT_SECRET;
const results = [];
const bodies = []; // every error body, scanned at the end for leaks
let category = '';

const section = (name) => { category = name; };
function record(name, pass, detail = '') {
  results.push({ category, name, pass: Boolean(pass), detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  [${category}] ${name}${detail ? '  -> ' + detail : ''}`);
}
async function check(name, fn) {
  try {
    const out = await fn();
    record(name, out === true || (out && out.pass), out && out.detail ? out.detail : '');
  } catch (err) {
    record(name, false, 'test crashed: ' + err.message);
  }
}

async function call(method, path, { token, body, headers = {}, rawBody, contentType } = {}) {
  const h = { ...headers };
  if (token) h.Authorization = 'Bearer ' + token;
  let payload;
  if (rawBody !== undefined) {
    payload = rawBody;
    h['Content-Type'] = contentType || 'application/json';
  } else if (body !== undefined) {
    payload = JSON.stringify(body);
    h['Content-Type'] = 'application/json';
  }
  const started = Date.now();
  const res = await fetch(BASE + path, { method, headers: h, body: payload });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not JSON */ }
  // Only JSON answers and server errors are scanned for leaks (Express' own 404 page repeats the URL).
  if (res.status >= 400 && (json || res.status >= 500)) bodies.push({ path, status: res.status, text });
  return { status: res.status, headers: res.headers, text, json, ms: Date.now() - started };
}

const UUID0 = '00000000-0000-4000-8000-000000000000';
const SQLI = [
  "' OR '1'='1",
  "' OR 1=1--",
  "admin'--",
  "'; DROP TABLE admins;--",
  '" OR ""="',
  "' UNION SELECT password_hash,null,null FROM admins--",
  "1; SELECT pg_sleep(6)--",
  "' OR (SELECT pg_sleep(6)) IS NULL--",
  "1' AND (SELECT count(*) FROM pg_tables)>0--",
  "\\' OR 1=1 #",
  "x'; UPDATE admins SET is_locked=true;--",
];

async function counts() {
  const q = async (t) => Number((await pool.query(`SELECT count(*) FROM ${t}`)).rows[0].count);
  return {
    admins: await q('admins'), enforcers: await q('enforcers'), alerts: await q('alerts'),
    telemetry: await q('telemetry'), media: await q('media'), audit_logs: await q('audit_logs'),
    otp_codes: await q('otp_codes'),
    adminsLocked: Number((await pool.query('SELECT count(*) FROM admins WHERE is_locked')).rows[0].count),
    settings: JSON.stringify((await pool.query('SELECT * FROM app_settings')).rows),
    enforcerHashes: (await pool.query('SELECT md5(string_agg(password_hash, \',\' ORDER BY id::text)) h FROM enforcers')).rows[0].h,
    adminHash: (await pool.query('SELECT md5(string_agg(password_hash, \',\' ORDER BY id::text)) h FROM admins')).rows[0].h,
  };
}

async function main() {
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(BASE + '/health')).ok) break; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 100));
  }

  // ---- real ids to attack with
  const admin = (await pool.query('SELECT id FROM admins LIMIT 1')).rows[0];
  const enfs = (await pool.query(
    `SELECT id, device_registered_at FROM enforcers WHERE is_active AND device_registered_at IS NOT NULL ORDER BY created_at`)).rows;
  const inactive = (await pool.query('SELECT id FROM enforcers WHERE NOT is_active LIMIT 1')).rows[0];
  const alertsA = (await pool.query('SELECT event_uid FROM alerts WHERE enforcer_id = $1 AND event_uid IS NOT NULL LIMIT 1', [enfs[0].id])).rows[0];
  const alertsB = (await pool.query('SELECT event_uid FROM alerts WHERE enforcer_id = $1 AND event_uid IS NOT NULL LIMIT 1', [enfs[1].id])).rows[0];
  const openOtp = Number((await pool.query(
    'SELECT count(*) FROM otp_codes WHERE admin_id = $1 AND used_at IS NULL AND expires_at > now()', [admin.id])).rows[0].count);
  if (!admin || enfs.length < 2) throw new Error('Need 1 admin and 2 registered enforcers in the database to run.');

  const adminTok = signAccess(admin.id);
  const enfTokA = signEnforcerAccess(enfs[0].id, enfs[0].device_registered_at).token;
  const enfTokB = signEnforcerAccess(enfs[1].id, enfs[1].device_registered_at).token;
  const before = await counts();

  // =====================================================================================
  section('1. Passwords and secrets storage');
  await check('Admin, enforcer and e-mail-code hashes are all valid bcrypt', async () => {
    const r = await pool.query(
      `SELECT bool_and(h ~ '^[$]2[aby][$][0-9][0-9][$][./A-Za-z0-9]{53}$') ok, count(*)::int n FROM
       (SELECT password_hash h FROM admins UNION ALL SELECT password_hash FROM enforcers UNION ALL SELECT code_hash FROM otp_codes) x`);
    return { pass: r.rows[0].ok === true, detail: `${r.rows[0].n} hashes checked` };
  });
  await check('Password hashes use bcrypt cost 12 (admin + enforcers)', async () => {
    const r = await pool.query(`SELECT bool_and(h LIKE '$2_$12$%') ok FROM (SELECT password_hash h FROM admins UNION ALL SELECT password_hash FROM enforcers) x`);
    return r.rows[0].ok === true;
  });
  await check('Phone keys are stored only as SHA-256 hashes', async () => {
    const r = await pool.query(`SELECT bool_and(device_key_hash ~ '^[0-9a-f]{64}$') ok FROM enforcers WHERE device_key_hash IS NOT NULL`);
    return r.rows[0].ok === true;
  });
  await check('JWT secret is at least 32 characters', async () => (SECRET || '').length >= 32);
  await check('Database user is not a superuser and cannot edit or delete the audit log', async () => {
    const r = await pool.query(`SELECT rolsuper, has_table_privilege(current_user,'audit_logs','UPDATE') u, has_table_privilege(current_user,'audit_logs','DELETE') d FROM pg_roles WHERE rolname=current_user`);
    return { pass: !r.rows[0].rolsuper && !r.rows[0].u && !r.rows[0].d, detail: 'audit log is append-only' };
  });
  await check('No password or 6-digit code is written in the audit log text', async () => {
    const r = await pool.query(`SELECT count(*)::int n FROM audit_logs WHERE description ~* '(temporary password:|password is|code is|[0-9]{6})'`);
    return r.rows[0].n === 0;
  });
  await check('API never returns password or device hashes (checked on 6 endpoints)', async () => {
    const paths = ['/enforcers', '/admin/overview', '/admin/alerts', '/admin/audit', '/admin/settings', '/sectors'];
    for (const p of paths) {
      const r = await call('GET', p, { token: adminTok });
      if (/password_hash|device_key|code_hash|\$2[aby]\$/.test(r.text)) return { pass: false, detail: p };
    }
    const me = await call('GET', '/enforcer/me', { token: enfTokA });
    return !/password_hash|device_key|\$2[aby]\$/.test(me.text);
  });

  // =====================================================================================
  section('2. Authentication: every protected route refuses strangers');
  const adminRoutes = [
    ['GET', '/enforcers'], ['POST', '/enforcers'], ['GET', '/sectors'], ['GET', '/caps'], ['GET', '/admin/overview'],
    ['GET', '/admin/settings'], ['PATCH', '/admin/settings'], ['GET', '/admin/preferences'], ['PATCH', '/admin/preferences'],
    ['GET', '/admin/audit'], ['GET', '/admin/alerts'], ['POST', '/admin/alerts/1/read'], ['POST', '/admin/alerts/1/acknowledge'],
    ['POST', '/admin/alerts/1/dispatch'], ['POST', '/admin/alerts/1/resolve'], ['GET', '/admin/media'], ['GET', '/admin/media/1/file'],
    ['DELETE', '/admin/media/1'], ['GET', '/admin/live'], ['POST', `/admin/live/${UUID0}/start`], ['POST', `/admin/live/${UUID0}/stop`],
    ['POST', `/admin/live/${UUID0}/signal`], ['GET', `/admin/live/${UUID0}/signal`], ['GET', '/admin/me'], ['POST', '/admin/logout'],
    ['POST', '/admin/account/change-email/start'], ['POST', '/admin/account/change-email/confirm'],
    ['POST', '/admin/account/change-password/start'], ['POST', '/admin/account/change-password/confirm'],
    ['GET', `/enforcers/${UUID0}/telemetry`], ['PATCH', `/enforcers/${UUID0}`], ['DELETE', `/enforcers/${UUID0}`],
    ['POST', `/enforcers/${UUID0}/force-logout`], ['POST', `/enforcers/${UUID0}/resend`], ['POST', `/enforcers/${UUID0}/unlock`],
  ];
  await check(`All ${adminRoutes.length} admin routes answer 401 with no login pass`, async () => {
    const bad = [];
    for (const [m, p] of adminRoutes) { const r = await call(m, p, m === 'GET' ? {} : { body: {} }); if (r.status !== 401) bad.push(`${m} ${p}=${r.status}`); }
    return { pass: bad.length === 0, detail: bad.join('; ') || `${adminRoutes.length}/${adminRoutes.length} refused` };
  });
  const enfRoutes = [
    ['GET', '/enforcer/me'], ['PATCH', '/enforcer/me'], ['POST', '/enforcer/logout'], ['GET', '/enforcer/settings'],
    ['POST', '/enforcer/telemetry'], ['POST', '/enforcer/alerts'], ['GET', `/enforcer/alerts/${UUID0}`], ['POST', '/enforcer/media'],
    ['POST', '/enforcer/account/change-password/start'], ['POST', '/enforcer/account/change-password/confirm'],
    ['GET', '/enforcer/live/poll'], ['POST', '/enforcer/live/status'], ['POST', '/enforcer/live/signal'],
  ];
  await check(`All ${enfRoutes.length} enforcer routes answer 401 with no login pass`, async () => {
    const bad = [];
    for (const [m, p] of enfRoutes) { const r = await call(m, p, m === 'GET' ? {} : { body: {} }); if (r.status !== 401) bad.push(`${m} ${p}=${r.status}`); }
    return { pass: bad.length === 0, detail: bad.join('; ') || `${enfRoutes.length}/${enfRoutes.length} refused` };
  });
  await check('Garbage / empty / odd Authorization headers are refused', async () => {
    const heads = ['', 'Bearer', 'Bearer ', 'Bearer null', 'Bearer undefined', 'Basic YWRtaW46YWRtaW4=', 'bearer ' + adminTok, 'Bearer  ' + adminTok, adminTok, 'Bearer a.b.c'];
    for (const h of heads) {
      const r = await fetch(BASE + '/admin/overview', { headers: { Authorization: h } });
      if (r.status !== 401) return { pass: false, detail: `"${h.slice(0, 20)}" gave ${r.status}` };
    }
    return true;
  });

  // =====================================================================================
  section('3. Forged and tampered login passes (JWT attacks)');
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const payload = { sub: admin.id, typ: 'admin', lat: Date.now() };
  const forged = {
    'alg:none (no signature)': b64({ alg: 'none', typ: 'JWT' }) + '.' + b64(payload) + '.',
    'alg:none with empty-looking signature': b64({ alg: 'none', typ: 'JWT' }) + '.' + b64(payload) + '.AAAA',
    'signed with a wrong secret': jwt.sign(payload, 'wrong-secret-wrong-secret-wrong-secret-12345', { algorithm: 'HS256' }),
    'signed with the right secret but HS384': jwt.sign(payload, SECRET, { algorithm: 'HS384' }),
    'expired pass': jwt.sign({ ...payload, exp: Math.floor(Date.now() / 1000) - 60 }, SECRET, { algorithm: 'HS256' }),
    'payload edited, old signature kept': (() => { const [h, , s] = adminTok.split('.'); return `${h}.${b64({ ...payload, sub: UUID0 })}.${s}`; })(),
    'signature cut off': adminTok.split('.').slice(0, 2).join('.') + '.',
    'admin pass missing the login-time claim (lat)': jwt.sign({ sub: admin.id, typ: 'admin' }, SECRET, { algorithm: 'HS256' }),
    'admin pass for an id that is not an admin': signAccess(enfs[0].id),
    'admin pass for a deleted / unknown id': signAccess(UUID0),
  };
  for (const [name, tok] of Object.entries(forged)) {
    await check(`Refused: ${name}`, async () => (await call('GET', '/admin/overview', { token: tok })).status === 401);
  }
  await check('Control: a genuine admin pass IS accepted (the test is meaningful)', async () => (await call('GET', '/admin/overview', { token: adminTok })).status === 200);

  // =====================================================================================
  section('4. Privilege escalation and role confusion');
  const wrongTypes = {
    'admin "pending" pass (password ok, code not yet) used as admin pass': signPending(admin.id, 15),
    'enforcer pass used on admin routes': enfTokA,
    'enforcer "pending" pass used as admin pass': signStep({ sub: enfs[0].id, typ: 'enforcer-pending' }, 15),
    'enforcer "setup" pass used as admin pass': signStep({ sub: enfs[0].id, typ: 'enforcer-setup' }, 15),
  };
  for (const [name, tok] of Object.entries(wrongTypes)) {
    await check(`Refused on admin routes: ${name}`, async () => (await call('GET', '/enforcers', { token: tok })).status === 401);
  }
  await check('Admin pass is refused on enforcer routes', async () => (await call('GET', '/enforcer/me', { token: adminTok })).status === 401);
  await check('Enforcer "pending" / "setup" / "reset" steps are refused as full enforcer pass', async () => {
    for (const typ of ['enforcer-pending', 'enforcer-setup', 'enforcer-reset', 'enforcer-reset-pending', 'enforcer-change-password']) {
      const r = await call('GET', '/enforcer/me', { token: signStep({ sub: enfs[0].id, typ, dev: enfs[0].device_registered_at.getTime() }, 15) });
      if (r.status !== 401) return { pass: false, detail: typ };
    }
    return true;
  });
  await check('Old enforcer pass (phone changed / logged out) is refused', async () =>
    (await call('GET', '/enforcer/me', { token: signEnforcerAccess(enfs[0].id, new Date(1000)).token })).status === 401);
  if (inactive) await check('Deleted (hidden) enforcer cannot use a pass', async () =>
    (await call('GET', '/enforcer/me', { token: signEnforcerAccess(inactive.id, new Date()).token })).status === 401);
  await check('Enforcer A cannot read enforcer B\'s alert (IDOR) -> 404', async () => {
    if (!alertsB) return { pass: true, detail: 'skipped: enforcer B has no alert' };
    return (await call('GET', `/enforcer/alerts/${alertsB.event_uid}`, { token: enfTokA })).status === 404;
  });
  await check('Enforcer A can read their own alert (control)', async () => {
    if (!alertsA) return { pass: true, detail: 'skipped: enforcer A has no alert' };
    return (await call('GET', `/enforcer/alerts/${alertsA.event_uid}`, { token: enfTokA })).status === 200;
  });
  await check('Enforcer pass cannot touch another enforcer through the admin telemetry route', async () =>
    (await call('GET', `/enforcers/${enfs[1].id}/telemetry`, { token: enfTokA })).status === 401);
  await check('Admin pending pass cannot be turned into a login without the e-mail code (no code = refused, 7 guesses)', async () => {
    if (openOtp > 0) return { pass: true, detail: 'skipped: a real login code is active right now' };
    const pend = signPending(admin.id, 15);
    for (let i = 0; i < 7; i++) {
      const r = await call('POST', '/admin/verify-code', { body: { pendingToken: pend, code: String(i).repeat(6) } });
      if (r.status !== 401 || r.json?.token) return { pass: false, detail: 'guess ' + i + ' gave ' + r.status };
    }
    return true;
  });

  // =====================================================================================
  section('5. SQL injection');
  resetForTests();
  await check(`Login e-mail field: ${SQLI.length} injection strings (admin) all refused like a normal wrong login, none slow`, async () => {
    for (const p of SQLI) {
      resetForTests();
      const r = await call('POST', '/admin/login', { body: { email: p, password: 'x' } });
      if (![400, 401].includes(r.status) || r.ms > 4000) return { pass: false, detail: `${JSON.stringify(p)} -> ${r.status} in ${r.ms}ms` };
      if (r.status === 401 && r.json?.error !== 'Invalid email or password.') return { pass: false, detail: 'different message for ' + p };
    }
    return true;
  });
  await check('Login password field: injection strings refused (admin, with an unknown e-mail)', async () => {
    for (const p of SQLI) {
      resetForTests();
      const r = await call('POST', '/admin/login', { body: { email: 'nobody@nowhere.invalid', password: p } });
      if (r.status !== 401) return { pass: false, detail: `${JSON.stringify(p)} -> ${r.status}` };
    }
    return true;
  });
  await check('Enforcer login + forgot-password: injection strings refused or answered like an unknown e-mail', async () => {
    const key = 'k'.repeat(40);
    for (const p of SQLI) {
      resetForTests();
      const a = await call('POST', '/enforcer/login', { body: { email: p, password: 'x', deviceKey: key } });
      const b = await call('POST', '/enforcer/forgot-password/start', { body: { email: p, deviceKey: key } });
      if (![400, 401].includes(a.status) || ![200, 400].includes(b.status) || a.ms > 4000 || b.ms > 4000) return { pass: false, detail: `${JSON.stringify(p)} -> ${a.status}/${b.status}` };
    }
    return true;
  });
  await check('Injection in query strings of alerts / audit / telemetry never gives a 500 or a slow answer', async () => {
    const urls = [];
    for (const p of SQLI) {
      const e = encodeURIComponent(p);
      urls.push(`/admin/alerts?status=${e}`, `/admin/alerts?type=${e}`, `/admin/alerts?afterId=${e}`, `/admin/alerts?limit=${e}`,
        `/admin/audit?type=${e}`, `/admin/audit?page=${e}`, `/admin/audit?limit=${e}`,
        `/enforcers/${enfs[0].id}/telemetry?from=${e}`, `/enforcers/${enfs[0].id}/telemetry?to=${e}`);
    }
    for (const u of urls) {
      const r = await call('GET', u, { token: adminTok });
      if (r.status >= 500 || r.ms > 4000) return { pass: false, detail: `${u.slice(0, 70)} -> ${r.status} in ${r.ms}ms` };
    }
    return { pass: true, detail: `${urls.length} requests` };
  });
  await check('Boolean-injection test: audit filter "\' OR \'1\'=\'1" returns 0 rows, not everything', async () => {
    const all = await call('GET', '/admin/audit', { token: adminTok });
    const inj = await call('GET', '/admin/audit?type=' + encodeURIComponent("x' OR '1'='1"), { token: adminTok });
    return { pass: all.json.total > 0 && inj.json.total === 0, detail: `unfiltered ${all.json.total} rows, injected ${inj.json.total} rows` };
  });
  await check('Injection in URL path ids (enforcer / alert / clip / live ids) -> 404, no 500', async () => {
    for (const p of SQLI) {
      const e = encodeURIComponent(p);
      const rs = [
        await call('GET', `/enforcers/${e}/telemetry`, { token: adminTok }),
        await call('DELETE', `/enforcers/${e}`, { token: adminTok }),
        await call('POST', `/enforcers/${e}/unlock`, { token: adminTok }),
        await call('POST', `/admin/alerts/${e}/resolve`, { token: adminTok }),
        await call('DELETE', `/admin/media/${e}`, { token: adminTok }),
        await call('GET', `/admin/media/${e}/file`, { token: adminTok }),
        await call('POST', `/admin/live/${e}/start`, { token: adminTok }),
        await call('GET', `/enforcer/alerts/${e}`, { token: enfTokA }),
      ];
      if (rs.some((r) => r.status >= 500 || r.status === 200)) return { pass: false, detail: JSON.stringify(p) + ' -> ' + rs.map((r) => r.status).join(',') };
    }
    return true;
  });
  await check('Injection in write-body fields is refused before reaching the database (settings, preferences, new enforcer, cap)', async () => {
    const rs = [];
    for (const p of SQLI) {
      rs.push(await call('PATCH', '/admin/settings', { token: adminTok, body: { heart_rate_max_bpm: p } }));
      rs.push(await call('PATCH', '/admin/settings', { token: adminTok, body: { [p]: 100 } }));
      rs.push(await call('PATCH', '/admin/preferences', { token: adminTok, body: { audibleSiren: p } }));
      rs.push(await call('PATCH', '/admin/preferences', { token: adminTok, body: { [p]: true } }));
      rs.push(await call('POST', '/enforcers', { token: adminTok, body: { fullName: p, email: p, sectorId: 99999 } }));
      rs.push(await call('POST', '/enforcers', { token: adminTok, body: { fullName: p, email: 'a@b.co', sectorId: 99999, capCode: p } }));
      rs.push(await call('PATCH', `/enforcers/${enfs[0].id}`, { token: adminTok, body: { capCode: p } }));
      rs.push(await call('POST', '/enforcer/telemetry', { token: enfTokA, body: { readings: [{ recordedAt: p, heartRateBpm: p, bodyTempC: p, latitude: p }] } }));
      rs.push(await call('POST', '/enforcer/alerts', { token: enfTokA, body: { eventUid: p, type: p, origin: p, title: p, detail: p, occurredAt: p } }));
    }
    const bad = rs.filter((r) => r.status >= 500 || r.status < 400);
    return { pass: bad.length === 0, detail: `${rs.length} requests, all answered 4xx` };
  });
  await check('Every SQL statement in the code uses $1/$2 parameters (static scan: no user value glued into SQL)', async () => {
    const { scan, isSafe } = require('./scan-sql');
    const { sqlStrings, found } = scan();
    const unexpected = found.filter((f) => !isSafe(f.code)).map((f) => f.file + ': ' + f.code);
    return { pass: sqlStrings > 30 && unexpected.length === 0, detail: `${sqlStrings} SQL strings scanned, ${found.length} interpolations, all fixed column names / placeholder numbers` + (unexpected.length ? '; UNEXPECTED: ' + unexpected.join(' | ') : '') };
  });

  // =====================================================================================
  section('6. Malformed input, fuzzing, prototype pollution');
  resetForTests();
  const weirdBodies = {
    'object instead of text (NoSQL style) {"$ne":null}': { email: { $ne: null }, password: { $ne: null } },
    'arrays instead of text': { email: ['a@b.co'], password: ['x'] },
    'numbers / booleans / null': { email: 123, password: true },
    'prototype pollution {"__proto__":{"isAdmin":true}}': JSON.parse('{"__proto__":{"isAdmin":true},"email":"x","password":"y"}'),
    'constructor.prototype pollution': { constructor: { prototype: { isAdmin: true } }, email: 'x', password: 'y' },
    '90 KB e-mail string': { email: 'a'.repeat(90000), password: 'x' },
    'deeply nested object': (() => { let o = { a: 1 }; for (let i = 0; i < 400; i++) o = { a: o }; return { email: o, password: 'x' }; })(),
    'unicode / emoji / RTL text': { email: '‮admin@x.com 😈', password: '\uD83D' },
  };
  for (const [name, body] of Object.entries(weirdBodies)) {
    await check(`Login survives: ${name}`, async () => {
      resetForTests();
      const r = await call('POST', '/admin/login', { body });
      const r2 = await call('POST', '/enforcer/login', { body });
      return { pass: r.status < 500 && r2.status < 500 && !r.json?.token && !r2.json?.token, detail: `admin ${r.status}, enforcer ${r2.status}` };
    });
  }
  await check('Object.prototype was not polluted by the pollution attempts', async () => ({}).isAdmin === undefined && ({}).polluted === undefined);
  await check('Null byte (\\u0000) in e-mail does not crash the server', async () => {
    resetForTests();
    const r = await call('POST', '/admin/login', { body: { email: 'a\u0000b@x.com', password: 'x' } });
    const h = await call('GET', '/health');
    return { pass: r.status < 500 && h.status === 200, detail: `login ${r.status}, server alive: ${h.status === 200}` };
  });
  await check('Broken JSON -> 400', async () => (await call('POST', '/admin/login', { rawBody: '{"email": ', })).status === 400);
  await check('Body over 100 KB -> 413 (not a crash)', async () => {
    const r = await call('POST', '/admin/login', { rawBody: JSON.stringify({ email: 'x', password: 'y'.repeat(150000) }) });
    return { pass: r.status === 413, detail: String(r.status) };
  });
  await check('No body / wrong Content-Type -> clean 400, not a server error', async () => {
    resetForTests();
    const a = await call('POST', '/admin/login');
    const b = await call('POST', '/admin/login', { rawBody: 'email=a&password=b', contentType: 'application/x-www-form-urlencoded' });
    const c = await call('POST', '/enforcer/telemetry', { token: enfTokA });
    return { pass: [a, b, c].every((r) => r.status === 400), detail: `${a.status}/${b.status}/${c.status}` };
  });
  await check('Settings: out-of-range, wrong-type and inherited keys are refused', async () => {
    const bad = [
      { heart_rate_max_bpm: 9999 }, { heart_rate_max_bpm: -1 }, { heart_rate_max_bpm: 'abc' }, { heart_rate_max_bpm: null },
      { heart_rate_max_bpm: true }, { heart_rate_max_bpm: Infinity }, { body_temp_max_c: 38.55 }, { low_battery_threshold_pct: 0 },
      { constructor: 5 }, { toString: 5 }, JSON.parse('{"__proto__": 5}'), { hasOwnProperty: 1 }, { not_a_setting: 1 }, {},
    ];
    for (const b of bad) {
      const r = await call('PATCH', '/admin/settings', { token: adminTok, body: b });
      if (r.status !== 400) return { pass: false, detail: JSON.stringify(b) + ' -> ' + r.status };
    }
    return { pass: true, detail: `${bad.length} bad payloads refused` };
  });
  await check('Telemetry: impossible vitals/coordinates/timestamps are refused', async () => {
    const t = new Date().toISOString();
    const bad = [
      { recordedAt: t, heartRateBpm: 9999 }, { recordedAt: t, heartRateBpm: -5 }, { recordedAt: t, bodyTempC: 99 }, { recordedAt: t, latitude: 200 },
      { recordedAt: t, longitude: -999 }, { recordedAt: t, batteryPct: 101 }, { recordedAt: '2999-01-01T00:00:00Z' }, { recordedAt: 'not a date' },
      { recordedAt: t, motion: 'flying' }, { recordedAt: t, connection: 'wifi' }, { recordedAt: t, heartRateBpm: 'NaN' },
    ];
    for (const reading of bad) {
      const r = await call('POST', '/enforcer/telemetry', { token: enfTokA, body: { readings: [reading] } });
      if (r.status !== 400) return { pass: false, detail: JSON.stringify(reading) + ' -> ' + r.status };
    }
    const huge = await call('POST', '/enforcer/telemetry', { token: enfTokA, body: { readings: Array.from({ length: 501 }, () => ({ recordedAt: t })) } });
    return { pass: huge.status === 400, detail: `${bad.length} bad readings + a 501-reading batch refused` };
  });
  await check('Video upload: wrong content type -> 415, bad id -> 400', async () => {
    const a = await call('POST', '/enforcer/media?eventUid=' + UUID0, { token: enfTokA, rawBody: 'x', contentType: 'text/html' });
    const b = await call('POST', '/enforcer/media?eventUid=bad', { token: enfTokA, rawBody: 'x', contentType: 'video/mp4' });
    return { pass: a.status === 415 && b.status === 400, detail: `${a.status}/${b.status}` };
  });

  // =====================================================================================
  section('7. Path traversal and exposed files');
  await check('Cannot read .env, package.json, source code or uploads from the web (unauthenticated)', async () => {
    const paths = ['/.env', '/package.json', '/index.js', '/db.js', '/routes/adminAuth.js', '/node_modules/express/package.json', '/uploads/', '/uploads/media/', '/../.env', '/%2e%2e/.env', '/..%2f.env', '/.git/config'];
    for (const p of paths) {
      const r = await call('GET', p);
      if (r.status === 200 || /JWT_SECRET|DB_PASSWORD|GMAIL_APP|require\(|"dependencies"/.test(r.text)) return { pass: false, detail: p + ' -> ' + r.status };
    }
    return { pass: true, detail: `${paths.length} paths all 404` };
  });
  await check('Clip download route refuses ../ tricks even with a valid admin pass', async () => {
    const tricks = ['..%2F..%2F.env', '%2e%2e%2f%2e%2e%2f.env', '1%2F..%2F..%2F.env', '....//....//.env', '1%00.mp4', 'C%3A%5CWindows%5Cwin.ini', '..%5C..%5C.env'];
    for (const t of tricks) {
      const r = await call('GET', `/admin/media/${t}/file`, { token: adminTok });
      if (r.status === 200 || /JWT_SECRET|\[fonts\]/.test(r.text)) return { pass: false, detail: t };
    }
    return true;
  });

  // =====================================================================================
  section('8. Browser-side attacks: CORS, XSS reflection, clickjacking, headers');
  await check('Another website cannot call the API from a browser (no CORS permission given)', async () => {
    const pre = await fetch(BASE + '/admin/login', { method: 'OPTIONS', headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' } });
    const post = await call('POST', '/admin/login', { headers: { Origin: 'https://evil.example' }, body: { email: 'x', password: 'y' } });
    const hasAcao = pre.headers.get('access-control-allow-origin') || post.headers.get('access-control-allow-origin');
    return { pass: !hasAcao, detail: 'no Access-Control-Allow-Origin header (browser blocks the reply)' };
  });
  await check('Tokens are sent in a header, not a cookie (CSRF-proof): server sets no cookies', async () => {
    const r = await call('POST', '/admin/login', { body: { email: 'x', password: 'y' } });
    return !r.headers.get('set-cookie');
  });
  await check('Script in the URL is not echoed back as HTML', async () => {
    const r = await call('GET', '/<script>alert(1)</script>');
    const q = await call('GET', '/admin/alerts?status=<script>alert(1)</script>', { token: adminTok });
    return { pass: !/<script>/i.test(r.text) && !/<script>/i.test(q.text), detail: `404 body: ${r.text.slice(0, 60).replace(/\s+/g, ' ')}` };
  });
  await check('Every API answer is JSON (nothing the browser could run as a page)', async () => {
    for (const [m, p, t] of [['GET', '/health'], ['GET', '/admin/overview'], ['POST', '/admin/login'], ['GET', '/nope'], ['GET', '/enforcers', adminTok]]) {
      const r = await call(m, p, { token: t, body: m === 'POST' ? {} : undefined });
      if (r.status !== 404 && !/application\/json/.test(r.headers.get('content-type') || '')) return { pass: false, detail: `${m} ${p}` };
    }
    return true;
  });
  await check('Safety headers present: nosniff, X-Frame-Options DENY, no-referrer; no X-Powered-By', async () => {
    const r = await call('GET', '/health');
    return r.headers.get('x-content-type-options') === 'nosniff' && r.headers.get('x-frame-options') === 'DENY' &&
      r.headers.get('referrer-policy') === 'no-referrer' && !r.headers.get('x-powered-by');
  });
  await check('Unusual HTTP methods (PUT, DELETE, PATCH) on login are not accepted', async () => {
    for (const m of ['PUT', 'DELETE', 'PATCH']) {
      const r = await fetch(BASE + '/admin/login', { method: m });
      if (r.status === 200 || r.status >= 500) return { pass: false, detail: `${m} -> ${r.status}` };
    }
    return true;
  });

  // =====================================================================================
  section('9. Information leaks');
  await check('Unknown e-mail and wrong-format login give the SAME message (no account guessing)', async () => {
    resetForTests();
    const a = await call('POST', '/admin/login', { body: { email: 'nobody1@x.com', password: 'abc' } });
    const b = await call('POST', '/admin/login', { body: { email: 'nobody2@y.org', password: 'a much longer password 123!' } });
    const c = await call('POST', '/enforcer/login', { body: { email: 'nobody@x.com', password: 'abc', deviceKey: 'k'.repeat(40) } });
    return { pass: a.status === 401 && b.status === 401 && c.status === 401 && a.text === b.text, detail: a.text };
  });
  await check('Forgot-password answers the same for unknown e-mails (no account guessing) and sends no e-mail', async () => {
    resetForTests();
    const key = 'k'.repeat(40);
    const a = await call('POST', '/enforcer/forgot-password/start', { body: { email: 'nobody-a@x.com', deviceKey: key } });
    const b = await call('POST', '/enforcer/forgot-password/start', { body: { email: 'nobody-b@x.com', deviceKey: key } });
    return { pass: a.status === 200 && b.status === 200 && a.json.message === b.json.message && sentEmails.length === 0, detail: 'same message, 0 e-mails sent' };
  });
  await check('Unknown-account reset pass can never be completed with a guessed code', async () => {
    resetForTests();
    const a = await call('POST', '/enforcer/forgot-password/start', { body: { email: 'nobody-a@x.com', deviceKey: 'k'.repeat(40) } });
    for (const code of ['000000', '123456', '999999']) {
      const r = await call('POST', '/enforcer/forgot-password/verify', { body: { pendingToken: a.json.pendingToken, code } });
      if (r.status !== 401 || r.json?.resetToken) return false;
    }
    return true;
  });
  await check('Public health check reveals no secrets (only ok + number of stations)', async () => {
    const r = await call('GET', '/health');
    return { pass: Object.keys(r.json).sort().join() === 'stations,status', detail: r.text };
  });

  // =====================================================================================
  section('10. Brute force and flooding');
  await check('Admin login: attempt #31 in 10 minutes from one address is blocked with 429 + Retry-After', async () => {
    resetForTests();
    let last;
    for (let i = 0; i < 33; i++) last = await call('POST', '/admin/login', { body: { email: 'nobody@x.com', password: 'x' } });
    return { pass: last.status === 429 && Number(last.headers.get('retry-after')) > 0, detail: 'status ' + last.status };
  });
  await check('E-mail code check (admin + enforcer) is rate limited too', async () => {
    resetForTests();
    let a; let b;
    for (let i = 0; i < 33; i++) {
      a = await call('POST', '/admin/verify-code', { body: { pendingToken: 'x', code: '000000' } });
      b = await call('POST', '/enforcer/verify-code', { body: { pendingToken: 'x', code: '000000' } });
    }
    return { pass: a.status === 429 && b.status === 429, detail: `${a.status}/${b.status}` };
  });
  await check('Forgot-password (sends e-mails) is limited to 15 per 10 minutes', async () => {
    resetForTests();
    let last;
    for (let i = 0; i < 17; i++) last = await call('POST', '/enforcer/forgot-password/start', { body: { email: 'nobody@x.com', deviceKey: 'k'.repeat(40) } });
    return { pass: last.status === 429, detail: 'status ' + last.status };
  });
  await check('Rate limiting does not block normal API use (reads are unlimited)', async () => {
    resetForTests();
    for (let i = 0; i < 60; i++) if ((await call('GET', '/admin/overview', { token: adminTok })).status !== 200) return false;
    return true;
  });
  await check('Server is still healthy after the whole attack run', async () => (await call('GET', '/health')).status === 200);

  // =====================================================================================
  section('11. Damage check: did any attack change the real data?');
  const after = await counts();
  for (const k of Object.keys(before)) {
    await check(`Unchanged: ${k}`, async () => ({ pass: before[k] === after[k], detail: typeof before[k] === 'string' ? '' : `${before[k]} -> ${after[k]}` }));
  }
  await check('No e-mail was sent during the whole run', async () => sentEmails.length === 0);
  await check('Error answers never contain stack traces, file paths or SQL text', async () => {
    const leak = bodies.find((b) => /node_modules|[A-Za-z]:\\|\/routes\/|\.js:\d+|at \w+.*\(|SELECT |INSERT |UPDATE |syntax error|pg_|stack/i.test(b.text));
    return { pass: !leak, detail: leak ? `${leak.path}: ${leak.text.slice(0, 80)}` : `${bodies.length} error answers scanned` };
  });
}

main()
  .catch((err) => { console.error('SETUP PROBLEM: ' + err.message); results.push({ category: 'setup', name: err.message, pass: false }); })
  .finally(async () => {
    const failed = results.filter((r) => !r.pass);
    console.log('\n==================== SUMMARY ====================');
    const byCat = {};
    for (const r of results) { (byCat[r.category] ||= { pass: 0, fail: 0 })[r.pass ? 'pass' : 'fail']++; }
    for (const [c, v] of Object.entries(byCat)) console.log(`${v.fail === 0 ? 'OK  ' : 'FAIL'} ${c}: ${v.pass}/${v.pass + v.fail} passed`);
    console.log(`\nTOTAL: ${results.length - failed.length}/${results.length} passed, ${failed.length} failed`);
    if (failed.length) { console.log('\nFAILED:'); failed.forEach((f) => console.log(` - [${f.category}] ${f.name} ${f.detail || ''}`)); }
    try { await pool.end(); } catch { /* ignore */ }
    process.exit(failed.length ? 1 : 0);
  });
