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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
