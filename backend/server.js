import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import connectDB from './config/db.js';
import passport from './config/passportConfig.js';

import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import applicationRoutes from './routes/applications.js';
import protect from './middleware/authMiddleware.js';
import admin from './middleware/roleMiddleware.js';

// Load env vars
dotenv.config();

// Connect to database
if (process.env.MONGO_URI) {
  connectDB();
} else {
  console.log('⚠️  Skipping MongoDB connection (MONGO_URI not set in .env).');
}

const app = express();

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// express-session: required for Passport Google OAuth handshake only
// (we use JWTs for actual auth, session is transient)
app.use(session({
  secret: process.env.JWT_SECRET || 'session_secret_fallback',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/admin', protect, admin, adminRoutes);          // Admin routes: JWT + role guard
app.use('/api/applications', protect, applicationRoutes);   // App routes: JWT guard

// Shared public exams route (for the application form dropdown)
app.get('/api/exams', async (req, res) => {
  try {
    const response = await fetch('http://localhost:' + (process.env.PORT || 5000) + '/api/admin/exams', {
      headers: { Authorization: req.headers.authorization || '' }
    });
    const data = await response.json();
    res.json(data);
  } catch {
    res.status(500).json({ message: 'Failed to fetch exams' });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'NetCafe Connect API is running ✅' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
