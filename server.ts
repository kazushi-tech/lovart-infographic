import express from 'express';
import { createServer as createViteServer } from 'vite';

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || '3000', 10);

// API routes can go here (e.g. for database operations)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Runtime config endpoint for development only
// Returns fallback API keys for local development.
// In production, keys must be provided by users via UI.
app.get("/api/runtime-config", (req, res) => {
  // Production includes production, staging, and test environments
  // Only expose API keys in development (NODE_ENV === 'development')
  const isDev = process.env.NODE_ENV === 'development';
  res.json({
    devFallbackGeminiKey: isDev ? (process.env.GEMINI_API_KEY || '') : '',
    devFallbackImageKey: isDev ? (process.env.API_KEY || '') : '',
    devMode: isDev,
  });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
