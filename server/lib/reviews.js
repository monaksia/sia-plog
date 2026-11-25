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
  const admin = Router();
  const columns = fields.map(f => `"${f}"`).join(', ');
  const parseRow = row => ({ ...row, ...Object.fromEntries(arrays.map(key => [key, row[key] ? row[key].split(',').map(v => v.trim()).filter(Boolean) : []])) });
  const find = (slug, includeDrafts = false) => {
    const visibility = includeDrafts ? '' : "AND status = 'published'";
    const row = db.prepare(`SELECT * FROM ${table} WHERE slug = ? ${visibility}`).get(slug);
    if (!row) throw badRequest('未找到', 404);
    return row;
  };
  // Full Markdown bodies are only needed on the detail endpoints.
  const listColumns = ['id', 'slug', ...fields.filter(f => f !== 'review'), 'status', 'created_at', 'updated_at', 'published_at'].map(f => `"${f}"`).join(', ');
  router.get('/', (_req, res) => {
    res.json(db.prepare(`SELECT ${listColumns} FROM ${table} WHERE status = 'published' ORDER BY published_at DESC, id DESC`).all().map(parseRow));
  });
  router.get('/:slug', (req, res) => res.json(parseRow(find(req.params.slug))));
  admin.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, requireAuth);
  admin.get('/', (_req, res) => {
    res.json(db.prepare(`SELECT ${listColumns} FROM ${table} ORDER BY created_at DESC, id DESC`).all().map(parseRow));
  });
  admin.get('/:slug', (req, res) => res.json(parseRow(find(req.params.slug, true))));
  const slugExists = db.prepare(`SELECT 1 FROM ${table} WHERE slug = ?`);
  const insert = db.prepare(`INSERT INTO ${table}(slug, ${columns}, status, published_at)
    VALUES (?, ${fields.map(() => '?').join(', ')}, ?, CASE WHEN ? = 'published' THEN strftime('%Y-%m-%d %H:%M:%f', 'now') END)`);
  const create = db.transaction(data => {
    let slug = data.slug;
    if (data.autoSlug) {
      for (let index = 2; slugExists.get(slug); index++) {
        const suffix = `-${index}`;
        slug = Array.from(data.slug).slice(0, 120 - suffix.length).join('') + suffix;
      }
    }
    insert.run(slug, ...fields.map(f => data[f]), data.status, data.status);
    return slug;
  });
  router.post('/', requireAuth, (req, res) => {
    const data = reviewInput(req.body, fields);
    try {
      res.status(201).json({ slug: create.immediate(data) });
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') throw badRequest('网址标识已存在', 409);
      throw error;
    }
  });
  const updateStatement = db.prepare(`UPDATE ${table} SET ${fields.map(f => `"${f}"=?`).join(', ')}, status = ?,
      published_at = CASE WHEN ? = 'published' THEN COALESCE(published_at, strftime('%Y-%m-%d %H:%M:%f', 'now')) END,
      updated_at = CURRENT_TIMESTAMP WHERE slug = ?`);
  const update = db.transaction((slug, body) => {
    const previous = find(slug, true);
    const data = reviewInput(body, fields, previous);
    updateStatement.run(...fields.map(f => data[f]), data.status, data.status, slug);
    return previous[image] !== data[image] ? previous[image] : null;
  });
  router.put('/:slug', requireAuth, async (req, res) => {
    const replacedImage = update.immediate(req.params.slug, req.body);
    if (replacedImage) await removeUnusedImages([replacedImage]);
    res.json({ ok: true });
  });
  router.delete('/:slug', requireAuth, async (req, res) => {
    const previous = find(req.params.slug, true);
    db.prepare(`DELETE FROM ${table} WHERE slug = ?`).run(req.params.slug);
    await removeUnusedImages([previous[image]]);
    res.json({ ok: true });
  });
  router.post(`/:slug/${imageRoute}`, requireAuth, rateLimit({ max: 30, windowMs: 60_000 }), (req, _res, next) => {
    find(req.params.slug, true); next();
  }, uploadImage, async (req, res) => {
    let generated, previousImage;
    try {
      generated = await processImage(req.file);
      previousImage = db.transaction(() => {
        const previous = find(req.params.slug, true);
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
  return { router, admin };
}
