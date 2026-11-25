import express from 'express';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import db from './db.js';
import authRoutes from './routes/auth.js';
import photoRoutes from './routes/photos.js';
import movieRoutes from './routes/movies.js';
import bookRoutes from './routes/books.js';
import musicRoutes from './routes/music.js';
import { decoratePhoto } from './lib/images.js';
import { UPLOADS_DIR, TEMP_DIR, AUDIO_DIR, DIST_DIR } from './config.js';
import { promises as fs } from 'node:fs';

export const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 'loopback');
app.use((req, res, next) => {
  const start = performance.now();
  const requestPath = req.path;
  const requestId = randomUUID();
  res.set({ 'X-Request-ID': requestId, 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'strict-origin-when-cross-origin' });
  res.on('finish', () => console.log(JSON.stringify({ event: 'request', requestId, method: req.method,
    path: requestPath, status: res.statusCode, durationMs: Math.round(performance.now() - start) })));
  next();
});
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (_req, res) => {
  db.prepare('SELECT 1').get();
  res.set('Cache-Control', 'no-store').json({ status: 'ok' });
});
app.use('/api/auth', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, authRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/movies', movieRoutes.router);
app.use('/api/books', bookRoutes.router);
app.use('/api/admin/movies', movieRoutes.admin);
app.use('/api/admin/books', bookRoutes.admin);
app.use('/api/music', musicRoutes);
app.get('/api/recent', (_req, res) => {
  const photo = db.prepare('SELECT id, src, thumb, medium, alt, width, height, location, date_taken FROM photos ORDER BY created_at DESC, id DESC LIMIT 1').get();
  const movie = db.prepare("SELECT slug, title, excerpt FROM movies WHERE status = 'published' ORDER BY published_at DESC, id DESC LIMIT 1").get();
  const book = db.prepare("SELECT slug, title, excerpt FROM books WHERE status = 'published' ORDER BY published_at DESC, id DESC LIMIT 1").get();
  res.set('Cache-Control', 'no-cache').json({ photo: photo ? decoratePhoto(photo) : null, movie: movie ?? null, book: book ?? null });
});
app.use('/api', (_req, res) => res.status(404).json({ error: '接口不存在' }));
const cached = { maxAge: '365d', immutable: true, index: false, dotfiles: 'deny' };
app.use('/uploads', express.static(UPLOADS_DIR, { ...cached, fallthrough: false }));
app.use('/audio', express.static(AUDIO_DIR, { maxAge: '1d', index: false, dotfiles: 'deny', fallthrough: false }));
app.use(express.static(DIST_DIR, {
  index: false, dotfiles: 'deny',
  setHeaders: (res, file) => res.set('Cache-Control', /[/\\]assets[/\\]/.test(file) ? 'public, max-age=31536000, immutable' : 'no-cache'),
}));
app.get('/{*path}', (req, res) => {
  if (path.extname(req.path)) return res.status(404).send('Not Found');
  res.set('Cache-Control', 'no-cache').sendFile(path.join(DIST_DIR, 'index.html'));
});
app.use(async (err, req, res, next) => {
  if (req.file && req.file.path.startsWith(TEMP_DIR + path.sep)) {
    await fs.rm(req.file.path, { force: true }).catch(() => {});
  }
  if (res.headersSent) return next(err);
  console.error(JSON.stringify({ event: 'request_error', requestId: res.getHeader('X-Request-ID'), code: err.code, message: err.message }));
  let status = Number.isInteger(err.status) && err.status >= 400 && err.status <= 599 ? err.status : 500;
  let message = err.expose ? err.message : status === 404 ? '未找到' : '服务器内部错误';
  if (err.type === 'entity.parse.failed') { status = 400; message = 'JSON 格式无效'; }
  if (err.type === 'entity.too.large' || err.code === 'LIMIT_FILE_SIZE') { status = 413; message = '上传内容过大'; }
  else if (err.code?.startsWith('LIMIT_')) { status = 400; message = '上传表单格式无效'; }
  res.status(status).json({ error: message });
});
