const express = require('express');
const { getDB } = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/profile
router.get('/profile', authenticateToken, (req, res) => {
  const db = getDB();
  const user = db.get('users').find({ id: req.user.id }).value();
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const { password: _, ...safeUser } = user;
  res.json({ success: true, data: safeUser });
});

// PUT /api/users/profile
router.put('/profile', authenticateToken, (req, res) => {
  const { name, department, year, phone, interests } = req.body;
  const db = getDB();

  db.get('users').find({ id: req.user.id }).assign({
    name: name || req.user.name,
    department: department !== undefined ? department : req.user.department,
    year: year !== undefined ? year : req.user.year,
    phone: phone !== undefined ? phone : req.user.phone,
    interests: interests || [],
    updated_at: new Date().toISOString()
  }).write();

  const updated = db.get('users').find({ id: req.user.id }).value();
  const { password: _, ...safeUser } = updated;
  res.json({ success: true, message: 'Profile updated', data: safeUser });
});

// GET /api/users (admin only)
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  const db = getDB();
  const { role, search } = req.query;

  let users = db.get('users').value();
  if (role) users = users.filter(u => u.role === role);
  if (search) {
    const s = search.toLowerCase();
    users = users.filter(u =>
      u.name.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      (u.department || '').toLowerCase().includes(s)
    );
  }

  users = users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const safe = users.map(({ password: _, ...u }) => u);
  res.json({ success: true, data: safe, total: safe.length });
});

// PUT /api/users/:id/role (admin)
router.put('/:id/role', authenticateToken, requireAdmin, (req, res) => {
  const { role } = req.body;
  if (!['student', 'admin', 'organizer'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }
  const db = getDB();
  db.get('users').find({ id: parseInt(req.params.id) }).assign({ role }).write();
  res.json({ success: true, message: `Role updated to ${role}` });
});

// DELETE /api/users/:id (admin)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  if (parseInt(req.params.id) === req.user.id) {
    return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
  }
  const db = getDB();
  db.get('users').remove({ id: parseInt(req.params.id) }).write();
  res.json({ success: true, message: 'User deleted' });
});

module.exports = router;
