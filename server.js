require('dotenv').config();

const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const path    = require('path');
const rateLimit = require('express-rate-limit');

const { initDB } = require('./db');
const contactRoute = require('./routes/contact');
const adminRoute   = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Database ──────────────────────────────────────────────────────
initDB();

// ── Security middleware ───────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false })); // CSP disabled so inline <script> works
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json({ limit: '10kb' }));

// Trust proxy (needed for accurate IP behind Nginx/Render/Railway)
app.set('trust proxy', 1);

// ── Rate limiting (contact form: 5 submissions / IP / hour) ───────
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions. Please try again in an hour.' },
});

// ── API routes ────────────────────────────────────────────────────
app.use('/api/contact', contactLimiter, contactRoute);
app.use('/api/admin',   adminRoute);

// ── Admin panel ───────────────────────────────────────────────────
app.get('/admin', (_req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// ── Static files (serves index.html + assets) ─────────────────────
app.use(express.static(path.join(__dirname)));

// ── Fallback ──────────────────────────────────────────────────────
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ── Start ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🦑  Octopus AI server  →  http://localhost:${PORT}`);
  console.log(`📊  Admin dashboard   →  http://localhost:${PORT}/admin\n`);
});
