// Generate responsive variants for existing photos without replacing original URLs.
import db from '../server/db.js';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { UPLOADS_DIR } from '../server/config.js';
for (const dir of ['thumbs', 'medium']) fs.mkdirSync(path.join(UPLOADS_DIR, dir), { recursive: true, mode: 0o750 });
try {
  for (const row of db.prepare('SELECT * FROM photos').all()) {
    if (!/^\/uploads\/[\w.-]+$/.test(row.src)) continue;
    const src = path.join(UPLOADS_DIR, path.basename(row.src));
    const base = path.basename(row.src, path.extname(row.src));
    const updates = {};
    for (const [field, dir, width] of [['thumb', 'thumbs', 400], ['medium', 'medium', 1000]]) {
      const url = `/uploads/${dir}/${base}_${field}.webp`;
      const file = path.join(UPLOADS_DIR, dir, path.basename(url));
      if (!fs.existsSync(file)) {
        const temporary = file + '.tmp';
        try { await sharp(src, { limitInputPixels: 40_000_000 }).rotate().resize(width, null, { withoutEnlargement: true }).webp({ quality: field === 'thumb' ? 70 : 78 }).toFile(temporary); fs.renameSync(temporary, file); }
        finally { fs.rmSync(temporary, { force: true }); }
      }
      updates[field] = url;
    }
    db.prepare('UPDATE photos SET thumb = ?, medium = ? WHERE id = ?').run(updates.thumb, updates.medium, row.id);
  }
  console.log('Existing photo variants verified.');
} finally { db.close(); }
