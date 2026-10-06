const express = require('express');
const { getDB, nextId } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/feedback/event/:eventId
router.get('/event/:eventId', (req, res) => {
  const db = getDB();
  const eid = parseInt(req.params.eventId);
  const feedbacks = db.get('feedback').filter({ event_id: eid }).value();

  const enriched = feedbacks.map(f => {
    const user = db.get('users').find({ id: f.user_id }).value() || {};
    return { ...f, user_name: user.name, department: user.department };
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const total = feedbacks.length;
  const avg_rating = total ? feedbacks.reduce((s, f) => s + f.rating, 0) / total : null;
  const counts = { five_star: 0, four_star: 0, three_star: 0, two_star: 0, one_star: 0 };
  const names = ['', 'one_star', 'two_star', 'three_star', 'four_star', 'five_star'];
  feedbacks.forEach(f => { if (names[f.rating]) counts[names[f.rating]]++; });

  res.json({ success: true, data: enriched, stats: { avg_rating, total, ...counts } });
});

// GET /api/feedback/my
router.get('/my', authenticateToken, (req, res) => {
  const db = getDB();
  const feedbacks = db.get('feedback').filter({ user_id: req.user.id }).value();
  const enriched = feedbacks.map(f => {
    const event = db.get('events').find({ id: f.event_id }).value() || {};
    return { ...f, event_title: event.title, event_date: event.date };
  });
  res.json({ success: true, data: enriched });
});

// POST /api/feedback
router.post('/', authenticateToken, (req, res) => {
  const { event_id, rating, comment, category } = req.body;
  if (!event_id || !rating) return res.status(400).json({ success: false, message: 'Event ID and rating required' });
  if (rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Rating must be 1-5' });

  const db = getDB();
  const eid = parseInt(event_id);

  // Check if registered
  const attended = db.get('registrations').filter({ event_id: eid, user_id: req.user.id })
    .value().filter(r => ['registered', 'attended', 'waitlist'].includes(r.status));
  if (!attended.length) {
    return res.status(403).json({ success: false, message: 'You must be registered to submit feedback' });
  }

  const existing = db.get('feedback').find({ event_id: eid, user_id: req.user.id }).value();
  if (existing) {
    db.get('feedback').find({ id: existing.id }).assign({
      rating: parseInt(rating), comment: comment || '', category: category || 'general'
    }).write();
    return res.json({ success: true, message: 'Feedback updated!' });
  }

  const id = nextId(db, 'feedback');
  db.get('feedback').push({
    id, event_id: eid, user_id: req.user.id,
    rating: parseInt(rating), comment: comment || '',
    category: category || 'general',
    created_at: new Date().toISOString()
  }).write();

  res.status(201).json({ success: true, message: 'Feedback submitted! Thank you.' });
});

module.exports = router;
