const jwt = require('jsonwebtoken');
const { getDB } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'eventhub_super_secret_key_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDB();

    // Use lowdb (not better-sqlite3) — find user by id
    const user = db.get('users').find({ id: decoded.userId }).value();

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Attach user to request (without password)
    const { password: _, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
}

function requireOrganizerOrAdmin(req, res, next) {
  if (!['admin', 'organizer'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Organizer or Admin access required' });
  }
  next();
}

module.exports = { authenticateToken, requireAdmin, requireOrganizerOrAdmin, JWT_SECRET };
