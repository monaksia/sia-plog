import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';
import { createBackup, verifyBackup } from '../scripts/backup-lib.mjs';

const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'siaplog-regression-'));
process.env.SIA_DATA_DIR = path.join(temp, 'data');
process.env.SIA_AUDIO_DIR = path.join(temp, 'audio');
process.env.JWT_SECRET = randomBytes(48).toString('base64url');
process.env.NODE_ENV = 'production';
await fs.mkdir(process.env.SIA_AUDIO_DIR);
await fs.writeFile(path.join(process.env.SIA_AUDIO_DIR, 'test.mp3'), 'audio-backup-fixture');
const { app } = await import('../server/app.js');
const { default: db } = await import('../server/db.js');
const { signToken } = await import('../server/auth.js');
const userId = db.prepare('INSERT INTO users(username, password_hash) VALUES (?, ?)').run('test-admin', await bcrypt.hash('test-password-123', 10)).lastInsertRowid;
const user = () => db.prepare('SELECT * FROM users WHERE id=?').get(userId);
const token = () => signToken(user());
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
async function request(url, { method = 'GET', body, auth, headers = {} } = {}) {
  if (auth) headers.Authorization = `Bearer ${auth}`;
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch(base + url, { method, headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
  let data;
  try { data = await response.json(); } catch { data = null; }
  return { response, status: response.status, data };
}
const image = async format => sharp({ create: { width: 24, height: 16, channels: 3, background: 'white' } }).toFormat(format).toBuffer();
function form(bytes, name, type, fields = {}) {
  const fd = new FormData(); fd.append('image', new Blob([bytes], { type }), name);
  for (const [key, value] of Object.entries(fields)) fd.append(key, value);
  return fd;
}
async function upload(format = 'webp', fields) {
  return request('/api/photos', { method: 'POST', auth: token(), body: form(await image(format), `photo.${format}`, `image/${format}`, fields) });
}
after(async () => {
  await new Promise(resolve => server.close(resolve));
  db.close();
  await fs.rm(temp, { recursive: true, force: true });
});

test('startup requires a strong configured secret', () => {
  for (const secret of ['', 'sia-plog-secret-change-me']) {
    const result = spawnSync(process.execPath, ['server/index.js'], { encoding: 'utf8', env: {
      ...process.env, JWT_SECRET: secret, SIA_DATA_DIR: path.join(temp, 'startup-' + (secret ? 'default' : 'missing')),
    } });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /JWT_SECRET must be set/);
  }
});
test('health and unknown APIs return correct JSON statuses', async () => {
  assert.equal((await request('/api/health')).status, 200);
  const absent = await request('/api/not-found');
  assert.equal(absent.status, 404); assert.equal(absent.data.error, '接口不存在');
  assert.equal((await request('/api/music/debug')).status, 404);
  const noAuth = await request('/api/auth/me'); assert.equal(noAuth.status, 401);
  assert.equal(noAuth.response.headers.get('x-powered-by'), null);
  assert.equal(noAuth.response.headers.get('x-content-type-options'), 'nosniff');
});
test('default signatures and nonexistent, disabled or stale identities are rejected', async () => {
  const defaultToken = jwt.sign({ id: Number(userId), username: 'test-admin' }, 'sia-plog-secret-change-me');
  assert.equal((await request('/api/auth/me', { auth: defaultToken })).status, 401);
  const ghost = jwt.sign({ id: -1, version: 0 }, process.env.JWT_SECRET, { issuer: 'sia-plog', audience: 'sia-plog-admin', jwtid: 'missing', expiresIn: '1h' });
  assert.equal((await request('/api/auth/me', { auth: ghost })).status, 401);
  const valid = token();
  assert.equal((await request('/api/auth/me', { auth: valid })).status, 200);
  db.prepare('UPDATE users SET active=0 WHERE id=?').run(userId);
  assert.equal((await request('/api/auth/me', { auth: valid })).status, 401);
  db.prepare('UPDATE users SET active=1, token_version=token_version+1 WHERE id=?').run(userId);
  assert.equal((await request('/api/auth/me', { auth: valid })).status, 401);
});
test('login validates body and logout revokes the actual session', async () => {
  assert.equal((await request('/api/auth/login', { method: 'POST', body: { username: {}, password: 'x' } })).status, 400);
  const signedIn = await request('/api/auth/login', { method: 'POST', body: { username: 'test-admin', password: 'test-password-123' } });
  assert.equal(signedIn.status, 200); assert.ok(signedIn.data.token);
  const auth = signedIn.data.token;
  assert.equal((await request('/api/auth/logout', { method: 'POST', auth })).status, 200);
  assert.equal((await request('/api/auth/me', { auth })).status, 401);
});
test('login rate limit applies to repeated invalid credentials', async () => {
  for (let i = 0; i < 10; i++) {
    const r = await request('/api/auth/login', { method: 'POST', headers: { 'X-Forwarded-For': '198.51.100.77' }, body: { username: 'missing', password: 'wrong' } });
    assert.equal(r.status, 401);
  }
  const r = await request('/api/auth/login', { method: 'POST', headers: { 'X-Forwarded-For': '198.51.100.77' }, body: { username: 'missing', password: 'wrong' } });
  assert.equal(r.status, 429); assert.ok(r.response.headers.get('retry-after'));
});
test('WebP, JPEG and PNG uploads decode to distinct WebP variants and clean temporary files', async () => {
  for (const format of ['webp', 'jpeg', 'png']) {
    const result = await upload(format, { alt: 'fixture', sort_order: '7', notes: 'keep this' });
    assert.equal(result.status, 201);
    const photo = result.data;
    for (const key of ['src', 'thumb', 'medium']) {
      const file = path.join(process.env.SIA_DATA_DIR, photo[key].slice(1));
      assert.equal((await sharp(file).metadata()).format, 'webp');
      const r = await fetch(base + photo[key]);
      assert.equal(r.status, 200); assert.match(r.headers.get('cache-control'), /immutable/); await r.arrayBuffer();
    }
    assert.deepEqual(await fs.readdir(path.join(process.env.SIA_DATA_DIR, 'tmp')), []);
    await request(`/api/photos/${photo.id}`, { method: 'DELETE', auth: token() });
  }
});
test('invalid images, SVG and invalid fields leave no orphan outputs', async () => {
  const before = await fs.readdir(path.join(process.env.SIA_DATA_DIR, 'uploads'));
  for (const bytes of ['not-an-image', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>']) {
    const r = await request('/api/photos', { method: 'POST', auth: token(), body: form(bytes, 'bad.webp', 'image/webp') });
    assert.equal(r.status, 400);
  }
  const invalidFields = await upload('webp', { sort_order: 'invalid' }); assert.equal(invalidFields.status, 400);
  assert.deepEqual(await fs.readdir(path.join(process.env.SIA_DATA_DIR, 'tmp')), []);
  assert.deepEqual(await fs.readdir(path.join(process.env.SIA_DATA_DIR, 'uploads')), before);
});
test('photo partial edits preserve sort and omitted metadata, and deletion cleans variants', async () => {
  const uploaded = await upload('webp', { alt: 'before', notes: 'keep this', sort_order: '7' });
  const photo = uploaded.data;
  assert.equal((await request(`/api/photos/${photo.id}`, { method: 'PUT', auth: token(), body: { alt: '' } })).status, 200);
  const updated = db.prepare('SELECT * FROM photos WHERE id=?').get(photo.id);
  assert.equal(updated.alt, ''); assert.equal(updated.sort_order, 7); assert.equal(updated.notes, 'keep this');
  assert.equal((await request('/api/photos/999999', { method: 'PUT', auth: token(), body: { alt: 'x' } })).status, 404);
  assert.equal((await request(`/api/photos/${photo.id}`, { method: 'DELETE', auth: token() })).status, 200);
  for (const key of ['src', 'thumb', 'medium']) await assert.rejects(fs.access(path.join(process.env.SIA_DATA_DIR, photo[key].slice(1))));
});
test('review edits clear optional strings, null year and zero rating; slugs stay stable', async () => {
  for (const table of ['books', 'movies']) {
    const created = await request(`/api/${table}`, { method: 'POST', auth: token(), body: { title: 'Fixture', slug: 'fixture', title_en: 'before', review: 'body', rating: 4, year: 2026 } });
    assert.equal(created.status, 201);
    const edited = await request(`/api/${table}/fixture`, { method: 'PUT', auth: token(), body: { title_en: '', review: '', rating: 0, year: null } });
    assert.equal(edited.status, 200);
    const row = (await request(`/api/${table}/fixture`)).data;
    assert.equal(row.title_en, ''); assert.equal(row.review, ''); assert.equal(row.rating, 0); assert.equal(row.year, null);
    assert.equal((await request(`/api/${table}/fixture`, { method: 'PUT', auth: token(), body: { slug: 'new-slug' } })).status, 400);
    assert.equal((await request(`/api/${table}/fixture`, { method: 'PUT', auth: token(), body: { rating: 9 } })).status, 400);
    assert.equal((await request(`/api/${table}`, { method: 'POST', auth: token(), body: { title: 'duplicate', slug: 'fixture' } })).status, 409);
    assert.ok(!Object.hasOwn((await request(`/api/${table}`)).data[0], 'review'));
    assert.equal((await request(`/api/${table}`, { method: 'POST', auth: token(), body: { title: '' } })).status, 400);
  }
});
test('cover upload validates contents, checks existence and preserves shared references', async () => {
  const bytes = await image('webp');
  const absent = await request('/api/books/missing/cover', { method: 'POST', auth: token(), body: form(bytes, 'x.webp', 'image/webp') });
  assert.equal(absent.status, 404);
  const invalid = await request('/api/books/fixture/cover', { method: 'POST', auth: token(), body: form('html', 'x.html', 'text/html') });
  assert.equal(invalid.status, 400);
  const first = await request('/api/books/fixture/cover', { method: 'POST', auth: token(), body: form(bytes, 'x.webp', 'image/webp') });
  assert.equal(first.status, 200);
  await request('/api/books', { method: 'POST', auth: token(), body: { title: 'Shared cover', slug: 'shared', cover: first.data.src } });
  const second = await request('/api/books/fixture/cover', { method: 'POST', auth: token(), body: form(bytes, 'x.webp', 'image/webp') });
  assert.equal(second.status, 200);
  const firstFile = path.join(process.env.SIA_DATA_DIR, first.data.src.slice(1));
  await fs.access(firstFile);
  await request('/api/books/shared', { method: 'DELETE', auth: token() });
  await assert.rejects(fs.access(firstFile));
  await request('/api/books/fixture', { method: 'DELETE', auth: token() });
  await assert.rejects(fs.access(path.join(process.env.SIA_DATA_DIR, second.data.src.slice(1))));
  assert.deepEqual(await fs.readdir(path.join(process.env.SIA_DATA_DIR, 'tmp')), []);
});
test('consistent backup restores database and media; tampered files fail verification', async () => {
  await upload('webp', { alt: 'backed up photo' });
  const result = await createBackup({ dataDir: process.env.SIA_DATA_DIR, audioDir: process.env.SIA_AUDIO_DIR, backupDir: path.join(temp, 'backups') });
  const verified = await verifyBackup(result.directory);
  assert.equal(verified.counts.photos, 1); assert.equal(verified.restored, true);
  await fs.writeFile(path.join(result.directory, 'audio', 'test.mp3'), 'tampered');
  await assert.rejects(verifyBackup(result.directory), /checksum mismatch/);
});
test('database migrations are versioned and idempotent across restarts', () => {
  assert.equal(db.prepare('SELECT count(*) AS count FROM schema_migrations').get().count, 2);
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', "const {default:db}=await import('./server/db.js');db.close();"], { encoding: 'utf8', env: process.env });
  assert.equal(child.status, 0, child.stderr);
});
