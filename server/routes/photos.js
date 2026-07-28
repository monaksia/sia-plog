import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { requireAuth } from '../auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: UPLOADS,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  },
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

const router = Router();

// 公开：获取照片列表
router.get('/', (_req, res) => {
  const photos = db.prepare('SELECT * FROM photos ORDER BY sort_order DESC, created_at DESC').all();
  res.json(photos);
});

// 管理员：上传照片
router.post('/', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '请选择图片' });

  const { alt, camera, location, date_taken, notes, width, height } = req.body;
  const src = '/uploads/' + req.file.filename;
  const result = db.prepare(
    'INSERT INTO photos (src, alt, camera, location, date_taken, notes, width, height) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(src, alt || '', camera || '', location || '', date_taken || '', notes || '', parseInt(width) || 1200, parseInt(height) || 800);

  const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(photo);
});

// 管理员：更新照片信息
router.put('/:id', requireAuth, (req, res) => {
  const { alt, camera, location, date_taken, notes, sort_order } = req.body;
  db.prepare('UPDATE photos SET alt=?, camera=?, location=?, date_taken=?, notes=?, sort_order=? WHERE id=?')
    .run(alt || '', camera || '', location || '', date_taken || '', notes || '', sort_order || 0, req.params.id);
  res.json({ ok: true });
});

// 管理员：删除照片
router.delete('/:id', requireAuth, (req, res) => {
  const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);
  if (!photo) return res.status(404).json({ error: '未找到' });

  // 删除文件
  const filePath = path.join(__dirname, '..', photo.src);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  db.prepare('DELETE FROM photos WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
