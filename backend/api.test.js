import assert from 'node:assert/strict';
import { after, test, mock } from 'node:test';
import mongoose from 'mongoose';
import { app } from './index.js';
import { Admin, AdminSession, LoginAttempt, hashPassword, verifyPassword, limitLogin } from './auth.js';
import { security, securityConfig } from './config.js';
import { encodeImage } from './uploads.js';
import sharp from 'sharp';
import { scryptSync } from 'node:crypto';
import { unlink } from 'node:fs/promises';

const server = app.listen(0, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}/api`;
// Route tests mock database access; limiter behavior is exercised separately.
mock.method(LoginAttempt, 'findOneAndUpdate', async () => ({ count: 1 }));
after(() => { server.close(); });

const testToken = 'a'.repeat(64);
const testAdmin = { _id: 'admin1', name: 'Cafe Admin', email: 'admin@example.com' };
async function call(endpoint, method = 'GET', body, authenticated = false) {
  return fetch(`${base}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(authenticated ? { Cookie: `ayra_admin=${testToken}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
}

test('customer review cannot bypass moderation', async () => {
  const create = mock.method(mongoose.model('Review'), 'create', async (value) => ({ _id: 'review1', ...value }));
  try {
    const response = await call('/reviews', 'POST', { name: 'Customer', message: 'Great juice!', rating: 5, status: 'approved' });
    assert.equal(response.status, 201);
    assert.equal((await response.json()).status, 'pending');
    assert.equal(create.mock.calls[0].arguments[0].status, 'pending');
  } finally { create.mock.restore(); }
});

test('public reviews query only approved reviews', async () => {
  const find = mock.method(mongoose.model('Review'), 'find', (filter) => {
    assert.deepEqual(filter, { status: 'approved' });
    return { sort: async () => [{ _id: 'approved1', rating: 4 }] };
  });
  try {
    const response = await call('/reviews?public=true');
    assert.equal(response.status, 200);
    assert.equal((await response.json())[0]._id, 'approved1');
  } finally { find.mock.restore(); }
});

test('photo create, list, edit, and delete use database models', async () => {
  const Photo = mongoose.model('CafePhoto');
  const photo = { title: 'Our cafe', alt: 'Window seating', image: '/uploads/cafe.jpg' };
  const mocks = [
    mock.method(AdminSession, 'findOne', () => ({ populate: async () => ({ admin: testAdmin }) })),
    mock.method(Photo, 'create', async (body) => ({ _id: 'photo1', ...body })),
    mock.method(Photo, 'find', () => ({ sort: async () => [{ _id: 'photo1', ...photo }] })),
    mock.method(Photo, 'findByIdAndUpdate', async (id, body, options) => {
      assert.equal(id, 'photo1');
      assert.equal(options.runValidators, true);
      return { _id: id, ...body };
    }),
    mock.method(Photo, 'findByIdAndDelete', async (id) => ({ _id: id })),
  ];
  try {
    const created = await call('/cafe-photos', 'POST', photo, true);
    assert.equal(created.status, 201);
    assert.equal((await created.json()).image, photo.image);
    assert.equal((await (await call('/cafe-photos')).json())[0].title, photo.title);
    const edited = await call('/cafe-photos/photo1', 'PUT', { ...photo, title: 'New caption' }, true);
    assert.equal((await edited.json()).title, 'New caption');
    assert.equal((await call('/cafe-photos/photo1', 'DELETE', undefined, true)).status, 204);
  } finally { mocks.forEach((value) => value.mock.restore()); }
});

test('empty menu remains empty', async () => {
  const find = mock.method(mongoose.model('Product'), 'find', () => ({ sort: async () => [] }));
  try { assert.deepEqual(await (await call('/products')).json(), []); }
  finally { find.mock.restore(); }
});

test('review ratings must be whole stars', async () => {
  const review = new (mongoose.model('Review'))({ name: 'Customer', message: 'Great!', rating: 3.5 });
  await assert.rejects(review.validate(), (error) => Boolean(error.errors.rating));
});

test('admin content operations and private reviews reject unauthenticated requests', async () => {
  for (const [path, method] of [
    ['/products', 'POST'], ['/products/item', 'PUT'], ['/products/item', 'DELETE'],
    ['/cafe-content', 'PUT'], ['/cafe-photos', 'POST'], ['/cafe-photos/item', 'PUT'],
    ['/cafe-photos/item', 'DELETE'], ['/reviews/item', 'PATCH'], ['/uploads', 'POST'],
    ['/reviews', 'GET'], ['/auth/me', 'GET'],
  ]) assert.equal((await call(path, method)).status, 401, `${method} ${path}`);
});

test('passwords use salted hashes and reject incorrect passwords', async () => {
  const password = 'a long test password';
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.notEqual(first, password);
  assert.notEqual(first, second);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword('incorrect', first), false);
});

test('login sets an HttpOnly cookie and returns no password hash', async () => {
  const passwordHash = await hashPassword('correct test password');
  const find = mock.method(Admin, 'findOne', (filter) => {
    assert.deepEqual(filter, { email: testAdmin.email });
    return { select: async () => ({ ...testAdmin, passwordHash }) };
  });
  const create = mock.method(AdminSession, 'create', async (session) => {
    assert.equal(session.admin, testAdmin._id);
    assert.equal(session.tokenHash.length, 64);
    assert.ok(session.expiresAt > new Date());
  });
  try {
    const response = await call('/auth/login', 'POST', { email: 'ADMIN@example.com', password: 'correct test password' });
    assert.equal(response.status, 200);
    const cookie = response.headers.get('set-cookie');
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Lax/);
    assert.match(cookie, /Path=\/api/);
    assert.deepEqual(await response.json(), { admin: { id: testAdmin._id, name: testAdmin.name, email: testAdmin.email } });
    assert.equal((await call('/auth/login', 'POST', { email: testAdmin.email, password: 'incorrect' })).status, 401);
  } finally { find.mock.restore(); create.mock.restore(); }
});

test('expired sessions cannot access the dashboard API', async () => {
  const find = mock.method(AdminSession, 'findOne', (filter) => {
    assert.ok(filter.expiresAt.$gt instanceof Date);
    return { populate: async () => null };
  });
  try { assert.equal((await call('/auth/me', 'GET', undefined, true)).status, 401); }
  finally { find.mock.restore(); }
});

test('logout revokes the database session and clears the cookie', async () => {
  const remove = mock.method(AdminSession, 'deleteOne', async (filter) => {
    assert.equal(filter.tokenHash.length, 64);
    assert.notEqual(filter.tokenHash, testToken);
  });
  try {
    const response = await call('/auth/logout', 'POST', undefined, true);
    assert.equal(response.status, 204);
    assert.equal(remove.mock.callCount(), 1);
    assert.match(response.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);
  } finally { remove.mock.restore(); }
});

test('cross-origin admin requests are rejected', async () => {
  const response = await fetch(`${base}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://untrusted.example' },
    body: JSON.stringify({ email: testAdmin.email, password: 'password' }),
  });
  assert.equal(response.status, 403);
});

test('login rejects object payloads instead of passing query operators to MongoDB', async () => {
  assert.equal((await call('/auth/login', 'POST', { email: { $ne: null }, password: 'password' })).status, 400);
});

test('legacy hashes still verify and are upgraded after a successful login', async () => {
  const password = 'legacy account password';
  const salt = 'a'.repeat(32);
  const legacy = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
  assert.equal(await verifyPassword(password, legacy), true);
  const mocks = [
    mock.method(Admin, 'findOne', () => ({ select: async () => ({ ...testAdmin, passwordHash: legacy }) })),
    mock.method(Admin, 'updateOne', async (filter, update) => {
      assert.equal(filter.passwordHash, legacy);
      assert.match(update.$set.passwordHash, /^scrypt\$131072\$8\$1\$/);
      assert.equal(await verifyPassword(password, update.$set.passwordHash), true);
    }),
    mock.method(AdminSession, 'create', async () => ({})),
  ];
  try {
    assert.equal((await call('/auth/login', 'POST', { email: testAdmin.email, password })).status, 200);
    assert.equal(mocks[1].mock.callCount(), 1);
  } finally { mocks.forEach((value) => value.mock.restore()); }
});

test('database login limit blocks attempt 11 and fails closed on database errors', async () => {
  let count = 0;
  const counter = mock.method(LoginAttempt, 'findOneAndUpdate', async (filter, update, options) => {
    assert.match(filter._id, /^[a-f0-9]{64}:\d+$/);
    assert.equal(update.$inc.count, 1);
    assert.equal(options.upsert, true);
    assert.ok(update.$setOnInsert.expiresAt > new Date());
    return { count: ++count };
  });
  try {
    for (let index = 0; index < 11; index++) {
      let allowed = false;
      const response = { set: (_name, value) => assert.ok(Number(value) > 0), status(code) { this.code = code; return this; }, json() {} };
      await limitLogin({ ip: '192.0.2.10' }, response, (error) => { assert.ifError(error); allowed = true; });
      assert.equal(allowed, index < 10);
      if (index === 10) assert.equal(response.code, 429);
    }
  } finally { counter.mock.restore(); }
  const failure = new Error('Database unavailable');
  const failed = mock.method(LoginAttempt, 'findOneAndUpdate', async () => { throw failure; });
  try {
    await limitLogin({ ip: '192.0.2.10' }, {}, (error) => assert.equal(error, failure));
  } finally { failed.mock.restore(); }
});

test('production configuration rejects insecure origins and unsafe proxy settings', () => {
  assert.throws(() => securityConfig({ NODE_ENV: 'production' }), /FRONTEND_URL/);
  assert.throws(() => securityConfig({ NODE_ENV: 'production', FRONTEND_URL: 'http://example.com' }), /HTTPS/);
  assert.throws(() => securityConfig({ FRONTEND_URL: 'https://example.com/path' }), /exact origin/);
  assert.throws(() => securityConfig({ COOKIE_SAME_SITE: 'none' }), /production/);
  assert.throws(() => securityConfig({ TRUST_PROXY: 'true' }), /trusted proxy/);
  assert.deepEqual(securityConfig({ TRUST_PROXY: '127.0.0.1,10.0.0.0/24' }).trustProxy, ['127.0.0.1', '10.0.0.0/24']);
});

test('cross-site mode requires the exact trusted origin and uses Secure cookies', async () => {
  const original = { ...security };
  Object.assign(security, { production: true, sameSite: 'none' });
  const mocks = [
    mock.method(Admin, 'findOne', () => ({ select: async () => ({ ...testAdmin, passwordHash: `${'a'.repeat(32)}:${scryptSync('password', 'a'.repeat(32), 64).toString('hex')}` }) })),
    mock.method(Admin, 'updateOne', async () => ({})),
    mock.method(AdminSession, 'create', async () => ({})),
  ];
  try {
    const login = (origin) => fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'cross-site', ...(origin ? { Origin: origin } : {}) }, body: JSON.stringify({ email: testAdmin.email, password: 'password' }) });
    assert.equal((await login()).status, 403);
    assert.equal((await login('https://evil.example')).status, 403);
    const response = await login(security.frontendUrl);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('set-cookie'), /Secure/);
    assert.match(response.headers.get('set-cookie'), /SameSite=None/);
  } finally { Object.assign(security, original); mocks.forEach((value) => value.mock.restore()); }
});

test('image decoder rejects disguised HTML, SVG, corrupt files, and excessive dimensions', async () => {
  for (const value of ['<script>alert(1)</script>', '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>', 'not an image']) {
    await assert.rejects(encodeImage(Buffer.from(value)), { status: 400 });
  }
  const large = await sharp({ create: { width: 4100, height: 4000, channels: 3, background: 'white' } }).png().toBuffer();
  await assert.rejects(encodeImage(large), { status: 400 });
});

test('uploads require admin auth, reject spoofed images, and serve re-encoded WebP files safely', async () => {
  const session = mock.method(AdminSession, 'findOne', () => ({ populate: async () => ({ admin: testAdmin }) }));
  let filename;
  const upload = (data, authenticated = true, name = 'photo.html') => {
    const form = new FormData();
    form.append('image', new Blob([data], { type: 'image/png' }), name);
    return fetch(`${base}/uploads`, { method: 'POST', headers: authenticated ? { Cookie: `ayra_admin=${testToken}` } : {}, body: form });
  };
  try {
    assert.equal((await upload('fake image', false)).status, 401);
    assert.equal((await upload('<html>malicious</html>')).status, 400);
    assert.equal((await upload(Buffer.alloc(5 * 1024 * 1024 + 1))).status, 413);
    const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: 'red' } }).png().toBuffer();
    const response = await upload(png);
    assert.equal(response.status, 201);
    const { url } = await response.json();
    assert.match(url, /^\/uploads\/[a-f0-9-]{36}\.webp$/);
    filename = url.split('/').pop();
    const image = await fetch(`${base.replace(/\/api$/, '')}${url}`);
    assert.equal(image.headers.get('content-type'), 'image/webp');
    assert.equal(image.headers.get('x-content-type-options'), 'nosniff');
    assert.match(image.headers.get('content-security-policy'), /sandbox/);
    assert.equal((await sharp(Buffer.from(await image.arrayBuffer())).metadata()).format, 'webp');
  } finally {
    session.mock.restore();
    if (filename) await unlink(new URL(`./uploads/${filename}`, import.meta.url));
  }
});
