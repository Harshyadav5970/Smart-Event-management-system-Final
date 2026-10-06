// EventHub - College Event & Fest Management System
// Author: Harsh Yadav (Roll No: 129, TYCS-B)
// Guide: Faculty Coordinator
// Announcement.js: Real-time broadcast alerts and fest notices

const db = require('../db/memoryDb');

const annCollection = db.collection('announcements');

const Announcement = {
  findAll: () => {
    return annCollection.find().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  findById: (id) => {
    return annCollection.findById(id);
  },

  create: (data) => {
    const item = {
      title: data.title,
      message: data.message,
      type: data.type || 'info', // 'info', 'warning', 'urgent', 'success'
      eventId: data.eventId || null,
      eventTitle: data.eventTitle || 'All Events',
      authorName: data.authorName || 'Fest Committee',
      authorRole: data.authorRole || 'organizer',
      createdAt: new Date().toISOString()
    };
    return annCollection.insert(item);
  },

  delete: (id) => {
    return annCollection.findByIdAndDelete(id);
  }
};

module.exports = Announcement;
