import { verifyBackup } from './backup-lib.mjs';
if (!process.argv[2]) { console.error('Usage: npm run verify-backup -- /path/to/backup'); process.exit(1); }
try { console.log(JSON.stringify({ event: 'backup_restore_verified', ...await verifyBackup(process.argv[2]) })); }
catch (error) { console.error(error.message); process.exitCode = 1; }
