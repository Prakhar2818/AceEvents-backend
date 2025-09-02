const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const serverless = require('serverless-http'); // ✅ Add this

const authRoutes = require('./routes/auth');

dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use('/*path', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ❌ Remove app.listen()
// ✅ Instead export app & handler for Vercel
module.exports = app;
module.exports.handler = serverless(app);
