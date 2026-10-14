import { Router } from 'express';
import { promises as fs } from 'node:fs';
import db from '../db.js';
import { requireAuth } from '../auth.js';
import { badRequest } from './errors.js';
import { reviewInput } from './validation.js';
import { uploadImage, processImage, removeGenerated, removeUnusedImages } from './images.js';
import { rateLimit } from './rate-limit.js';

export function reviewRoutes({ table, image, imageRoute, fields, arrays }) {
  const router = Router();
  const columns = fields.map(f => `"${f}"`).join(', ');
  const parseRow = row => ({ ...row, ...Object.fromEntries(arrays.map(key => [key, row[key] ? row[key].split(',').map(v => v.trim()).filter(Boolean) : []])) });
  const find = slug => {
    const row = db.prepare(`SELECT * FROM ${table} WHERE slug = ?`).get(slug);
    if (!row) throw badRequest('未找到', 404);
    return row;
  };
  router.get('/', (_req, res) => {
    // Full Markdown bodies are only needed on the detail endpoint.
    const listColumns = ['id', 'slug', ...fields.filter(f => f !== 'review'), 'created_at', 'updated_at'].map(f => `"${f}"`).join(', ');
    res.json(db.prepare(`SELECT ${listColumns} FROM ${table} ORDER BY created_at DESC, id DESC`).all().map(parseRow));
  });
  router.get('/:slug', (req, res) => res.json(parseRow(find(req.params.slug))));
  router.post('/', requireAuth, (req, res) => {
    const data = reviewInput(req.body, fields);
    try {
      db.prepare(`INSERT INTO ${table}(slug, ${columns}) VALUES (${['slug', ...fields].map(() => '?').join(', ')})`).run(data.slug, ...fields.map(f => data[f]));
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') throw badRequest('slug 已存在', 409);
      throw error;
    }
    res.status(201).json({ slug: data.slug });
  });
  router.put('/:slug', requireAuth, async (req, res) => {
    const previous = find(req.params.slug);
    const data = reviewInput(req.body, fields, previous);
    db.prepare(`UPDATE ${table} SET ${fields.map(f => `"${f}"=?`).join(', ')}, updated_at=datetime('now') WHERE slug=?`).run(...fields.map(f => data[f]), req.params.slug);
    if (previous[image] !== data[image]) await removeUnusedImages([previous[image]]);
    res.json({ ok: true });
  });
  router.delete('/:slug', requireAuth, async (req, res) => {
    const previous = find(req.params.slug);
    db.prepare(`DELETE FROM ${table} WHERE slug = ?`).run(req.params.slug);
    await removeUnusedImages([previous[image]]);
    res.json({ ok: true });
  });
  router.post(`/:slug/${imageRoute}`, requireAuth, rateLimit({ max: 30, windowMs: 60_000 }), (req, _res, next) => {
    req.previous = find(req.params.slug); next();
  }, uploadImage, async (req, res) => {
    let generated, previousImage;
    try {
      generated = await processImage(req.file);
      previousImage = db.transaction(() => {
        const previous = find(req.params.slug);
        db.prepare(`UPDATE ${table} SET ${image}=?, updated_at=datetime('now') WHERE slug=?`).run(generated.src, req.params.slug);
        return previous[image];
      })();
    } catch (error) {
      if (generated) await removeGenerated(generated.files);
      throw error;
    } finally {
      if (req.file) await fs.rm(req.file.path, { force: true });
    }
    await removeUnusedImages([previousImage]);
    res.json({ src: generated.src });
  });
  return router;
}
