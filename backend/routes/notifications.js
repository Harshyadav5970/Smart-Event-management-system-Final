const express = require('express');
const { getDB, nextId } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// IMPORTANT: /read-all MUST be defined BEFORE /:id
// otherwise Express matches 'read-all' as the :id param

// PATCH /api/notifications/read-all
router.patch('/read-all', authenticateToken, (req, res) => {
  const db = getDB();
  db.get('notifications').filter({ user_id: req.user.id }).each(n => { n.is_read = true; }).write();
  res.json({ success: true, message: 'All notifications marked as read' });
});

// GET /api/notifications
router.get('/', authenticateToken, (req, res) => {
  const db = getDB();
  const { limit = 20, unread_only } = req.query;
  let notifs = db.get('notifications').filter({ user_id: req.user.id }).value();

  if (unread_only === 'true') notifs = notifs.filter(n => !n.is_read);

  notifs = notifs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, parseInt(limit));
  const unreadCount = db.get('notifications').filter({ user_id: req.user.id, is_read: false }).value().length;

  res.json({ success: true, data: notifs, unreadCount });
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticateToken, (req, res) => {
  const db = getDB();
  db.get('notifications').find({ id: parseInt(req.params.id), user_id: req.user.id }).assign({ is_read: true }).write();
  res.json({ success: true, message: 'Marked as read' });
});

// DELETE /api/notifications/:id
router.delete('/:id', authenticateToken, (req, res) => {
  const db = getDB();
  db.get('notifications').remove({ id: parseInt(req.params.id), user_id: req.user.id }).write();
  res.json({ success: true, message: 'Notification deleted' });
});

module.exports = router;
