import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

// Serve public/<dir>/index.html for bare-directory URLs in dev
// (production static hosts handle this natively).
function serveStaticIndex() {
  return {
    name: 'serve-static-index',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url.split('?')[0];
        const m = url.match(/^\/gigs\/([^/]+)\/?$/);
        if (m) {
          const file = path.resolve('public', m[1], 'index.html');
          if (fs.existsSync(file)) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(fs.readFileSync(file));
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [serveStaticIndex(), react()],
  base: '/gigs/',
});
