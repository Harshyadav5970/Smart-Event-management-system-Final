// EventHub - College Event & Fest Management System
// Author: Harsh Yadav (Roll No: 129, TYCS-B)
// Guide: Faculty Coordinator
// Registration.js: Student registrations, QR hashes, and gate check-in status

const db = require('../db/memoryDb');

const regCollection = db.collection('registrations');

const Registration = {
  // Check if a student already registered for an event
  findOne: (filter) => {
    return regCollection.findOne(filter);
  },

  findById: (id) => {
    return regCollection.findById(id);
  },

  findByTicketId: (ticketId) => {
    if (!ticketId) return null;
    const clean = ticketId.trim().toUpperCase();
    return regCollection.findOne({ ticketId: clean }) || 
           regCollection.find().find(r => r.ticketId && r.ticketId.toUpperCase() === clean) || null;
  },

  findByVerificationHash: (hash) => {
    if (!hash) return null;
    return regCollection.findOne({ verificationHash: hash.trim() });
  },

  // Student's registered events (supports matching by ID or email for repeat passes)
  findByStudentId: (studentId, email) => {
    return regCollection.find().filter(r => 
      (studentId && String(r.studentId) === String(studentId)) ||
      (email && r.studentEmail && r.studentEmail.toLowerCase() === String(email).toLowerCase())
    ).sort((a, b) => new Date(b.registeredAt || 0) - new Date(a.registeredAt || 0));
  },

  // Event's registered students (for organizer/admin list & gate entry)
  findByEventId: (eventId) => {
    return regCollection.find({ eventId });
  },

  // Create new verified registration
  create: (regData) => {
    const item = {
      ticketId: regData.ticketId,
      verificationHash: regData.verificationHash,
      studentId: regData.studentId,
      studentName: regData.studentName,
      studentEmail: regData.studentEmail,
      rollNo: regData.rollNo || '129',
      studentClass: regData.studentClass || 'TYCS-B',
      department: regData.department || 'Computer Science',
      eventId: regData.eventId,
      eventTitle: regData.eventTitle,
      eventCategory: regData.eventCategory || 'Technical',
      eventDate: regData.eventDate,
      eventVenue: regData.eventVenue,
      feePaid: Number(regData.feePaid || 0),
      paymentStatus: Number(regData.feePaid || 0) > 0 ? 'Completed' : 'Free',
      passNumber: regData.passNumber || 1,
      checkInStatus: false,
      checkInTime: null,
      qrCodeDataUrl: regData.qrCodeDataUrl || '',
      registeredAt: new Date().toISOString()
    };
    return regCollection.insert(item);
  },

  // Gate check-in verification update
  markCheckedIn: (id, checkInTime = new Date().toISOString()) => {
    return regCollection.findByIdAndUpdate(id, {
      checkInStatus: true,
      checkInTime
    });
  },

  // Admin toggle check-in status (can mark present or revert to pending)
  toggleCheckIn: (id, status, checkInTime = new Date().toISOString()) => {
    return regCollection.findByIdAndUpdate(id, {
      checkInStatus: status,
      checkInTime: status ? checkInTime : null
    });
  },

  // Admin delete registration
  delete: (id) => {
    return regCollection.findByIdAndDelete(id);
  },

  // Fetch all registrations for fest analytics & admin auditing
  findAll: () => {
    return regCollection.find();
  },

  count: (filter) => {
    return regCollection.count(filter);
  }
};

module.exports = Registration;
