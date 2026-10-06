// EventHub - College Event & Fest Management System
// Author: Harsh Yadav (Roll No: 129, TYCS-B)
// Guide: Faculty Coordinator
// ticketController.js: E-ticket generation with tamper-proof QR code & live gate scanner check-in

const crypto = require('crypto');
const QRCode = require('qrcode');
const bcrypt = require('bcryptjs');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');

// Generate tamper-proof hash for QR code
const generateHash = (ticketId, studentId, eventId) => {
  const secretSalt = 'EVENTHUB_TYCS_SECRET_HASH_SALT_2026';
  return crypto
    .createHmac('sha256', secretSalt)
    .update(`${ticketId}|${studentId}|${eventId}`)
    .digest('hex');
};

// 1. Email & Password based registration for student (allows registering again and again)
exports.registerForEvent = async (req, res) => {
  try {
    const { 
      eventId, 
      email, 
      password, 
      studentName: customName, 
      rollNo: customRoll, 
      studentClass: customClass, 
      department: customDept 
    } = req.body;

    if (!eventId) {
      return res.status(400).json({ success: false, message: 'Event ID is required.' });
    }

    const event = Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Target event was not found.' });
    }

    // Check if event is already full
    if (event.capacity && (event.registeredCount || 0) >= event.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Registration closed: Event capacity has been reached!'
      });
    }

    let studentId = req.user && req.user.id;
    let studentEmail = (email && email.trim().toLowerCase()) || (req.user && req.user.email);
    let studentName = customName || (req.user && req.user.name) || 'Harsh Yadav';
    let rollNo = customRoll || (req.user && req.user.rollNo) || '129';
    let studentClass = customClass || (req.user && req.user.studentClass) || 'TYCS-B';
    let department = customDept || (req.user && req.user.department) || 'Computer Science';

    // Verify Email & Password Credentials for pass generation
    if (email && password) {
      let existingUser = User.findByEmail(email);
      if (existingUser) {
        let isMatch = false;
        if (existingUser.password && (existingUser.password.startsWith('$2a$') || existingUser.password.startsWith('$2b$'))) {
          isMatch = await bcrypt.compare(password, existingUser.password);
        } else {
          isMatch = existingUser.password === password;
        }

        if (!isMatch) {
          return res.status(401).json({
            success: false,
            message: 'Invalid password. Credential verification failed for pass generation.'
          });
        }

        studentId = existingUser._id;
        studentEmail = existingUser.email;
        studentName = customName || existingUser.name || studentName;
        rollNo = customRoll || existingUser.rollNo || rollNo;
        studentClass = customClass || existingUser.studentClass || studentClass;
        department = customDept || existingUser.department || department;
      } else {
        // Auto-create student account with provided email and password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = User.create({
          name: studentName,
          email: studentEmail,
          password: hashedPassword,
          role: 'student',
          department,
          rollNo,
          studentClass
        });
        studentId = newUser._id;
      }
    } else if (password && req.user) {
      // Validate password for logged in user session
      const existingUser = User.findById(req.user.id);
      if (existingUser) {
        let isMatch = false;
        if (existingUser.password && (existingUser.password.startsWith('$2a$') || existingUser.password.startsWith('$2b$'))) {
          isMatch = await bcrypt.compare(password, existingUser.password);
        } else {
          isMatch = existingUser.password === password;
        }
        if (!isMatch) {
          return res.status(401).json({
            success: false,
            message: 'Invalid account password. Could not authenticate pass generation.'
          });
        }
      }
    } else if (!req.user && (!email || !password)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both college email and password to generate this event pass.'
      });
    }

    if (!studentId) {
      studentId = 'stu_' + Math.random().toString(36).substr(2, 9);
    }

    // Allow registering again and again! Calculate pass number for this event
    const userPasses = Registration.findByStudentId(studentId, studentEmail)
      .filter(r => String(r.eventId) === String(eventId));
    const passNumber = userPasses.length + 1;

    // Generate unique college ticket ID: EH-2026-XXXXXX[-PX]
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const ticketId = `EH-2026-${randomCode}${passNumber > 1 ? `-P${passNumber}` : ''}`;

    // Create cryptographic verification hash
    const verificationHash = generateHash(ticketId, studentId, eventId);

    // QR Code data payload
    const qrPayload = JSON.stringify({
      ticketId,
      verificationHash,
      studentId,
      eventId,
      studentName,
      studentEmail,
      eventTitle: event.title,
      passNumber
    });

    // Generate high-resolution QR code Data URL (Base64)
    let qrCodeDataUrl = '';
    try {
      qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 300,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
    } catch (qrErr) {
      console.warn('[QR Generator Warning]: Falling back to payload string.', qrErr.message);
      qrCodeDataUrl = '';
    }

    // Save registration
    const registration = Registration.create({
      ticketId,
      verificationHash,
      studentId,
      studentName,
      studentEmail,
      rollNo,
      studentClass,
      department,
      eventId: event._id,
      eventTitle: event.title,
      eventCategory: event.category,
      eventDate: event.date,
      eventVenue: event.venue,
      feePaid: event.registrationFee || 0,
      paymentStatus: (event.registrationFee || 0) > 0 ? 'Completed' : 'Free',
      passNumber,
      qrCodeDataUrl
    });

    // Increment registered count for the event
    Event.incrementRegisteredCount(eventId, 1);

    return res.status(201).json({
      success: true,
      message: passNumber > 1 
        ? `Pass #${passNumber} generated successfully for ${event.title}!` 
        : `Registration confirmed! QR E-Pass generated.`,
      ticket: registration,
      registration,
      passNumber
    });
  } catch (err) {
    console.error('[Registration Error]:', err);
    return res.status(500).json({ success: false, message: 'Server error while processing registration.' });
  }
};

// 2. Fetch all registrations for current student (supports repeat passes)
exports.getMyRegistrations = (req, res) => {
  try {
    const studentId = req.user.id;
    const studentEmail = req.user.email;
    const tickets = Registration.findByStudentId(studentId, studentEmail);
    return res.json({ success: true, count: tickets.length, tickets });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not fetch your tickets.' });
  }
};

// 3. Live Gate Scanner: Verify QR code scan & record check-in
exports.verifyAndCheckIn = async (req, res) => {
  try {
    const { scannedData, eventId } = req.body;

    if (!scannedData) {
      return res.status(400).json({
        success: false,
        message: 'No barcode/QR data received from scanner.'
      });
    }

    let parsedTicketId = null;
    let parsedHash = null;

    // Try parsing if QR payload is JSON
    if (typeof scannedData === 'string' && (scannedData.startsWith('{') || scannedData.startsWith('"{'))) {
      try {
        const parsed = JSON.parse(scannedData);
        parsedTicketId = parsed.ticketId;
        parsedHash = parsed.verificationHash;
      } catch (e) {
        parsedTicketId = scannedData.trim();
      }
    } else {
      parsedTicketId = String(scannedData).trim();
    }

    // Lookup registration by ticketId or verificationHash
    let reg = null;
    if (parsedTicketId) {
      reg = Registration.findByTicketId(parsedTicketId);
    }
    if (!reg && parsedHash) {
      reg = Registration.findByVerificationHash(parsedHash);
    }
    if (!reg) {
      // Also try raw query on full scanned string
      reg = Registration.findOne({ ticketId: scannedData.trim() });
    }

    // Gate verification check: Invalid ticket
    if (!reg) {
      return res.status(404).json({
        success: false,
        status: 'INVALID',
        message: 'Invalid Ticket! No matching registration found in college database.'
      });
    }

    // If gate scanner is filtering for a specific event, verify it matches
    if (eventId && String(reg.eventId) !== String(eventId)) {
      return res.status(400).json({
        success: false,
        status: 'WRONG_EVENT',
        message: `Wrong Event Gate! This ticket is for "${reg.eventTitle}", not this venue.`
      });
    }

    // Gate verification check: Duplicate scan
    if (reg.checkInStatus) {
      const formattedTime = new Date(reg.checkInTime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      return res.status(409).json({
        success: false,
        status: 'DUPLICATE',
        message: `Duplicate Entry Warning! Ticket already scanned at ${formattedTime}.`,
        ticket: reg
      });
    }

    // First scan -> Mark check-in verified!
    const checkInTime = new Date().toISOString();
    const updatedReg = Registration.markCheckedIn(reg._id, checkInTime);

    return res.status(200).json({
      success: true,
      status: 'VERIFIED',
      message: `Entry Verified: Welcome ${reg.studentName} (${reg.studentClass} - Roll No: ${reg.rollNo})!`,
      ticket: updatedReg
    });
  } catch (err) {
    console.error('[CheckIn Error]:', err);
    return res.status(500).json({ success: false, message: 'Gate check-in system error.' });
  }
};

// 4. Get all attendees for an event (Organizer/Admin gate roster)
exports.getEventAttendees = (req, res) => {
  try {
    const { eventId } = req.params;
    const attendees = Registration.findByEventId(eventId);
    const checkedInCount = attendees.filter(a => a.checkInStatus).length;

    return res.json({
      success: true,
      totalRegistrations: attendees.length,
      checkedInCount,
      attendees
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not fetch attendee roster.' });
  }
};

// 5. Verify certificate eligibility for completed event
exports.getCertificateData = (req, res) => {
  try {
    const { ticketId } = req.params;
    const reg = Registration.findByTicketId(ticketId);

    if (!reg) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const event = Event.findById(reg.eventId);

    // Student must be checked in
    if (!reg.checkInStatus) {
      return res.status(403).json({
        success: false,
        message: 'Certificate not available: You must be marked attended at the event gate.'
      });
    }

    // Event must be marked completed
    if (event && event.status !== 'Completed') {
      return res.status(403).json({
        success: false,
        message: `Event is currently "${event.status}". Certificates will be issued once the event is marked "Completed" by the coordinator.`
      });
    }

    return res.json({
      success: true,
      certificate: {
        certificateId: `CERT-${reg.ticketId}`,
        studentName: reg.studentName,
        rollNo: reg.rollNo,
        studentClass: reg.studentClass,
        department: reg.department,
        eventTitle: reg.eventTitle,
        eventCategory: reg.eventCategory,
        eventDate: reg.eventDate,
        venue: reg.eventVenue,
        issueDate: new Date().toISOString().split('T')[0],
        projectAuthor: 'Harsh Yadav (TYCS-B, Roll No: 129)',
        projectGuide: 'Faculty Coordinator'
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error checking certificate status.' });
  }
};

// 6. Public QR Verification View (For phone cameras and browser audits)
exports.verifyPublicTicket = (req, res) => {
  try {
    const { ticketId } = req.params;
    const reg = Registration.findByTicketId(ticketId);

    if (!reg) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><title>EventHub Verification</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="font-family:sans-serif; background:#0a0f1d; color:#f8fafc; text-align:center; padding:60px 20px;">
          <h1 style="color:#ef4444;">❌ Invalid Ticket</h1>
          <p style="color:#94a3b8;">Ticket ID <code>${ticketId}</code> was not found in the EventHub database.</p>
        </body>
        </html>
      `);
    }

    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>EventHub • Ticket Verification</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0a0f1d; color: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; }
          .card { background: #111827; border: 1px solid #334155; border-radius: 16px; padding: 32px 28px; max-width: 440px; width: 100%; box-shadow: 0 12px 36px rgba(0,0,0,0.6); text-align: center; }
          .badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 0.85rem; margin-bottom: 18px; }
          .badge-verified { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid #10b981; }
          .badge-pending { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid #3b82f6; }
          h2 { color: #f8fafc; margin: 0 0 12px 0; font-size: 1.4rem; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 0.9rem; color: #cbd5e1; }
          .row strong { color: #f8fafc; }
          .hash { font-family: monospace; font-size: 0.72rem; color: #818cf8; word-break: break-all; margin-top: 18px; background: #0f172a; padding: 10px; border-radius: 8px; border: 1px solid #1e293b; }
          .footer { margin-top: 24px; font-size: 0.75rem; color: #64748b; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge ${reg.checkInStatus ? 'badge-verified' : 'badge-pending'}">
            ${reg.checkInStatus ? '✅ GATE ENTRY VERIFIED' : '⏳ ACTIVE ENTRY PASS (READY)'}
          </div>
          <h2>${reg.eventTitle}</h2>
          
          <div style="margin: 16px 0;">
            <div class="row"><span>Attendee:</span><strong>${reg.studentName}</strong></div>
            <div class="row"><span>Class & Roll:</span><strong>${reg.studentClass} • #${reg.rollNo}</strong></div>
            <div class="row"><span>Department:</span><strong>${reg.department}</strong></div>
            <div class="row"><span>Ticket ID:</span><strong style="color:#a5b4fc; font-family:monospace;">${reg.ticketId}</strong></div>
            <div class="row"><span>Date:</span><strong>${reg.eventDate}</strong></div>
            <div class="row"><span>Venue:</span><strong>${reg.eventVenue}</strong></div>
            <div class="row"><span>Gate Status:</span><strong style="color:${reg.checkInStatus ? '#34d399' : '#60a5fa'}">${reg.checkInStatus ? 'Checked-In' : 'Pending Scan'}</strong></div>
            ${reg.checkInTime ? `<div class="row"><span>Check-in Time:</span><strong>${new Date(reg.checkInTime).toLocaleTimeString()}</strong></div>` : ''}
          </div>

          <div class="hash">
            HMAC-SHA256 Signature:<br/>
            ${reg.verificationHash}
          </div>

          <div class="footer">
            <strong>EventHub: Smart College Event & Fest Management System</strong><br/>
            Author: Harsh Yadav (TYCS-B, Roll No: 129) • Guide: Faculty Coordinator
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    return res.status(500).send('Server verification error');
  }
};


// 6. Public Certificate Verification (No login required - open credential auditing)
exports.verifyPublicCertificate = (req, res) => {
  try {
    let { certId } = req.params;
    if (!certId) {
      return res.status(400).json({ success: false, message: 'Certificate or Ticket ID is required.' });
    }

    certId = certId.trim().toUpperCase();
    const ticketId = certId.startsWith('CERT-') ? certId.replace('CERT-', '') : certId;

    const reg = Registration.findByTicketId(ticketId);
    if (!reg) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'No record found with this Certificate / Ticket ID in the official college database.'
      });
    }

    const event = Event.findById(reg.eventId);

    if (!reg.checkInStatus) {
      return res.status(200).json({
        success: true,
        valid: false,
        status: 'PENDING_ATTENDANCE',
        message: 'Certificate not issued: Attendee did not check-in at the event entrance.'
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      status: 'VERIFIED_GENUINE',
      message: 'Authentic Credential Verified: Issued by EventHub College Management System.',
      certificate: {
        certificateId: `CERT-${reg.ticketId}`,
        ticketId: reg.ticketId,
        studentName: reg.studentName,
        rollNo: reg.rollNo,
        studentClass: reg.studentClass,
        department: reg.department,
        eventTitle: reg.eventTitle,
        eventCategory: reg.eventCategory,
        eventDate: reg.eventDate,
        venue: reg.eventVenue,
        checkInTime: reg.checkInTime,
        verificationHash: reg.verificationHash,
        issuedBy: 'Department of Computer Science & Engineering',
        projectAuthor: 'Harsh Yadav (TYCS-B, Roll No: 129)',
        projectGuide: 'Faculty Coordinator'
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Verification server error.' });
  }
};

// 7. Export Attendees CSV for College Faculty/Examiner Viva Audit
exports.exportAttendeesCSV = (req, res) => {
  try {
    const { eventId } = req.params;
    let attendees = [];
    let filename = 'EventHub_All_Attendees.csv';

    if (eventId && eventId !== 'all') {
      attendees = Registration.findByEventId(eventId);
      const ev = Event.findById(eventId);
      if (ev) filename = `EventHub_${ev.title.replace(/[^a-zA-Z0-9]/g, '_')}_Roster.csv`;
    } else {
      attendees = Registration.findAll();
    }

    const headers = [
      'Ticket ID',
      'Student Name',
      'Roll No',
      'Class',
      'Department',
      'Event Title',
      'Event Date',
      'Fee Paid (INR)',
      'Gate Check-In Status',
      'Check-In Timestamp'
    ];

    const rows = attendees.map(a => [
      `"${a.ticketId || ''}"`,
      `"${a.studentName || ''}"`,
      `"${a.rollNo || ''}"`,
      `"${a.studentClass || ''}"`,
      `"${a.department || ''}"`,
      `"${a.eventTitle || ''}"`,
      `"${a.eventDate || ''}"`,
      `"${a.feePaid || 0}"`,
      `"${a.checkInStatus ? 'Verified (Present)' : 'Not Checked In'}"`,
      `"${a.checkInTime ? new Date(a.checkInTime).toLocaleString() : '-'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not export CSV.' });
  }
};

// 8. Admin: Get all student registrations across the entire college fest with search & filters
exports.getAllRegistrationsAdmin = (req, res) => {
  try {
    const { search, status, eventId } = req.query;
    let list = Registration.findAll();

    if (eventId && eventId !== 'all') {
      list = list.filter(r => String(r.eventId) === String(eventId));
    }

    if (status === 'checked_in') {
      list = list.filter(r => r.checkInStatus === true);
    } else if (status === 'pending') {
      list = list.filter(r => !r.checkInStatus);
    }

    if (search) {
      const q = search.trim().toLowerCase();
      list = list.filter(r => 
        (r.studentName && r.studentName.toLowerCase().includes(q)) ||
        (r.rollNo && r.rollNo.toLowerCase().includes(q)) ||
        (r.ticketId && r.ticketId.toLowerCase().includes(q)) ||
        (r.eventTitle && r.eventTitle.toLowerCase().includes(q)) ||
        (r.department && r.department.toLowerCase().includes(q))
      );
    }

    // Sort newest registrations first
    list.sort((a, b) => new Date(b.registeredAt || 0) - new Date(a.registeredAt || 0));

    return res.json({
      success: true,
      count: list.length,
      registrations: list
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving registrations ledger.' });
  }
};

// 9. Admin: Toggle gate check-in status manually (e.g. manual pass verification override)
exports.adminToggleCheckIn = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // boolean

    const reg = Registration.findById(id);
    if (!reg) {
      return res.status(404).json({ success: false, message: 'Registration not found.' });
    }

    const updated = Registration.toggleCheckIn(id, !!status);
    return res.json({
      success: true,
      message: `Registration ${updated.ticketId} marked as ${updated.checkInStatus ? 'Checked-In' : 'Pending Check-In'}.`,
      registration: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update check-in status.' });
  }
};

// 10. Admin: Delete or revoke a student registration
exports.adminDeleteRegistration = (req, res) => {
  try {
    const { id } = req.params;
    const reg = Registration.findById(id);
    if (!reg) {
      return res.status(404).json({ success: false, message: 'Registration not found.' });
    }

    // Decrement event registered count
    if (reg.eventId) {
      Event.incrementRegisteredCount(reg.eventId, -1);
    }

    Registration.delete(id);

    return res.json({
      success: true,
      message: `Registration ${reg.ticketId} for ${reg.studentName} has been revoked.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete registration.' });
  }
};


