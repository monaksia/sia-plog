import fs from 'node:fs';
import { promises as fsp } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import sharp from 'sharp';
import db from '../db.js';
import { UPLOADS_DIR, TEMP_DIR } from '../config.js';
import { badRequest } from './errors.js';

for (const dir of [UPLOADS_DIR, path.join(UPLOADS_DIR, 'thumbs'), path.join(UPLOADS_DIR, 'medium'), TEMP_DIR]) {
  fs.mkdirSync(dir, { recursive: true, mode: 0o750 });
}
const storage = multer.diskStorage({ destination: TEMP_DIR, filename: (_req, _file, cb) => cb(null, `${randomUUID()}.upload`) });
export const uploadImage = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024, files: 1, fields: 10, fieldSize: 10_000, parts: 11 },
}).single('image');

export function localImagePath(src) {
  if (typeof src !== 'string' || !/^\/uploads\/(?:thumbs\/|medium\/)?[\w-][\w.-]*$/.test(src)) return null;
  return path.join(UPLOADS_DIR, src.slice('/uploads/'.length));
}
export function decoratePhoto(photo) {
  const base = path.basename(photo.src, path.extname(photo.src));
  const thumb = `/uploads/thumbs/${base}_thumb.webp`;
  const medium = `/uploads/medium/${base}_medium.webp`;
  return { ...photo,
    thumb: photo.thumb || (localImagePath(thumb) && fs.existsSync(localImagePath(thumb)) ? thumb : null),
    medium: photo.medium || (localImagePath(medium) && fs.existsSync(localImagePath(medium)) ? medium : null),
  };
}
export async function removeGenerated(paths) {
  await Promise.all(paths.map(p => fsp.rm(p, { force: true })));
}
let activeImages = 0;
export async function processImage(file, { variants = false } = {}) {
  if (!file) throw badRequest('请选择图片');
  if (activeImages >= 2) throw badRequest('图片正在处理中，请稍后重试', 429);
  activeImages++;
  const files = [];
  try {
    const options = { limitInputPixels: 40_000_000, failOn: 'error' };
    const meta = await sharp(file.path, options).metadata();
    if (!['jpeg', 'png', 'webp', 'avif', 'heif', 'gif', 'tiff'].includes(meta.format) ||
        !meta.width || !meta.height || (meta.pages || 1) > 1 || meta.width > 20_000 || meta.height > 20_000) {
      throw badRequest('请选择有效的静态图片（JPEG、PNG、WebP、AVIF、GIF 或 TIFF）');
    }
    const base = randomUUID();
    const src = `/uploads/${base}.webp`;
    const mainPath = localImagePath(src); files.push(mainPath);
    const info = await sharp(file.path, options).rotate().resize(2000, null, { withoutEnlargement: true }).webp({ quality: 80 }).toFile(mainPath);
    let thumb = '', medium = '';
    if (variants) {
      thumb = `/uploads/thumbs/${base}_thumb.webp`;
      medium = `/uploads/medium/${base}_medium.webp`;
      for (const [url, width, quality] of [[thumb, 400, 70], [medium, 1000, 78]]) {
        const dest = localImagePath(url); files.push(dest);
        await sharp(file.path, options).rotate().resize(width, null, { withoutEnlargement: true }).webp({ quality }).toFile(dest);
      }
    }
    return { src, thumb, medium, width: info.width, height: info.height, files };
  } catch (error) {
    await removeGenerated(files);
    if (error.status) throw error;
    if (/input|pixel|unsupported|corrupt|invalid|decode/i.test(error.message)) throw badRequest('图片无法解码或超过像素限制');
    throw error;
  } finally {
    activeImages--;
    await fsp.rm(file.path, { force: true });
  }
}
// Only delete trusted local paths that no remaining content references.
export async function removeUnusedImages(urls) {
  for (const url of new Set(urls.filter(Boolean))) {
    const file = localImagePath(url);
    if (!file) continue;
    const referenced = db.prepare(`SELECT 1 FROM photos WHERE src = ? OR thumb = ? OR medium = ?
      UNION ALL SELECT 1 FROM movies WHERE poster = ? UNION ALL SELECT 1 FROM books WHERE cover = ? LIMIT 1`).get(url, url, url, url, url);
    if (!referenced) {
      try { fs.rmSync(file, { force: true }); }
      catch (error) { console.error(JSON.stringify({ event: 'image_cleanup_failed', file: path.basename(file), code: error.code })); }
    }
  }
}
