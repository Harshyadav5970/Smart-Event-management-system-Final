const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db/database');

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const registrationRoutes = require('./routes/registrations');
const feedbackRoutes = require('./routes/feedback');
const analyticsRoutes = require('./routes/analytics');
const notificationRoutes = require('./routes/notifications');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database
initDB();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend (supports both repository root and /frontend)
app.use(express.static(path.join(__dirname, '../')));
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'EventHub API is running', time: new Date().toISOString() });
});

// Catch-all: serve frontend for any non-API routes
const fs = require('fs');
app.get('*', (req, res) => {
  const rootIndex = path.join(__dirname, '../index.html');
  if (fs.existsSync(rootIndex)) {
    res.sendFile(rootIndex);
  } else {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`\n🎉 EventHub Server running on http://localhost:${PORT}`);
  console.log(`📚 API available at http://localhost:${PORT}/api`);
  console.log(`\nDefault Admin Credentials:`);
  console.log(`  Email: admin@eventhub.edu`);
  console.log(`  Password: admin123\n`);
});

module.exports = app;
