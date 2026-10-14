import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
// Audio is served from its persistent directory, not shipped in each frontend release.
const skipAudioCopy = {
  name: 'skip-audio-copy',
  closeBundle() { fs.rmSync(path.resolve('dist/audio'), { recursive: true, force: true }); },
};
export default defineConfig({
  plugins: [react(), skipAudioCopy],
  server: { port: 3000, proxy: Object.fromEntries(['/api', '/uploads', '/audio'].map(p => [p, 'http://127.0.0.1:3001'])) },
});
