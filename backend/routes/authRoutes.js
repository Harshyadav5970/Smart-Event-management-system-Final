// EventHub - College Event & Fest Management System
// Author: Harsh Yadav (Roll No: 129, TYCS-B)
// Guide: Faculty Coordinator
// authRoutes.js: Authentication endpoints and profile routes

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Public endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected endpoints
router.get('/me', authenticateToken, authController.getCurrentUser);
router.get('/users', authenticateToken, requireRole('admin'), authController.getAllUsers);

module.exports = router;
