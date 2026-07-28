import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { requireAuth } from '../auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS = path.join(__dirname, '..', 'uploads');

// 确保上传目录存在
if (!fs.existsSync(UPLOADS)) {
  fs.mkdirSync(UPLOADS, { recursive: true });
  console.log('[Photos] 创建上传目录:', UPLOADS);
}
console.log('[Photos] 上传目录:', UPLOADS, '| 存在:', fs.existsSync(UPLOADS));

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
router.post('/', requireAuth, (req, res, next) => {
  console.log('[Photos] 收到上传请求, Content-Type:', req.get('Content-Type'));
  next();
}, upload.single('image'), (req, res) => {
  console.log('[Photos] req.file:', req.file ? JSON.stringify({ filename: req.file.filename, path: req.file.path, size: req.file.size }) : 'NULL');
  console.log('[Photos] req.body keys:', Object.keys(req.body));

  if (!req.file) return res.status(400).json({ error: '请选择图片' });

  // 确认文件确实写入了磁盘
  const exists = fs.existsSync(req.file.path);
  console.log('[Photos] 文件存在于磁盘:', exists, req.file.path);
  if (!exists) return res.status(500).json({ error: '文件写入失败，磁盘上未找到' });

  const { alt, camera, location, date_taken, notes, width, height } = req.body;
  const src = '/uploads/' + req.file.filename;
  const result = db.prepare(
    'INSERT INTO photos (src, alt, camera, location, date_taken, notes, width, height) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(src, alt || '', camera || '', location || '', date_taken || '', notes || '', parseInt(width) || 1200, parseInt(height) || 800);

  console.log('[Photos] DB 插入成功, id:', result.lastInsertRowid);

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
