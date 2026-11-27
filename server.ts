import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { DEFAULT_10_OUTLETS } from './src/data/pressMetadata.ts';
import { registerImageProxyRoutes } from './server/routes/imageProxy.ts';
import { registerBriefingRoutes } from './server/routes/briefing.ts';
import { registerEmailRoutes } from './server/routes/email.ts';
import { generateLiveSummaryPayload } from './server/services/gemini.ts';
import { warmUpMailTransporter } from './server/services/mailService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '512kb' }));

// Modular API routes
registerImageProxyRoutes(app);
registerBriefingRoutes(app);
registerEmailRoutes(app);

// Vite middleware in dev or static files in prod
// Only activate when not running in Vercel Serverless Function
if (!process.env.VERCEL) {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const BACKGROUND_RSS_REFRESH_MS = 120_000;

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Morning Brief Server running on http://0.0.0.0:${PORT}`);
    // Pre-warm pooled Naver SMTP connection in background so live email sends complete under 3s
    setTimeout(() => {
      warmUpMailTransporter().catch(() => {});
    }, 400);

    // Pre-warm live news cache immediately on startup (1 consolidated Gemini call max)
    const initialWarmUp = () => {
      generateLiveSummaryPayload(DEFAULT_10_OUTLETS, 'insight', false, {
        skipGemini: false,
        waitForAi: true,
      }).catch((err) => {
        console.info('Initial live news warm-up deferred:', err?.message || 'unavailable');
      });
    };
    // Background ticks refresh scraped RSS articles only and reuse 6h per-item Gemini summaries
    const backgroundRssRefresh = () => {
      generateLiveSummaryPayload(DEFAULT_10_OUTLETS, 'insight', false, {
        skipGemini: true,
        waitForAi: true,
      }).catch((err) => {
        console.info('Background RSS refresh deferred:', err?.message || 'unavailable');
      });
    };
    setTimeout(initialWarmUp, 250);
    setInterval(backgroundRssRefresh, BACKGROUND_RSS_REFRESH_MS);
  });
}

export default app;
