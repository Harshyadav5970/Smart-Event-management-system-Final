const express = require('express');
const { getDB } = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics/overview
router.get('/overview', authenticateToken, requireAdmin, (req, res) => {
  const db = getDB();

  const allEvents = db.get('events').value();
  const allUsers = db.get('users').filter({ role: 'student' }).value();
  const allRegs = db.get('registrations').filter(r => r.status !== 'cancelled').value();
  const allFeedback = db.get('feedback').value();

  const totalEvents = allEvents.length;
  const totalUsers = allUsers.length;
  const totalRegistrations = allRegs.length;
  const avgRating = allFeedback.length
    ? (allFeedback.reduce((s, f) => s + f.rating, 0) / allFeedback.length).toFixed(1)
    : null;

  // Events by category
  const categoryMap = {};
  allEvents.forEach(e => { categoryMap[e.category] = (categoryMap[e.category] || 0) + 1; });
  const eventsByCategory = Object.entries(categoryMap).map(([category, count]) => ({ category, count }));

  // Events by status
  const statusMap = {};
  allEvents.forEach(e => { statusMap[e.status] = (statusMap[e.status] || 0) + 1; });
  const eventsByStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

  // Top events
  const topEvents = allEvents.map(e => {
    const regs = allRegs.filter(r => r.event_id === e.id);
    const fb = allFeedback.filter(f => f.event_id === e.id);
    return {
      title: e.title, category: e.category, date: e.date,
      registrations: regs.length,
      avg_rating: fb.length ? (fb.reduce((s, f) => s + f.rating, 0) / fb.length) : null
    };
  }).sort((a, b) => b.registrations - a.registrations).slice(0, 5);

  // Recent registrations
  const allUsers2 = db.get('users').value();
  const recentRegistrations = db.get('registrations').value()
    .sort((a, b) => new Date(b.registered_at) - new Date(a.registered_at))
    .slice(0, 10)
    .map(r => {
      const user = allUsers2.find(u => u.id === r.user_id) || {};
      const event = allEvents.find(e => e.id === r.event_id) || {};
      return { registered_at: r.registered_at, name: user.name, title: event.title };
    });

  // Monthly registrations
  const monthMap = {};
  db.get('registrations').filter(r => r.status !== 'cancelled').value().forEach(r => {
    const month = r.registered_at.substring(0, 7);
    monthMap[month] = (monthMap[month] || 0) + 1;
  });
  const monthlyRegistrations = Object.entries(monthMap).sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12).map(([month, count]) => ({ month, count }));

  // Department participation
  const deptMap = {};
  allRegs.forEach(r => {
    const user = allUsers2.find(u => u.id === r.user_id);
    if (user && user.department) {
      deptMap[user.department] = (deptMap[user.department] || 0) + 1;
    }
  });
  const departmentParticipation = Object.entries(deptMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([department, registrations]) => ({ department, registrations }));

  res.json({
    success: true,
    data: {
      overview: { totalEvents, totalUsers, totalRegistrations, avgRating },
      eventsByCategory, eventsByStatus, topEvents, recentRegistrations,
      monthlyRegistrations, departmentParticipation
    }
  });
});

// GET /api/analytics/event/:id
router.get('/event/:id', authenticateToken, (req, res) => {
  const db = getDB();
  const eid = parseInt(req.params.id);
  const event = db.get('events').find({ id: eid }).value();
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  const regs = db.get('registrations').filter({ event_id: eid }).value();
  const regStats = {
    total: regs.length,
    registered: regs.filter(r => r.status === 'registered').length,
    attended: regs.filter(r => r.status === 'attended').length,
    cancelled: regs.filter(r => r.status === 'cancelled').length,
    waitlist: regs.filter(r => r.status === 'waitlist').length
  };

  const users = db.get('users').value();
  const deptMap = {};
  regs.filter(r => r.status !== 'cancelled').forEach(r => {
    const user = users.find(u => u.id === r.user_id);
    if (user && user.department) deptMap[user.department] = (deptMap[user.department] || 0) + 1;
  });
  const deptBreakdown = Object.entries(deptMap).map(([department, count]) => ({ department, count }));

  const fb = db.get('feedback').filter({ event_id: eid }).value();
  const names = ['', 'one_star', 'two_star', 'three_star', 'four_star', 'five_star'];
  const counts = { five_star: 0, four_star: 0, three_star: 0, two_star: 0, one_star: 0 };
  fb.forEach(f => { if (names[f.rating]) counts[names[f.rating]]++; });
  const feedbackStats = {
    avg_rating: fb.length ? fb.reduce((s, f) => s + f.rating, 0) / fb.length : null,
    total_feedback: fb.length,
    ...counts
  };

  res.json({ success: true, data: { event, regStats, deptBreakdown, feedbackStats } });
});

module.exports = router;
