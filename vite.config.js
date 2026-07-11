
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { mkdirSync, writeFileSync } from 'node:fs';

function sitesWorker() {
  return {
    name: 'sites-worker',
    closeBundle() {
      mkdirSync('dist/server', { recursive: true });
      writeFileSync('dist/server/index.js', `export default {\n  async fetch(request, env) {\n    return env.ASSETS.fetch(request);\n  }\n};\n`);
    },
  };
}

export default defineConfig({
  plugins: [react(), sitesWorker()],
});
