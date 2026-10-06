const express = require('express');
const { getDB, nextId } = require('../db/database');
const { authenticateToken, requireAdmin, requireOrganizerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Helper: get event with computed fields
function enrichEvent(e, db) {
  const regs = db.get('registrations').filter({ event_id: e.id }).value().filter(r => r.status !== 'cancelled');
  const fb = db.get('feedback').filter({ event_id: e.id }).value();
  const organizer = db.get('users').find({ id: e.organizer_id }).value();
  const avg_rating = fb.length ? (fb.reduce((s, f) => s + f.rating, 0) / fb.length) : null;
  return {
    ...e,
    registered_count: regs.length,
    avg_rating,
    feedback_count: fb.length,
    organizer_name: organizer ? organizer.name : 'Unknown',
    organizer_email: organizer ? organizer.email : ''
  };
}

// GET /api/events
router.get('/', (req, res) => {
  const db = getDB();
  const { category, status, search, featured, limit = 50, offset = 0 } = req.query;

  let events = db.get('events').value();

  if (category && category !== 'all') events = events.filter(e => e.category === category);
  if (status) events = events.filter(e => e.status === status);
  if (featured === 'true') events = events.filter(e => e.is_featured);
  if (search) {
    const s = search.toLowerCase();
    events = events.filter(e =>
      e.title.toLowerCase().includes(s) ||
      e.description.toLowerCase().includes(s) ||
      e.venue.toLowerCase().includes(s)
    );
  }

  // Sort by date ascending
  events = events.sort((a, b) => new Date(a.date) - new Date(b.date));

  const total = events.length;
  events = events.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  const enriched = events.map(e => enrichEvent(e, db));

  res.json({ success: true, data: enriched, total, limit: parseInt(limit), offset: parseInt(offset) });
});

// GET /api/events/:id
router.get('/:id', (req, res) => {
  const db = getDB();
  const event = db.get('events').find({ id: parseInt(req.params.id) }).value();
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  res.json({ success: true, data: enrichEvent(event, db) });
});

// POST /api/events
router.post('/', authenticateToken, requireOrganizerOrAdmin, (req, res) => {
  const db = getDB();
  const {
    title, description, category, date, time, end_time, venue,
    max_participants, registration_deadline, tags, prize, fee, is_featured
  } = req.body;

  if (!title || !description || !category || !date || !time || !venue) {
    return res.status(400).json({ success: false, message: 'Required: title, description, category, date, time, venue' });
  }

  const id = nextId(db, 'events');
  const newEvent = {
    id,
    title, description, category, date, time,
    end_time: end_time || null,
    venue,
    max_participants: parseInt(max_participants) || 100,
    registration_deadline: registration_deadline || null,
    tags: Array.isArray(tags) ? tags : [],
    prize: prize || '',
    fee: parseFloat(fee) || 0,
    organizer_id: req.user.id,
    status: 'upcoming',
    is_featured: !!is_featured,
    image: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.get('events').push(newEvent).write();

  // Notify all students
  const students = db.get('users').filter({ role: 'student' }).value();
  students.forEach(s => {
    const nid = nextId(db, 'notifications');
    db.get('notifications').push({
      id: nid, user_id: s.id,
      title: `New Event: ${title}`,
      message: `${title} has been added! Check it out and register before the deadline.`,
      type: 'event', is_read: false, event_id: id,
      created_at: new Date().toISOString()
    }).write();
  });

  res.status(201).json({ success: true, message: 'Event created successfully', data: enrichEvent(newEvent, db) });
});

// PUT /api/events/:id
router.put('/:id', authenticateToken, requireOrganizerOrAdmin, (req, res) => {
  const db = getDB();
  const eid = parseInt(req.params.id);
  const event = db.get('events').find({ id: eid }).value();

  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  if (req.user.role !== 'admin' && event.organizer_id !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized to edit this event' });
  }

  const {
    title, description, category, date, time, end_time, venue,
    max_participants, registration_deadline, tags, prize, fee, status, is_featured
  } = req.body;

  db.get('events').find({ id: eid }).assign({
    title: title || event.title,
    description: description || event.description,
    category: category || event.category,
    date: date || event.date,
    time: time || event.time,
    end_time: end_time !== undefined ? end_time : event.end_time,
    venue: venue || event.venue,
    max_participants: max_participants ? parseInt(max_participants) : event.max_participants,
    registration_deadline: registration_deadline !== undefined ? registration_deadline : event.registration_deadline,
    tags: tags !== undefined ? (Array.isArray(tags) ? tags : []) : event.tags,
    prize: prize !== undefined ? prize : event.prize,
    fee: fee !== undefined ? parseFloat(fee) : event.fee,
    status: status || event.status,
    is_featured: is_featured !== undefined ? !!is_featured : event.is_featured,
    updated_at: new Date().toISOString()
  }).write();

  const updated = db.get('events').find({ id: eid }).value();
  res.json({ success: true, message: 'Event updated', data: enrichEvent(updated, db) });
});

// DELETE /api/events/:id
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const db = getDB();
  const eid = parseInt(req.params.id);
  const event = db.get('events').find({ id: eid }).value();
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  db.get('events').remove({ id: eid }).write();
  db.get('registrations').remove({ event_id: eid }).write();
  db.get('feedback').remove({ event_id: eid }).write();

  res.json({ success: true, message: 'Event deleted successfully' });
});

// PATCH /api/events/:id/status
router.patch('/:id/status', authenticateToken, requireOrganizerOrAdmin, (req, res) => {
  const { status } = req.body;
  const valid = ['upcoming', 'ongoing', 'completed', 'cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

  const db = getDB();
  db.get('events').find({ id: parseInt(req.params.id) }).assign({ status, updated_at: new Date().toISOString() }).write();
  res.json({ success: true, message: `Status updated to ${status}` });
});

module.exports = router;
