import { Router } from 'express';
import { promises as fs } from 'node:fs';
import db from '../db.js';
import { requireAuth } from '../auth.js';
import { badRequest } from '../lib/errors.js';
import { photoInput, positiveId } from '../lib/validation.js';
import { uploadImage, processImage, decoratePhoto, removeGenerated, removeUnusedImages } from '../lib/images.js';
import { rateLimit } from '../lib/rate-limit.js';

const router = Router();
router.get('/', (_req, res) => res.json(db.prepare('SELECT * FROM photos ORDER BY sort_order DESC, created_at DESC, id DESC').all().map(decoratePhoto)));
router.post('/', requireAuth, rateLimit({ max: 30, windowMs: 60_000 }), uploadImage, async (req, res) => {
  let generated;
  try {
    const data = photoInput(req.body || {});
    generated = await processImage(req.file, { variants: true });
    const result = db.prepare(`INSERT INTO photos(src, thumb, medium, width, height, alt, camera, location, date_taken, notes, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(generated.src, generated.thumb, generated.medium, generated.width, generated.height,
      data.alt, data.camera, data.location, data.date_taken, data.notes, data.sort_order);
    res.status(201).json(decoratePhoto(db.prepare('SELECT * FROM photos WHERE id = ?').get(result.lastInsertRowid)));
  } catch (error) {
    if (generated) await removeGenerated(generated.files);
    throw error;
  } finally {
    if (req.file) await fs.rm(req.file.path, { force: true });
  }
});
router.put('/:id', requireAuth, (req, res) => {
  const id = positiveId(req.params.id);
  const previous = db.prepare('SELECT * FROM photos WHERE id = ?').get(id);
  if (!previous) throw badRequest('未找到', 404);
  const data = photoInput(req.body, previous);
  db.prepare('UPDATE photos SET alt=?, camera=?, location=?, date_taken=?, notes=?, sort_order=? WHERE id=?').run(
    data.alt, data.camera, data.location, data.date_taken, data.notes, data.sort_order, id);
  res.json({ ok: true });
});
router.delete('/:id', requireAuth, async (req, res) => {
  const id = positiveId(req.params.id);
  const previous = db.prepare('SELECT * FROM photos WHERE id = ?').get(id);
  if (!previous) throw badRequest('未找到', 404);
  const photo = decoratePhoto(previous);
  db.prepare('DELETE FROM photos WHERE id = ?').run(id);
  await removeUnusedImages([photo.src, photo.thumb, photo.medium]);
  res.json({ ok: true });
});
export default router;
