import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig } from 'vite';

function contestApiPlugin() {
  const dbPath = path.resolve(__dirname, 'data/contest_db.json');

  return {
    name: 'contest-api-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/contest-data', (req: any, res: any, next: any) => {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          try {
            if (fs.existsSync(dbPath)) {
              const content = fs.readFileSync(dbPath, 'utf-8');
              res.end(content);
            } else {
              res.end(JSON.stringify({ judges: [], submissions: [], evaluations: [] }));
            }
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              let existing: any = {};
              if (fs.existsSync(dbPath)) {
                try {
                  existing = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
                } catch {}
              }
              const merged = { ...existing, ...parsed };
              fs.writeFileSync(dbPath, JSON.stringify(merged, null, 2), 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, data: merged }));
            } catch (e: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), contestApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
