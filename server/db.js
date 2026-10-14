import Database from 'better-sqlite3';
import fs from 'node:fs';
import { DATA_DIR, DB_PATH } from './config.js';

fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o750 });
const db = new Database(DB_PATH);
db.pragma('busy_timeout = 5000');

// 启用 WAL 模式提高并发
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 建表
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    src TEXT NOT NULL,
    alt TEXT DEFAULT '',
    camera TEXT DEFAULT '',
    location TEXT DEFAULT '',
    date_taken TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    width INTEGER DEFAULT 1200,
    height INTEGER DEFAULT 800,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    title_en TEXT DEFAULT '',
    poster TEXT DEFAULT '',
    year INTEGER,
    director TEXT DEFAULT '',
    cast TEXT DEFAULT '',
    genre TEXT DEFAULT '',
    rating REAL DEFAULT 0,
    tags TEXT DEFAULT '',
    excerpt TEXT DEFAULT '',
    review TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    title_en TEXT DEFAULT '',
    author TEXT DEFAULT '',
    cover TEXT DEFAULT '',
    year INTEGER,
    publisher TEXT DEFAULT '',
    genre TEXT DEFAULT '',
    rating REAL DEFAULT 0,
    tags TEXT DEFAULT '',
    excerpt TEXT DEFAULT '',
    review TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);


// Each migration commits with its version record; errors abort startup.
db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)');
const migrations = [
  () => {
    for (const column of ['location', 'date_taken', 'notes']) {
      if (!db.pragma('table_info(photos)').some(c => c.name === column)) {
        db.exec(`ALTER TABLE photos ADD COLUMN ${column} TEXT NOT NULL DEFAULT ''`);
      }
    }
    db.exec(`ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0;
      CREATE TABLE sessions (
        jti TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at INTEGER NOT NULL
      );
      CREATE INDEX sessions_expiry ON sessions(expires_at);`);
  },
  () => {
    db.exec(`ALTER TABLE photos ADD COLUMN thumb TEXT NOT NULL DEFAULT '';
      ALTER TABLE photos ADD COLUMN medium TEXT NOT NULL DEFAULT '';
      CREATE INDEX photos_order ON photos(sort_order DESC, created_at DESC, id DESC);
      CREATE INDEX movies_order ON movies(created_at DESC, id DESC);
      CREATE INDEX books_order ON books(created_at DESC, id DESC);`);
  },
];
for (const [index, migration] of migrations.entries()) {
  const version = index + 1;
  if (!db.prepare('SELECT version FROM schema_migrations WHERE version = ?').get(version)) {
    db.transaction(() => {
      migration();
      db.prepare('INSERT INTO schema_migrations(version) VALUES (?)').run(version);
    })();
  }
}
export default db;
