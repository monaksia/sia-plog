import { app } from './app.js';
import db from './db.js';
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';
const server = app.listen(port, host, () => console.log(JSON.stringify({ event: 'server_started', host, port, nodeEnv: process.env.NODE_ENV || 'development' })));
let stopping = false;
function stop(signal) {
  if (stopping) return;
  stopping = true;
  console.log(JSON.stringify({ event: 'server_stopping', signal }));
  const timer = setTimeout(() => { server.closeAllConnections(); db.close(); process.exit(1); }, 10_000);
  timer.unref();
  server.close(() => { clearTimeout(timer); db.close(); process.exit(0); });
}
process.on('SIGTERM', () => stop('SIGTERM'));
process.on('SIGINT', () => stop('SIGINT'));
server.on('error', error => { console.error(JSON.stringify({ event: 'server_error', code: error.code })); db.close(); process.exit(1); });
