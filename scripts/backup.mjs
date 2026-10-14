import { DATA_DIR, AUDIO_DIR } from '../server/config.js';
import { createBackup } from './backup-lib.mjs';
try {
  const result = await createBackup({ dataDir: DATA_DIR, audioDir: AUDIO_DIR,
    backupDir: process.env.SIA_BACKUP_DIR || '/var/backups/siaplog', retain: Number(process.env.SIA_BACKUP_RETAIN || 30) });
  console.log(JSON.stringify({ event: 'backup_verified', directory: result.directory, counts: result.counts }));
} catch (error) { console.error(JSON.stringify({ event: 'backup_failed', message: error.message })); process.exitCode = 1; }
