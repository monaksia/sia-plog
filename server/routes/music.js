import { Router } from 'express';
import { readdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

// 本地音乐目录（始终从 public/audio/ 读取，dev 和 prod 统一）
function getAudioDir() {
  return path.join(__dirname, '..', '..', 'public', 'audio');
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
