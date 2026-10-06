// EventHub - College Event & Fest Management System
// Author: Harsh Yadav (Roll No: 129, TYCS-B)
// Guide: Faculty Coordinator
// analyticsController.js: Real-time fest performance metrics, revenue calculation, and attendance statistics

const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');

exports.getFestStats = (req, res) => {
  try {
    const allEvents = Event.findAll();
    const allRegistrations = Registration.findAll();
    const allUsers = User.listAll();

    // Calculate core metrics
    const totalEvents = allEvents.length;
    const totalRegistrations = allRegistrations.length;
    const totalStudents = allUsers.filter(u => u.role === 'student').length;

    // Calculate total revenue in INR (₹)
    const totalRevenue = allRegistrations.reduce((sum, r) => sum + (Number(r.feePaid) || 0), 0);

    // Calculate attendance check-in metrics
    const checkedInCount = allRegistrations.filter(r => r.checkInStatus === true).length;
    const checkInRate = totalRegistrations > 0 
      ? Math.round((checkedInCount / totalRegistrations) * 100) 
      : 0;

    // Category breakdown
    const categoryStats = {};
    ['Technical', 'Cultural', 'Sports', 'Workshop', 'Gaming'].forEach(cat => {
      categoryStats[cat] = {
        eventsCount: allEvents.filter(e => e.category.toLowerCase() === cat.toLowerCase()).length,
        registrationsCount: allRegistrations.filter(r => (r.eventCategory || '').toLowerCase() === cat.toLowerCase()).length
      };
    });

    // Department participation breakdown
    const departmentStats = {};
    allRegistrations.forEach(r => {
      const dept = r.department || 'Computer Science';
      departmentStats[dept] = (departmentStats[dept] || 0) + 1;
    });

    // Event-specific analytics table
    const eventBreakdown = allEvents.map(e => {
      const eventRegs = allRegistrations.filter(r => String(r.eventId) === String(e._id));
      const eventCheckedIn = eventRegs.filter(r => r.checkInStatus).length;
      const eventRevenue = eventRegs.reduce((sum, r) => sum + (Number(r.feePaid) || 0), 0);
      const capacityPercent = e.capacity > 0 ? Math.min(100, Math.round((eventRegs.length / e.capacity) * 100)) : 0;

      return {
        id: e._id,
        title: e.title,
        category: e.category,
        date: e.date,
        venue: e.venue,
        status: e.status,
        capacity: e.capacity,
        registrations: eventRegs.length,
        checkedIn: eventCheckedIn,
        revenue: eventRevenue,
        capacityPercent
      };
    });

    // Recent 5 activity logs
    const recentActivity = [...allRegistrations]
      .sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt))
      .slice(0, 6)
      .map(r => ({
        id: r._id,
        studentName: r.studentName,
        eventTitle: r.eventTitle,
        department: r.department,
        time: r.registeredAt,
        checkInStatus: r.checkInStatus,
        feePaid: r.feePaid
      }));

    return res.json({
      success: true,
      summary: {
        totalEvents,
        totalRegistrations,
        totalStudents,
        totalRevenue,
        checkedInCount,
        checkInRate
      },
      categoryStats,
      departmentStats,
      eventBreakdown,
      recentActivity
    });
  } catch (err) {
    console.error('[Analytics Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate fest analytics.' });
  }
};
