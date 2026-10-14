// Alternative to systemd; use only one process manager for the API.
module.exports = { apps: [{
  name: 'sia-plog', cwd: '/var/www/sia-plog', script: 'server/index.js',
  interpreter: '/var/www/sia-plog/.runtime/node',
  uid: 'www-data', gid: 'www-data',
  env: { NODE_ENV: 'production', HOST: '127.0.0.1', PORT: '3001',
    SIA_DATA_DIR: '/var/lib/siaplog', SIA_AUDIO_DIR: '/var/lib/siaplog/audio' },
  kill_timeout: 15000, exp_backoff_restart_delay: 100,
}] };
