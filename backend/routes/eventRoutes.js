// EventHub - College Event & Fest Management System
// Author: Harsh Yadav (Roll No: 129, TYCS-B)
// Guide: Faculty Coordinator
// eventRoutes.js: Routes for event discovery, creation, updates, and announcements

const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Public event routes
router.get('/', eventController.getAllEvents);
router.get('/announcements', eventController.getAnnouncements);
router.get('/:id', eventController.getEventById);

// Protected routes (Organizers & Admins)
router.post('/', authenticateToken, requireRole(['organizer', 'admin']), eventController.createEvent);
router.put('/:id', authenticateToken, requireRole(['organizer', 'admin']), eventController.updateEvent);
router.delete('/:id', authenticateToken, requireRole(['organizer', 'admin']), eventController.deleteEvent);

// Announcements routes
router.post('/announcements', authenticateToken, requireRole(['organizer', 'admin']), eventController.createAnnouncement);
router.delete('/announcements/:id', authenticateToken, requireRole(['organizer', 'admin']), eventController.deleteAnnouncement);

module.exports = router;
