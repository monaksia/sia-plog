import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import db from '../db.js';
import { requireAuth } from '../auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS = path.join(__dirname, '..', 'uploads');
const THUMBS = path.join(UPLOADS, 'thumbs');

// 确保上传目录存在
for (const dir of [UPLOADS, THUMBS]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('[Photos] 创建目录:', dir);
  }
}
console.log('[Photos] 上传目录:', UPLOADS);

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
  // Append thumb path for each photo
  const result = photos.map((p) => {
    const ext = path.extname(p.src);
    const base = path.basename(p.src, ext);
    const thumbPath = `/uploads/thumbs/${base}_thumb.webp`;
    const fullThumbPath = path.join(__dirname, '..', thumbPath);
    return {
      ...p,
      thumb: fs.existsSync(fullThumbPath) ? thumbPath : null,
    };
  });
  res.json(result);
});

// 管理员：上传照片（自动压缩 + 生成缩略图）
router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: '请选择图片' });

  const originalPath = req.file.path;
  const originalSize = req.file.size;
  const basename = path.basename(req.file.filename, path.extname(req.file.filename));
  const webpName = basename + '.webp';
  const thumbName = basename + '_thumb.webp';

  console.log(`[Photos] 原图: ${(originalSize / 1024 / 1024).toFixed(1)}MB, 处理中...`);

  try {
    // 主图：2000px 宽 WebP
    const mainPath = path.join(UPLOADS, webpName);
    const mainInfo = await sharp(originalPath)
      .resize(2000, null, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(mainPath);
    console.log(`[Photos] 主图 WebP: ${(mainInfo.size / 1024).toFixed(1)}KB`);

    // 缩略图：400px 宽 WebP
    const thumbPath = path.join(THUMBS, thumbName);
    const thumbInfo = await sharp(originalPath)
      .resize(400, null, { withoutEnlargement: true })
      .webp({ quality: 70 })
      .toFile(thumbPath);
    console.log(`[Photos] 缩略图: ${(thumbInfo.size / 1024).toFixed(1)}KB`);

    // 取实际尺寸
    const meta = await sharp(mainPath).metadata();

    // 删原图
    fs.unlinkSync(originalPath);

    const src = '/uploads/' + webpName;
    const thumb = '/uploads/thumbs/' + thumbName;
    const { alt, camera, location, date_taken, notes } = req.body;

    const result = db.prepare(
      'INSERT INTO photos (src, alt, camera, location, date_taken, notes, width, height) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(src, alt || '', camera || '', location || '', date_taken || '', notes || '', meta.width || 2000, meta.height || 1500);

    // 同时存 thumb 路径（利用 notes 字段的 JSON 或者直接拼接）
    // 这里把 thumb 信息放在返回结果里，前端按约定拼接
    console.log(`[Photos] DB 插入成功, id: ${result.lastInsertRowid}, 压缩比: ${((1 - mainInfo.size / originalSize) * 100).toFixed(0)}%`);

    const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(result.lastInsertRowid);
    // 附加 thumb URL
    photo.thumb = thumb;
    res.status(201).json(photo);
  } catch (err) {
    console.error('[Photos] 图片处理失败:', err);
    // 清理原图
    if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
    res.status(500).json({ error: '图片处理失败: ' + err.message });
  }
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

  // 删除主图
  const filePath = path.join(__dirname, '..', photo.src);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  // 删除缩略图
  const thumbName = path.basename(photo.src, '.webp') + '_thumb.webp';
  const thumbPath = path.join(THUMBS, thumbName);
  if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);

  db.prepare('DELETE FROM photos WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
