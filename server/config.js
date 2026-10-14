import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROJECT_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const DATA_DIR = path.resolve(process.env.SIA_DATA_DIR || path.join(PROJECT_DIR, 'server'));
export const DB_PATH = path.join(DATA_DIR, 'data.db');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
export const TEMP_DIR = path.join(DATA_DIR, 'tmp');
export const AUDIO_DIR = path.resolve(process.env.SIA_AUDIO_DIR || path.join(PROJECT_DIR, 'public', 'audio'));
export const DIST_DIR = path.join(PROJECT_DIR, 'dist');
