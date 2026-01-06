import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './src/routes/auth.js';
import weaponsRoutes from './src/routes/weapons.js';
import wavesRoutes from './src/routes/waves.js';
import shopRoutes from './src/routes/shop.js';
import enemiesRoutes from './src/routes/enemies.js';
import bossesRoutes from './src/routes/bosses.js';
import powerupsRoutes from './src/routes/powerups.js';
import uploadRoutes from './src/routes/upload.js';
import statsRoutes from './src/routes/stats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting - more lenient for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // 1000 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/weapons', weaponsRoutes);
app.use('/api/waves', wavesRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/enemies', enemiesRoutes);
app.use('/api/bosses', bossesRoutes);
app.use('/api/powerups', powerupsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stats', statsRoutes);

// Serve static files from parent public directory
const publicPath = path.join(__dirname, '..', 'public');
console.log('[Static] Serving static files from:', publicPath);
app.use(express.static(publicPath));

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║   🎮 Kombat Game API Server               ║
║   🚀 Running on http://localhost:${PORT}   ║
║   📝 Environment: ${process.env.NODE_ENV}            ║
╚═══════════════════════════════════════════╝
  `);
});

export default app;
