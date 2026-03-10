import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import applicationRoutes from './routes/applications.js';

// Load env vars
dotenv.config();

// Connect to database
if (process.env.MONGO_URI) {
  connectDB();
} else {
  console.log('Skipping MongoDB connection for now (MONGO_URI not set).');
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/s3', applicationRoutes); // using same router for the mock s3 endpoint
app.use('/api/payment', applicationRoutes); // using same router for mock payment endpoints

// Shared public exams route mapping to admin inside the mock for now
app.get('/api/exams', (req, res) => {
  // redirecting to admin exams just for mockup purposes to share the same in-memory array
  res.redirect('/api/admin/exams');
});

// Basic Route for test
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Return JSON for unknown API routes to avoid empty/non-JSON frontend parsing failures.
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// Centralized JSON error handler for API requests.
app.use((err, req, res, next) => {
  console.error(err.stack || err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
