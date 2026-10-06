// EventHub - College Event & Fest Management System
// Author: Harsh Yadav (Roll No: 129, TYCS-B)
// Guide: Faculty Coordinator
// authController.js: User registration, login verification, and profile retrieval

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

// Register new student or organizer
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, department, rollNo, studentClass } = req.body;

    // Validate mandatory fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    // Check if account already exists with this email
    const existing = User.findByEmail(email);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email is already registered.'
      });
    }

    // Hash password for security
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: role || 'student',
      department: department || 'Computer Science',
      rollNo: rollNo || '129',
      studentClass: studentClass || 'TYCS-B'
    });

    // Generate JWT token immediately on register
    const token = jwt.sign(
      {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        department: newUser.department,
        rollNo: newUser.rollNo
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...safeUser } = newUser;

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to EventHub.',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('[Auth Register Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating user account.'
    });
  }
};

// Login user and return token + role
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both college email and password.'
      });
    }

    const user = User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials: No account found with this email.'
      });
    }

    // Check password (handles both bcrypt hash and plain text fallback for pre-seeded viva tests)
    let isMatch = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = user.password === password;
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials: Password did not match.'
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        department: user.department,
        rollNo: user.rollNo
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('[Auth Login Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during login processing.'
    });
  }
};

// Fetch currently logged in user info
exports.getCurrentUser = (req, res) => {
  try {
    const user = User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const { password, ...safeUser } = user;
    return res.json({ success: true, user: safeUser });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
};

// List all registered accounts (Faculty / Admin panel)
exports.getAllUsers = (req, res) => {
  try {
    const users = User.listAll();
    return res.json({ success: true, count: users.length, users });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not retrieve users list.' });
  }
};
