import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data.db');

const db = new Database(DB_PATH);

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

// 插入示例数据（仅首次）
const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get();
if (userCount.c === 0) {
  console.log('[DB] 首次启动，请运行 node server/setup.js <用户名> <密码> 创建管理员');
}

export default db;
