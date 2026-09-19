import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import {
  handleCompanionChat,
  handleScamAndBillAnalysis,
  handleDoctorVisitPrep,
  handleFamilyReplyDraft,
} from './src/services/aiServerHandler.ts';

function apiMiddlewarePlugin(): Plugin {
  return {
    name: 'api-middleware-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        res.setHeader('Content-Type', 'application/json');

        const getRequestBody = async () => {
          return new Promise<any>((resolve) => {
            let body = '';
            req.on('data', (chunk) => (body += chunk));
            req.on('end', () => {
              try {
                resolve(body ? JSON.parse(body) : {});
              } catch {
                resolve({});
              }
            });
          });
        };

        try {
          if (req.url === '/api/ai/companion' && req.method === 'POST') {
            const body = await getRequestBody();
            const result = await handleCompanionChat(body.messages || []);
            res.end(JSON.stringify(result));
            return;
          }

          if (req.url === '/api/ai/analyze-scam' && req.method === 'POST') {
            const body = await getRequestBody();
            const result = await handleScamAndBillAnalysis(body.content || '');
            res.end(JSON.stringify(result));
            return;
          }

          if (req.url === '/api/ai/doctor-prep' && req.method === 'POST') {
            const body = await getRequestBody();
            const result = await handleDoctorVisitPrep(
              body.symptoms || [],
              body.medications || []
            );
            res.end(JSON.stringify(result));
            return;
          }

          if (req.url === '/api/ai/family-reply' && req.method === 'POST') {
            const body = await getRequestBody();
            const result = await handleFamilyReplyDraft(
              body.originalMessage || '',
              body.seniorIntention || ''
            );
            res.end(JSON.stringify(result));
            return;
          }

          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Endpoint not found' }));
        } catch (error: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: error.message || 'Internal Server Error' }));
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiMiddlewarePlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
