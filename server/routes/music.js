import { Router } from 'express';
import { readdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

// 本地音乐目录（dev 下在 public/audio/，prod 下在 dist/audio/）
function getAudioDir() {
  const isDev = process.env.NODE_ENV !== 'production';
  const base = isDev
    ? path.join(__dirname, '..', '..', 'public', 'audio')
    : path.join(__dirname, '..', '..', 'dist', 'audio');
  return base;
}

// 列出本地音乐文件
router.get('/local', (_req, res) => {
  const dir = getAudioDir();
  if (!existsSync(dir)) return res.json({ files: [] });

  const AUDIO_EXT = ['.mp3', '.flac', '.wav', '.ogg', '.aac', '.m4a', '.wma'];
  const files = readdirSync(dir)
    .filter((f) => AUDIO_EXT.some((ext) => f.toLowerCase().endsWith(ext)))
    .sort()
    .map((f, i) => ({
      id: i,
      name: f.replace(/\.[^.]+$/, ''),        // 去掉扩展名作为显示名
      filename: f,
      url: `/audio/${encodeURIComponent(f)}`,
    }));

  res.json({ files });
});

export default router;
