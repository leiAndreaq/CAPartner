// Tests that need NO database and send NO email. Run with:  npm test
const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const { checkStrength, makeTempPassword } = require('../passwords');
const { signPending, signAccess, signEnforcerAccess, readToken, sundayCutoff } = require('../auth');
const { limit, resetForTests } = require('../ratelimit');

test('password rules', () => {
  assert.ok(checkStrength('short1!A', 'a@b.com'), 'too short must be refused');
  assert.ok(checkStrength('alllowercase1!', 'a@b.com'), 'no capital must be refused');
  assert.ok(checkStrength('ALLUPPERCASE1!', 'a@b.com'), 'no small letter must be refused');
  assert.ok(checkStrength('NoDigitsHere!!', 'a@b.com'), 'no digit must be refused');
  assert.ok(checkStrength('NoSymbols1234A', 'a@b.com'), 'no symbol must be refused');
  assert.strictEqual(checkStrength('Str0ng-Passw0rd!', 'a@b.com'), null);
});

test('temporary passwords are strong and different each time', () => {
  const seen = new Set();
  for (let i = 0; i < 50; i++) {
    const password = makeTempPassword();
    assert.strictEqual(password.length, 12);
    assert.strictEqual(checkStrength(password, 'a@b.com'), null);
    seen.add(password);
  }
  assert.ok(seen.size > 45);
});

test('login passes only work for their own type', () => {
  const pending = signPending('admin-1', 15);
  const admin = signAccess('admin-1');
  assert.strictEqual(readToken(pending, 'admin'), null, 'a pending pass must not act as a full admin pass');
  assert.strictEqual(readToken(admin, 'admin-pending'), null);
  assert.strictEqual(readToken(admin, 'admin').sub, 'admin-1');
  assert.strictEqual(readToken('not-a-token', 'admin'), null);
  assert.strictEqual(readToken(admin + 'x', 'admin'), null, 'a changed pass must be refused');
  const { token } = signEnforcerAccess('enf-1', new Date());
  assert.strictEqual(readToken(token, 'admin'), null, 'an enforcer pass must not work as admin');
  assert.strictEqual(readToken(token, 'enforcer').sub, 'enf-1');
});

test('enforcer login ends Sunday 11:59:59 PM Manila time', () => {
  // Wednesday 2026-10-28 10:00 Manila = 02:00 UTC -> the next Sunday is 2026-11-01
  const end = sundayCutoff(new Date('2026-10-28T02:00:00Z'));
  assert.strictEqual(end.toISOString(), '2026-11-01T15:59:59.000Z'); // 23:59:59 in UTC+8
  // On Sunday 2026-11-01 at 20:00 Manila, it ends the same night
  const sameDay = sundayCutoff(new Date('2026-11-01T12:00:00Z'));
  assert.strictEqual(sameDay.toISOString(), '2026-11-01T15:59:59.000Z');
  // Sunday 2026-11-01 at 23:59:59.5 Manila has passed -> next week
  const after = sundayCutoff(new Date('2026-11-01T16:00:00Z'));
  assert.ok(after.getTime() > new Date('2026-11-08T00:00:00Z').getTime() - 24 * 3600 * 1000);
});

test('rate limiter blocks the 4th POST in a window, but lets GET through', async () => {
  resetForTests();
  const app = express();
  app.use('/try', limit({ max: 3, windowMs: 60000 }));
  app.all('/try', (req, res) => res.json({ ok: true }));
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}/try`;
  try {
    for (let i = 0; i < 3; i++) assert.strictEqual((await fetch(base, { method: 'POST' })).status, 200);
    const blocked = await fetch(base, { method: 'POST' });
    assert.strictEqual(blocked.status, 429);
    assert.ok(Number(blocked.headers.get('retry-after')) > 0);
    assert.strictEqual((await fetch(base)).status, 200, 'GET is never limited');
  } finally {
    server.close();
  }
});
