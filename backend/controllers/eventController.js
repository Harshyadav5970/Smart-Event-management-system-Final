// EventHub - College Event & Fest Management System
// Author: Harsh Yadav (Roll No: 129, TYCS-B)
// Guide: Faculty Coordinator
// eventController.js: CRUD operations, filtering, and announcements for college fests

const Event = require('../models/Event');
const Announcement = require('../models/Announcement');

// Get all events with filters (category, status, free/paid, search)
exports.getAllEvents = (req, res) => {
  try {
    const { category, status, type, search } = req.query;
    const events = Event.findAll({ category, status, type, search });
    return res.json({
      success: true,
      count: events.length,
      events
    });
  } catch (err) {
    console.error('[Get Events Error]:', err);
    return res.status(500).json({ success: false, message: 'Could not fetch events list.' });
  }
};

// Get single event by ID
exports.getEventById = (req, res) => {
  try {
    const event = Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }
    return res.json({ success: true, event });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving event.' });
  }
};

// Create new college event (Organizers & Admin)
exports.createEvent = (req, res) => {
  try {
    const { title, description, category, date, time, venue, registrationFee, capacity, bannerUrl, tags } = req.body;

    if (!title || !date || !venue) {
      return res.status(400).json({
        success: false,
        message: 'Title, date, and venue are mandatory to create an event.'
      });
    }

    const newEvent = Event.create({
      title: title.trim(),
      description: description || '',
      category: category || 'Technical',
      date,
      time: time || '10:00 AM',
      venue: venue.trim(),
      registrationFee: Number(registrationFee || 0),
      capacity: Number(capacity || 150),
      bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&auto=format&fit=crop',
      organizerId: req.user ? req.user.id : 'org_default',
      organizerName: req.user ? req.user.name : 'Tech Club Head',
      organizerClub: req.user && req.user.department ? `${req.user.department} Association` : 'College Fest Committee',
      tags: tags || ['Fest 2026', category || 'Technical']
    });

    // Auto-create an announcement for the new event
    Announcement.create({
      title: `New Event Announced: ${newEvent.title}`,
      message: `Registrations are now open for ${newEvent.title} scheduled on ${newEvent.date} at ${newEvent.venue}!`,
      type: 'info',
      eventId: newEvent._id,
      eventTitle: newEvent.title,
      authorName: req.user ? req.user.name : 'EventHub Organizer',
      authorRole: req.user ? req.user.role : 'organizer'
    });

    return res.status(201).json({
      success: true,
      message: 'Event created and published successfully!',
      event: newEvent
    });
  } catch (err) {
    console.error('[Create Event Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error creating event.' });
  }
};

// Update event details or mark Completed
exports.updateEvent = (req, res) => {
  try {
    const event = Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const updated = Event.update(req.params.id, req.body);

    // If marked completed, broadcast announcement that certificates are ready
    if (req.body.status === 'Completed' && event.status !== 'Completed') {
      Announcement.create({
        title: `Event Completed: ${event.title}`,
        message: `Thank you for attending ${event.title}! Checked-in attendees can now download their digital certificates from their dashboard.`,
        type: 'success',
        eventId: event._id,
        eventTitle: event.title,
        authorName: req.user ? req.user.name : 'EventHub System',
        authorRole: 'organizer'
      });
    }

    return res.json({
      success: true,
      message: 'Event updated successfully.',
      event: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update event.' });
  }
};

// Delete event
exports.deleteEvent = (req, res) => {
  try {
    const deleted = Event.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }
    return res.json({ success: true, message: 'Event deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete event.' });
  }
};

// Get all announcements
exports.getAnnouncements = (req, res) => {
  try {
    const announcements = Announcement.findAll();
    return res.json({ success: true, count: announcements.length, announcements });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not fetch announcements.' });
  }
};

// Post a new announcement/notice
exports.createAnnouncement = (req, res) => {
  try {
    const { title, message, type, eventId, eventTitle } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required.' });
    }

    const announcement = Announcement.create({
      title,
      message,
      type: type || 'info',
      eventId: eventId || null,
      eventTitle: eventTitle || 'All Events',
      authorName: req.user ? req.user.name : 'College Fest Committee',
      authorRole: req.user ? req.user.role : 'organizer'
    });

    return res.status(201).json({
      success: true,
      message: 'Announcement broadcasted successfully!',
      announcement
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not post announcement.' });
  }
};

// Delete announcement
exports.deleteAnnouncement = (req, res) => {
  try {
    Announcement.delete(req.params.id);
    return res.json({ success: true, message: 'Announcement removed.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not delete announcement.' });
  }
};
