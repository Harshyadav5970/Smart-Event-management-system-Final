// EventHub - College Event & Fest Management System
// Author: Harsh Yadav (Roll No: 129, TYCS-B)
// Guide: Faculty Coordinator
// analyticsRoutes.js: Real-time fest dashboard analytics and reports

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Organizers and Admins can access analytics
router.get('/overview', authenticateToken, requireRole(['organizer', 'admin']), analyticsController.getFestStats);

module.exports = router;
