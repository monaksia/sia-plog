import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import photoRoutes from './routes/photos.js';
import movieRoutes from './routes/movies.js';
import bookRoutes from './routes/books.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const isDev = process.env.NODE_ENV !== 'production';

app.use(express.json());

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/books', bookRoutes);

// 上传文件静态访问
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 生产环境：提供前端静态文件
const distDir = path.join(__dirname, '..', 'dist');
app.use(express.static(distDir));

// SPA fallback：所有非 API 请求回退到 index.html
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[Server] http://localhost:${PORT}`);
  console.log(`[Server] 图片存储: ${path.join(__dirname, 'uploads')}`);
});
