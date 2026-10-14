import Database from 'better-sqlite3';
import path from 'node:path';
import os from 'node:os';
import { randomUUID, createHash } from 'node:crypto';
import { promises as fs, createReadStream } from 'node:fs';

const tables = ['users', 'photos', 'movies', 'books'];
async function hash(file) {
  const digest = createHash('sha256');
  for await (const chunk of createReadStream(file)) digest.update(chunk);
  return digest.digest('hex');
}
async function inventory(root, relative = '') {
  const files = [];
  for (const entry of await fs.readdir(path.join(root, relative), { withFileTypes: true })) {
    const name = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...await inventory(root, name));
    else if (entry.isFile()) files.push(name);
    else throw new Error(`Unexpected non-regular file in backup: ${name}`);
  }
  return files;
}
function inspectDatabase(file) {
  const db = new Database(file, { readonly: true, fileMustExist: true });
  try {
    if (db.pragma('integrity_check', { simple: true }) !== 'ok') throw new Error('Database integrity check failed');
    if (db.pragma('foreign_key_check').length) throw new Error('Foreign-key check failed');
    const counts = Object.fromEntries(tables.map(table => [table, db.prepare(`SELECT count(*) AS count FROM ${table}`).get().count]));
    const refs = [];
    for (const [table, candidates] of [['photos', ['src', 'thumb', 'medium']], ['movies', ['poster']], ['books', ['cover']]]) {
      const columns = db.pragma(`table_info(${table})`).map(c => c.name);
      for (const field of candidates.filter(c => columns.includes(c))) {
        for (const row of db.prepare(`SELECT ${field} AS src FROM ${table}`).all()) {
          if (row.src?.startsWith('/uploads/')) {
            if (!/^\/uploads\/(?:thumbs\/|medium\/)?[\w.-]+$/.test(row.src)) throw new Error('Invalid image reference');
            refs.push(row.src.slice(1));
          }
        }
      }
    }
    return { counts, refs: [...new Set(refs)] };
  } finally { db.close(); }
}
function contained(root, name) {
  const file = path.resolve(root, name);
  if (!file.startsWith(path.resolve(root) + path.sep)) throw new Error('Invalid backup path');
  return file;
}
export async function verifyBackup(dir, { restore = true } = {}) {
  const manifest = JSON.parse(await fs.readFile(path.join(dir, 'manifest.json'), 'utf8'));
  if (manifest.version !== 1 || !manifest.files?.['data.db']) throw new Error('Invalid backup manifest');
  for (const [name, expected] of Object.entries(manifest.files)) {
    if (await hash(contained(dir, name)) !== expected.sha256) throw new Error(`Backup checksum mismatch: ${name}`);
  }
  const info = inspectDatabase(path.join(dir, 'data.db'));
  if (JSON.stringify(info.counts) !== JSON.stringify(manifest.counts)) throw new Error('Backup record counts differ');
  for (const ref of info.refs) await fs.access(contained(dir, ref));
  if (restore) {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'siaplog-restore-'));
    try {
      await fs.cp(dir, temp, { recursive: true });
      const restored = inspectDatabase(path.join(temp, 'data.db'));
      if (JSON.stringify(restored.counts) !== JSON.stringify(info.counts)) throw new Error('Restore record counts differ');
      for (const ref of restored.refs) await fs.access(contained(temp, ref));
    } finally { await fs.rm(temp, { recursive: true, force: true }); }
  }
  return { counts: info.counts, files: Object.keys(manifest.files).length, restored: restore };
}
export async function createBackup({ dataDir, audioDir, backupDir, retain = 30 }) {
  if (!Number.isInteger(retain) || retain < 1) throw new Error('Retention must be a positive integer');
  await fs.mkdir(backupDir, { recursive: true, mode: 0o700 });
  const id = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') + '-' + randomUUID().slice(0, 8);
  const pending = path.join(backupDir, `.incomplete-${id}`);
  const completed = path.join(backupDir, `backup-${id}`);
  await fs.mkdir(pending, { mode: 0o700 });
  try {
    const source = new Database(path.join(dataDir, 'data.db'), { readonly: true, fileMustExist: true });
    try { await source.backup(path.join(pending, 'data.db')); } finally { source.close(); }
    for (const [sourceDir, target] of [[path.join(dataDir, 'uploads'), 'uploads'], [audioDir, 'audio']]) {
      await fs.mkdir(path.join(pending, target), { mode: 0o700 });
      let exists = true;
      try { await fs.access(sourceDir); } catch (error) { if (error.code !== 'ENOENT') throw error; exists = false; }
      if (exists) await fs.cp(sourceDir, path.join(pending, target), { recursive: true });
    }
    const info = inspectDatabase(path.join(pending, 'data.db'));
    const files = {};
    for (const name of await inventory(pending)) {
      const file = path.join(pending, name);
      await fs.chmod(file, 0o600);
      files[name] = { bytes: (await fs.stat(file)).size, sha256: await hash(file) };
    }
    await fs.writeFile(path.join(pending, 'manifest.json'), JSON.stringify({ version: 1, createdAt: new Date().toISOString(), counts: info.counts, files }, null, 2) + '\n', { mode: 0o600 });
    await verifyBackup(pending);
    await fs.rename(pending, completed);
    const entries = (await fs.readdir(backupDir)).filter(name => /^backup-\d{8}T\d{6}Z-[a-f0-9]{8}$/.test(name)).sort().reverse();
    for (const name of entries.slice(retain)) await fs.rm(path.join(backupDir, name), { recursive: true });
    return { directory: completed, ...info };
  } catch (error) {
    await fs.rm(pending, { recursive: true, force: true });
    throw error;
  }
}
