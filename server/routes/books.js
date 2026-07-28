import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { requireAuth } from '../auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: UPLOADS,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'cover-' + Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

// 公开：列表
router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM books ORDER BY created_at DESC').all();
  res.json(rows.map(parseRow));
});

// 公开：详情
router.get('/:slug', (req, res) => {
  const row = db.prepare('SELECT * FROM books WHERE slug = ?').get(req.params.slug);
  if (!row) return res.status(404).json({ error: '未找到' });
  res.json(parseRow(row));
});

// 管理员：创建
router.post('/', requireAuth, (req, res) => {
  const slug = req.body.slug || req.body.title?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w一-鿿-]/g, '') || Date.now().toString(36);
  try {
    db.prepare(`
      INSERT INTO books (slug, title, title_en, author, cover, year, publisher, genre, rating, tags, excerpt, review)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(slug, req.body.title || '', req.body.title_en || '', req.body.author || '',
      req.body.cover || '', req.body.year || null, req.body.publisher || '',
      req.body.genre || '', req.body.rating || 0, req.body.tags || '',
      req.body.excerpt || '', req.body.review || '');
    res.status(201).json({ slug });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'slug 已存在' });
    throw e;
  }
});

// 管理员：更新
router.put('/:slug', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM books WHERE slug = ?').get(req.params.slug);
  if (!existing) return res.status(404).json({ error: '未找到' });

  db.prepare(`
    UPDATE books SET title=?, title_en=?, author=?, cover=?, year=?, publisher=?,
    genre=?, rating=?, tags=?, excerpt=?, review=?, updated_at=datetime('now')
    WHERE slug=?
  `).run(
    req.body.title || existing.title,
    req.body.title_en ?? existing.title_en,
    req.body.author || existing.author,
    req.body.cover || existing.cover,
    req.body.year || existing.year,
    req.body.publisher || existing.publisher,
    req.body.genre || existing.genre,
    req.body.rating ?? existing.rating,
    req.body.tags || existing.tags,
    req.body.excerpt || existing.excerpt,
    req.body.review || existing.review,
    req.params.slug
  );
  res.json({ ok: true });
});

// 管理员：删除
router.delete('/:slug', requireAuth, (req, res) => {
  db.prepare('DELETE FROM books WHERE slug = ?').run(req.params.slug);
  res.json({ ok: true });
});

// 管理员：上传封面
router.post('/:slug/cover', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '请选择图片' });
  const src = '/uploads/' + req.file.filename;
  db.prepare('UPDATE books SET cover=? WHERE slug=?').run(src, req.params.slug);
  res.json({ src });
});

function parseRow(row) {
  return {
    ...row,
    genre: row.genre ? row.genre.split(',').map(s => s.trim()) : [],
    tags: row.tags ? row.tags.split(',').map(s => s.trim()) : [],
  };
}

export default router;
