// EventHub - College Event & Fest Management System
// Author: Harsh Yadav (Roll No: 129, TYCS-B)
// Guide: Faculty Coordinator
// seed.js: Pre-seeds realistic demo accounts, college events, registrations, and announcements

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const QRCode = require('qrcode');
const db = require('./db/memoryDb');

const userCollection = db.collection('users');
const eventCollection = db.collection('events');
const regCollection = db.collection('registrations');
const annCollection = db.collection('announcements');

const generateHash = (ticketId, studentId, eventId) => {
  return crypto
    .createHmac('sha256', 'EVENTHUB_TYCS_SECRET_HASH_SALT_2026')
    .update(`${ticketId}|${studentId}|${eventId}`)
    .digest('hex');
};

async function seed() {
  console.log('[EventHub Seed] Clearing existing records for fresh demo setup...');
  userCollection.clear();
  eventCollection.clear();
  regCollection.clear();
  annCollection.clear();

  console.log('[EventHub Seed] Creating pre-configured college accounts...');
  const salt = await bcrypt.genSalt(10);
  const studentPwd = await bcrypt.hash('student123', salt);
  const clubPwd = await bcrypt.hash('club123', salt);
  const adminPwd = await bcrypt.hash('admin123', salt);

  // 1. Student: Harsh Yadav (Author)
  const studentHarsh = userCollection.insert({
    name: 'Harsh Yadav',
    email: 'harsh@college.edu',
    password: studentPwd,
    role: 'student',
    department: 'Computer Science',
    rollNo: '129',
    studentClass: 'TYCS-B',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop'
  });

  // Extra students for realistic analytics
  const studentPriya = userCollection.insert({
    name: 'Priya Sharma',
    email: 'priya@college.edu',
    password: studentPwd,
    role: 'student',
    department: 'Information Technology',
    rollNo: '142',
    studentClass: 'TYIT-A',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop'
  });

  const studentRohit = userCollection.insert({
    name: 'Rohit Verma',
    email: 'rohit@college.edu',
    password: studentPwd,
    role: 'student',
    department: 'Electronics & Telecomm',
    rollNo: '115',
    studentClass: 'TYEXTC',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop'
  });

  // 2. Organizer: Tech Club Lead
  const organizerClub = userCollection.insert({
    name: 'CS Tech Club Lead',
    email: 'techclub@college.edu',
    password: clubPwd,
    role: 'organizer',
    department: 'Computer Science',
    rollNo: 'ORG-01',
    studentClass: 'TYCS-B Committee',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop'
  });

  // 3. Admin: Project Guide / HOD
  const adminFaculty = userCollection.insert({
    name: 'Faculty Coordinator',
    email: 'admin@college.edu',
    password: adminPwd,
    role: 'admin',
    department: 'Computer Science & Engineering',
    rollNo: 'HOD-CS',
    studentClass: 'Faculty & Project Guide',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop'
  });

  console.log('[EventHub Seed] Seeding realistic college events...');

  // Event 1: Hackathon 2026 (Upcoming / Ready for Live gate scan)
  const evHackathon = eventCollection.insert({
    title: 'Hackathon 2026: CodeStorm',
    description: 'Annual 24-hour inter-college hackathon focusing on AI agents, Full Stack Web apps, and IoT innovations. Cash prizes worth ₹50,000 + Internship opportunities!',
    category: 'Technical',
    date: '2026-10-15',
    time: '09:00 AM',
    venue: 'CS Seminar Hall & Software Labs',
    registrationFee: 150,
    capacity: 120,
    bannerUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1000&auto=format&fit=crop',
    status: 'Upcoming',
    organizerId: organizerClub._id,
    organizerName: 'CS Tech Club',
    organizerClub: 'Computer Science Association',
    registeredCount: 2,
    tags: ['Hackathon', 'Coding', 'Cash-Prizes']
  });

  // Event 2: RoboWars TechFest
  const evRobo = eventCollection.insert({
    title: 'RoboWars TechFest',
    description: 'High-octane robotic combat battle! Custom combat bots duel in an armored bulletproof arena. Heavyweight and lightweight categories.',
    category: 'Technical',
    date: '2026-10-18',
    time: '11:00 AM',
    venue: 'Mechanical Workshop Quadrangle',
    registrationFee: 200,
    capacity: 80,
    bannerUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1000&auto=format&fit=crop',
    status: 'Upcoming',
    organizerId: organizerClub._id,
    organizerName: 'Robotics Guild',
    organizerClub: 'Tech Committee',
    registeredCount: 1,
    tags: ['Robotics', 'Combat', 'TechFest']
  });

  // Event 3: WebCraft Workshop (Free Event)
  const evWorkshop = eventCollection.insert({
    title: 'WebCraft: Modern Full Stack Workshop',
    description: 'Hands-on practical bootcamp on modern web application architecture, RESTful API design, and cloud deployment using Node.js & React.',
    category: 'Workshop',
    date: '2026-10-22',
    time: '02:00 PM',
    venue: 'Lab 402, IT Building',
    registrationFee: 0,
    capacity: 90,
    bannerUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1000&auto=format&fit=crop',
    status: 'Upcoming',
    organizerId: organizerClub._id,
    organizerName: 'Web Development Cell',
    organizerClub: 'TYCS Developer Wing',
    registeredCount: 1,
    tags: ['Free', 'Hands-on', 'Certification']
  });

  // Event 4: Cultural Night
  const evCultural = eventCollection.insert({
    title: 'Cultural Night: Tarang 2026',
    description: 'An evening of classical and contemporary musical performances, energetic street dance battles, and theatrical drama by college clubs.',
    category: 'Cultural',
    date: '2026-10-25',
    time: '06:00 PM',
    venue: 'Main College Amphitheater',
    registrationFee: 100,
    capacity: 350,
    bannerUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1000&auto=format&fit=crop',
    status: 'Upcoming',
    organizerId: organizerClub._id,
    organizerName: 'Cultural Committee',
    organizerClub: 'Student Council',
    registeredCount: 1,
    tags: ['Music', 'Dance', 'Fest']
  });

  // Event 5: Completed Event (For immediate viva demonstration of Certificate Generation!)
  const evSummit = eventCollection.insert({
    title: 'AI & Cloud Computing Summit 2026',
    description: 'Special symposium featuring keynote tech talks by industry leaders on Next-Gen Machine Learning and distributed cloud systems.',
    category: 'Technical',
    date: '2026-09-28',
    time: '10:00 AM',
    venue: 'Auditorium Hall 1',
    registrationFee: 0,
    capacity: 200,
    bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1000&auto=format&fit=crop',
    status: 'Completed',
    organizerId: organizerClub._id,
    organizerName: 'Department of CS',
    organizerClub: 'TYCS Academic Cell',
    registeredCount: 2,
    tags: ['AI', 'Cloud', 'Completed']
  });

  console.log('[EventHub Seed] Generating verified e-tickets and QR codes...');

  // Ticket 1: Harsh Yadav in Hackathon (Unchecked - for live gate QR scanner demo)
  const ticketId1 = 'EH-2026-881921';
  const hash1 = generateHash(ticketId1, studentHarsh._id, evHackathon._id);
  const qr1Payload = JSON.stringify({
    ticketId: ticketId1,
    verificationHash: hash1,
    studentId: studentHarsh._id,
    eventId: evHackathon._id,
    studentName: studentHarsh.name,
    eventTitle: evHackathon.title
  });
  const qr1DataUrl = await QRCode.toDataURL(qr1Payload, { width: 300, margin: 2 });

  regCollection.insert({
    ticketId: ticketId1,
    verificationHash: hash1,
    studentId: studentHarsh._id,
    studentName: studentHarsh.name,
    studentEmail: studentHarsh.email,
    rollNo: studentHarsh.rollNo,
    studentClass: studentHarsh.studentClass,
    department: studentHarsh.department,
    eventId: evHackathon._id,
    eventTitle: evHackathon.title,
    eventCategory: evHackathon.category,
    eventDate: evHackathon.date,
    eventVenue: evHackathon.venue,
    feePaid: evHackathon.registrationFee,
    paymentStatus: 'Completed',
    checkInStatus: false,
    checkInTime: null,
    qrCodeDataUrl: qr1DataUrl,
    registeredAt: new Date(Date.now() - 86400000 * 2).toISOString()
  });

  // Ticket 2: Harsh Yadav in AI Summit (Already Checked-In & Completed - for instant Certificate demo!)
  const ticketId2 = 'EH-2026-552109';
  const hash2 = generateHash(ticketId2, studentHarsh._id, evSummit._id);
  const qr2Payload = JSON.stringify({
    ticketId: ticketId2,
    verificationHash: hash2,
    studentId: studentHarsh._id,
    eventId: evSummit._id,
    studentName: studentHarsh.name,
    eventTitle: evSummit.title
  });
  const qr2DataUrl = await QRCode.toDataURL(qr2Payload, { width: 300, margin: 2 });

  regCollection.insert({
    ticketId: ticketId2,
    verificationHash: hash2,
    studentId: studentHarsh._id,
    studentName: studentHarsh.name,
    studentEmail: studentHarsh.email,
    rollNo: studentHarsh.rollNo,
    studentClass: studentHarsh.studentClass,
    department: studentHarsh.department,
    eventId: evSummit._id,
    eventTitle: evSummit.title,
    eventCategory: evSummit.category,
    eventDate: evSummit.date,
    eventVenue: evSummit.venue,
    feePaid: evSummit.registrationFee,
    paymentStatus: 'Free',
    checkInStatus: true,
    checkInTime: new Date(Date.now() - 86400000 * 6).toISOString(),
    qrCodeDataUrl: qr2DataUrl,
    registeredAt: new Date(Date.now() - 86400000 * 8).toISOString()
  });

  // Ticket 3: Priya Sharma in Hackathon (Checked-in at gate)
  const ticketId3 = 'EH-2026-339102';
  const hash3 = generateHash(ticketId3, studentPriya._id, evHackathon._id);
  regCollection.insert({
    ticketId: ticketId3,
    verificationHash: hash3,
    studentId: studentPriya._id,
    studentName: studentPriya.name,
    studentEmail: studentPriya.email,
    rollNo: studentPriya.rollNo,
    studentClass: studentPriya.studentClass,
    department: studentPriya.department,
    eventId: evHackathon._id,
    eventTitle: evHackathon.title,
    eventCategory: evHackathon.category,
    eventDate: evHackathon.date,
    eventVenue: evHackathon.venue,
    feePaid: evHackathon.registrationFee,
    paymentStatus: 'Completed',
    checkInStatus: true,
    checkInTime: new Date(Date.now() - 3600000 * 3).toISOString(),
    qrCodeDataUrl: await QRCode.toDataURL(ticketId3, { width: 300, margin: 2 }),
    registeredAt: new Date(Date.now() - 86400000 * 3).toISOString()
  });

  // Ticket 4: Rohit Verma in RoboWars
  const ticketId4 = 'EH-2026-772418';
  regCollection.insert({
    ticketId: ticketId4,
    verificationHash: generateHash(ticketId4, studentRohit._id, evRobo._id),
    studentId: studentRohit._id,
    studentName: studentRohit.name,
    studentEmail: studentRohit.email,
    rollNo: studentRohit.rollNo,
    studentClass: studentRohit.studentClass,
    department: studentRohit.department,
    eventId: evRobo._id,
    eventTitle: evRobo.title,
    eventCategory: evRobo.category,
    eventDate: evRobo.date,
    eventVenue: evRobo.venue,
    feePaid: evRobo.registrationFee,
    paymentStatus: 'Completed',
    checkInStatus: false,
    checkInTime: null,
    qrCodeDataUrl: await QRCode.toDataURL(ticketId4, { width: 300, margin: 2 }),
    registeredAt: new Date(Date.now() - 86400000 * 1).toISOString()
  });

  console.log('[EventHub Seed] Creating college notices and announcements...');
  annCollection.insert({
    title: 'Fest Registration Portal Live',
    message: 'Welcome to EventHub! Official registrations for College Fest 2026 are now open across all Technical, Cultural, and Workshop events.',
    type: 'info',
    eventId: null,
    eventTitle: 'College Fest 2026',
    authorName: 'Faculty Coordinator (Project Guide)',
    authorRole: 'admin',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
  });

  annCollection.insert({
    title: 'Hackathon 2026 Lab Allocation',
    message: 'All participants for CodeStorm Hackathon please report to CS Labs 301-304 by 08:30 AM with your digital QR passes ready.',
    type: 'warning',
    eventId: evHackathon._id,
    eventTitle: evHackathon.title,
    authorName: 'CS Tech Club Lead',
    authorRole: 'organizer',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  });

  annCollection.insert({
    title: 'Certificates Released for AI & Cloud Summit',
    message: 'Certificates of Participation are now ready for download. Check your "My Passes" section if you attended the summit.',
    type: 'success',
    eventId: evSummit._id,
    eventTitle: evSummit.title,
    authorName: 'Faculty Coordinator',
    authorRole: 'admin',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  });

  console.log('---------------------------------------------------------');
  console.log('✅ EventHub Seed Completed Successfully!');
  console.log('Demonstration Credentials:');
  console.log('  👨‍🎓 Student:   harsh@college.edu    / student123 (Roll: 129, TYCS-B)');
  console.log('  🎪 Organizer: techclub@college.edu / club123');
  console.log('  👩‍🏫 Admin:     admin@college.edu    / admin123 (Faculty Coordinator)');
  console.log('---------------------------------------------------------');
}

// Auto-run if executed directly via node seed.js
if (require.main === module) {
  seed();
}

module.exports = seed;
