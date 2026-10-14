import { Router } from 'express';
import { readdirSync, existsSync } from 'node:fs';
import { AUDIO_DIR } from '../config.js';
const router = Router();
router.get('/local', (_req, res) => {
  if (!existsSync(AUDIO_DIR)) return res.json({ files: [] });
  const extensions = /\.(mp3|flac|wav|ogg|aac|m4a)$/i;
  const files = readdirSync(AUDIO_DIR, { withFileTypes: true })
    .filter(f => f.isFile() && extensions.test(f.name)).map(f => f.name).sort()
    .map(f => ({ id: f, name: f.replace(/\.[^.]+$/, ''), filename: f, url: `/audio/${encodeURIComponent(f)}` }));
  res.json({ files });
});
export default router;
