// EventHub - College Event & Fest Management System
// Author: Harsh Yadav (Roll No: 129, TYCS-B)
// Guide: Faculty Coordinator
// User.js: Schema and operations for Students, Organizers, and Admins

const db = require('../db/memoryDb');

const userCollection = db.collection('users');

const User = {
  // Find user by email (case-insensitive for good UX)
  findByEmail: (email) => {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const allUsers = userCollection.find();
    return allUsers.find(u => u.email.toLowerCase() === cleanEmail) || null;
  },

  // Find user by unique ID
  findById: (id) => {
    return userCollection.findById(id);
  },

  // Create new user profile with student/organizer/admin role
  create: (userData) => {
    const defaultData = {
      name: userData.name || 'Anonymous Student',
      email: userData.email.trim().toLowerCase(),
      password: userData.password,
      role: userData.role || 'student', // student | organizer | admin
      department: userData.department || 'Computer Science',
      rollNo: userData.rollNo || 'N/A',
      studentClass: userData.studentClass || 'TYCS-B',
      avatar: userData.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userData.name || 'user')}`
    };
    return userCollection.insert(defaultData);
  },

  // Update profile details
  update: (id, updates) => {
    return userCollection.findByIdAndUpdate(id, updates);
  },

  // List all users for Admin evaluation panel
  listAll: () => {
    return userCollection.find().map(u => {
      // Exclude password hash from listings
      const { password, ...safeUser } = u;
      return safeUser;
    });
  },

  // Count total users
  count: (filter) => {
    return userCollection.count(filter);
  }
};

module.exports = User;
