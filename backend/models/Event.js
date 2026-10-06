// EventHub - College Event & Fest Management System
// Author: Harsh Yadav (Roll No: 129, TYCS-B)
// Guide: Faculty Coordinator
// Event.js: College events schema, queries, and status updates

const db = require('../db/memoryDb');

const eventCollection = db.collection('events');

const Event = {
  // Find all events with optional filters (category, status, free/paid)
  findAll: (filters = {}) => {
    let list = eventCollection.find();

    if (filters.category && filters.category !== 'All') {
      list = list.filter(e => e.category.toLowerCase() === filters.category.toLowerCase());
    }

    if (filters.status && filters.status !== 'All') {
      list = list.filter(e => e.status.toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.type === 'Free') {
      list = list.filter(e => Number(e.registrationFee || 0) === 0);
    } else if (filters.type === 'Paid') {
      list = list.filter(e => Number(e.registrationFee || 0) > 0);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(e => 
        e.title.toLowerCase().includes(q) || 
        e.description.toLowerCase().includes(q) ||
        (e.venue && e.venue.toLowerCase().includes(q))
      );
    }

    // Sort upcoming events chronologically
    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  findById: (id) => {
    return eventCollection.findById(id);
  },

  // Create event with fest defaults
  create: (eventData) => {
    const item = {
      title: eventData.title,
      description: eventData.description || 'No description provided.',
      category: eventData.category || 'Technical', // Technical, Cultural, Sports, Workshop, Gaming
      date: eventData.date || new Date().toISOString().split('T')[0],
      time: eventData.time || '10:00 AM',
      venue: eventData.venue || 'College Auditorium',
      registrationFee: Number(eventData.registrationFee || 0),
      capacity: Number(eventData.capacity || 100),
      bannerUrl: eventData.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&auto=format&fit=crop',
      status: eventData.status || 'Upcoming', // Upcoming, Ongoing, Completed, Cancelled
      organizerId: eventData.organizerId,
      organizerName: eventData.organizerName || 'College Tech Committee',
      organizerClub: eventData.organizerClub || 'CS Club',
      registeredCount: 0,
      tags: eventData.tags || ['Inter-College', 'Fest 2026']
    };
    return eventCollection.insert(item);
  },

  update: (id, updates) => {
    return eventCollection.findByIdAndUpdate(id, updates);
  },

  delete: (id) => {
    return eventCollection.findByIdAndDelete(id);
  },

  // Increment or decrement registeredCount safely
  incrementRegisteredCount: (id, delta = 1) => {
    const ev = eventCollection.findById(id);
    if (!ev) return null;
    const newCount = Math.max(0, (ev.registeredCount || 0) + delta);
    return eventCollection.findByIdAndUpdate(id, { registeredCount: newCount });
  },

  count: (filter) => {
    return eventCollection.count(filter);
  }
};

module.exports = Event;
