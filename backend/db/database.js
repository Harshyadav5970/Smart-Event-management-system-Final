const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const DB_PATH = path.join(__dirname, '../eventhub-db.json');

let db = null;

function getDB() {
  if (!db) {
    const adapter = new FileSync(DB_PATH);
    db = low(adapter);
  }
  return db;
}

function initDB() {
  const db = getDB();

  // Initialize schema defaults
  db.defaults({
    users: [],
    events: [],
    registrations: [],
    feedback: [],
    notifications: [],
    _counters: { users: 0, events: 0, registrations: 0, feedback: 0, notifications: 0 }
  }).write();

  // Seed admin
  const adminExists = db.get('users').find({ email: 'admin@eventhub.edu' }).value();
  if (!adminExists) {
    const adminId = nextId(db, 'users');
    db.get('users').push({
      id: adminId,
      name: 'Admin User',
      email: 'admin@eventhub.edu',
      password: bcrypt.hashSync('admin123', 10),
      role: 'admin',
      department: 'Administration',
      year: '',
      phone: '',
      avatar: null,
      interests: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).write();
    console.log('✅ Default admin user created');
  }

  // Seed sample data if no events
  const eventCount = db.get('events').value().length;
  if (eventCount === 0) {
    seedSampleData(db);
  }

  console.log('✅ Database initialized (lowdb JSON)');
}

function nextId(db, collection) {
  const current = db.get(`_counters.${collection}`).value() || 0;
  const next = current + 1;
  db.set(`_counters.${collection}`, next).write();
  return next;
}

function seedSampleData(db) {
  const adminId = db.get('users').find({ role: 'admin' }).value().id;

  // Seed students
  const students = [
    { name: 'Arjun Sharma', email: 'arjun@student.edu', dept: 'Computer Science', year: '3rd Year', role: 'student', pw: 'student123' },
    { name: 'Priya Patel', email: 'priya@student.edu', dept: 'Electronics', year: '2nd Year', role: 'student', pw: 'student123' },
    { name: 'Rohan Mehta', email: 'rohan@student.edu', dept: 'Mechanical', year: '4th Year', role: 'student', pw: 'student123' },
    { name: 'Sneha Kumar', email: 'sneha@student.edu', dept: 'Civil', year: '1st Year', role: 'student', pw: 'student123' },
    { name: 'Dev Organizer', email: 'dev@eventhub.edu', dept: 'Management', year: 'Staff', role: 'organizer', pw: 'org123' },
  ];

  students.forEach(s => {
    const uid = nextId(db, 'users');
    db.get('users').push({
      id: uid,
      name: s.name,
      email: s.email,
      password: bcrypt.hashSync(s.pw, 10),
      role: s.role,
      department: s.dept,
      year: s.year,
      phone: '',
      avatar: null,
      interests: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).write();
  });

  // Seed events
  const events = [
    {
      title: 'TechFest 2026 – Annual Tech Symposium',
      description: 'The biggest technical festival of the year! Join us for hackathons, coding contests, robotics competitions, paper presentations, and workshops by industry experts. Network with professionals and showcase your technical skills.',
      category: 'technical',
      date: '2026-10-15',
      time: '09:00',
      end_time: '18:00',
      venue: 'Main Auditorium & Tech Block',
      max_participants: 500,
      registration_deadline: '2026-10-10',
      tags: ['hackathon', 'coding', 'robotics', 'AI', 'ML'],
      prize: '₹50,000 Total Prize Pool',
      fee: 0,
      status: 'upcoming',
      is_featured: true
    },
    {
      title: 'Cultural Night – Rang De Basanti',
      description: 'Experience the vibrant cultural extravaganza! Witness breathtaking dance performances, soulful music, dramatic plays, and fashion shows. Celebrate the diversity of our college through art and culture.',
      category: 'cultural',
      date: '2026-10-20',
      time: '18:00',
      end_time: '22:00',
      venue: 'Open Air Theatre',
      max_participants: 1000,
      registration_deadline: '2026-10-18',
      tags: ['dance', 'music', 'drama', 'fashion'],
      prize: 'Trophies & Certificates',
      fee: 50,
      status: 'upcoming',
      is_featured: true
    },
    {
      title: 'Sports Day 2026',
      description: 'Annual sports meet featuring cricket, football, basketball, athletics, badminton, and more! Compete for the championship trophy and represent your department.',
      category: 'sports',
      date: '2026-11-05',
      time: '07:00',
      end_time: '17:00',
      venue: 'Sports Complex & Ground',
      max_participants: 300,
      registration_deadline: '2026-11-01',
      tags: ['cricket', 'football', 'athletics', 'basketball'],
      prize: 'Championship Trophy + ₹10,000',
      fee: 0,
      status: 'upcoming',
      is_featured: false
    },
    {
      title: 'AI/ML Workshop – Hands-on Deep Learning',
      description: 'Intensive 2-day workshop on Artificial Intelligence and Machine Learning. Learn about neural networks, computer vision, NLP, and build real projects. Includes certificate of completion.',
      category: 'workshop',
      date: '2026-10-25',
      time: '10:00',
      end_time: '16:00',
      venue: 'CS Lab 301',
      max_participants: 60,
      registration_deadline: '2026-10-22',
      tags: ['AI', 'ML', 'deep learning', 'python', 'tensorflow'],
      prize: 'Certificate + Internship Opportunity',
      fee: 200,
      status: 'upcoming',
      is_featured: true
    },
    {
      title: 'Guest Lecture – Future of Web3',
      description: 'Industry expert talk on Blockchain, Web3, DeFi, and NFTs. Learn about decentralized technologies and career opportunities in the Web3 space.',
      category: 'seminar',
      date: '2026-10-12',
      time: '14:00',
      end_time: '16:00',
      venue: 'Seminar Hall 2',
      max_participants: 150,
      registration_deadline: '2026-10-11',
      tags: ['blockchain', 'web3', 'crypto'],
      prize: 'Certificate',
      fee: 0,
      status: 'upcoming',
      is_featured: false
    },
    {
      title: 'Freshers Welcome Party 2026',
      description: 'Welcome our new batch with a grand celebration! Fun games, introductions, performances, and lots of food. Make new friends and start your college journey right!',
      category: 'cultural',
      date: '2026-09-01',
      time: '17:00',
      end_time: '21:00',
      venue: 'College Cafeteria & Garden',
      max_participants: 400,
      registration_deadline: '2026-08-30',
      tags: ['freshers', 'party', 'games', 'welcome'],
      prize: 'Best Fresher Award',
      fee: 100,
      status: 'completed',
      is_featured: false
    }
  ];

  events.forEach(e => {
    const eid = nextId(db, 'events');
    db.get('events').push({
      id: eid,
      ...e,
      organizer_id: adminId,
      image: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).write();
  });

  console.log('✅ Sample data seeded');
}

module.exports = { getDB, initDB, nextId };
