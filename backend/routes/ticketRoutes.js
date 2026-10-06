// EventHub - College Event & Fest Management System
// Author: Harsh Yadav (Roll No: 129, TYCS-B)
// Guide: Faculty Coordinator
// ticketRoutes.js: Routes for event passes, QR verification, and attendee management

const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authenticateToken, optionalAuthenticateToken, requireRole } = require('../middleware/auth');

// Student registers for an event (email and password verified)
router.post('/register', optionalAuthenticateToken, ticketController.registerForEvent);

// Student views own tickets
router.get('/my-tickets', authenticateToken, ticketController.getMyRegistrations);

// Live Gate Scanner checks in student QR code (Organizers & Admin)
router.post('/checkin', authenticateToken, requireRole(['organizer', 'admin']), ticketController.verifyAndCheckIn);

// Organizer/Admin views attendee roster for an event
router.get('/attendees/:eventId', authenticateToken, requireRole(['organizer', 'admin']), ticketController.getEventAttendees);

// Downloadable certificate verification
router.get('/certificate/:ticketId', authenticateToken, ticketController.getCertificateData);

// Public Certificate Verification (Open verification for employers, recruiters & viva examiners)
router.get('/verify-public/:certId', ticketController.verifyPublicCertificate);

// Export Attendees CSV (Organizers, Admin & Evaluators)
router.get('/export-csv/:eventId', ticketController.exportAttendeesCSV);

// Admin Exclusive: All Registrations Master Ledger
router.get('/all-registrations', authenticateToken, requireRole('admin'), ticketController.getAllRegistrationsAdmin);

// Admin Exclusive: Manual Toggle Gate Check-in Status
router.put('/admin-checkin/:id', authenticateToken, requireRole('admin'), ticketController.adminToggleCheckIn);

// Admin Exclusive: Delete / Revoke Registration
router.delete('/admin-registration/:id', authenticateToken, requireRole('admin'), ticketController.adminDeleteRegistration);

module.exports = router;

