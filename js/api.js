/* ============================================
   API Layer - Dual Mode (Backend API + GitHub Pages Standalone Fallback)
   ============================================ */

const isLocalServer = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port === '5000';
const API_BASE = isLocalServer ? 'http://localhost:5000/api' : '/api';

// ==================== STANDALONE CLIENT DB (FOR GITHUB PAGES DEMO) ====================
const DEFAULT_EVENTS = [
  {
    id: 1,
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
    is_featured: true,
    organizer_id: 1,
    organizer_name: 'Admin User',
    registered_count: 38,
    avg_rating: 4.8,
    feedback_count: 12
  },
  {
    id: 2,
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
    is_featured: true,
    organizer_id: 1,
    organizer_name: 'Admin User',
    registered_count: 94,
    avg_rating: 4.9,
    feedback_count: 24
  },
  {
    id: 3,
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
    is_featured: false,
    organizer_id: 1,
    organizer_name: 'Admin User',
    registered_count: 45,
    avg_rating: 4.6,
    feedback_count: 8
  },
  {
    id: 4,
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
    is_featured: true,
    organizer_id: 1,
    organizer_name: 'Admin User',
    registered_count: 52,
    avg_rating: 5.0,
    feedback_count: 15
  },
  {
    id: 5,
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
    is_featured: false,
    organizer_id: 1,
    organizer_name: 'Admin User',
    registered_count: 30,
    avg_rating: 4.7,
    feedback_count: 6
  },
  {
    id: 6,
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
    is_featured: false,
    organizer_id: 1,
    organizer_name: 'Admin User',
    registered_count: 320,
    avg_rating: 4.9,
    feedback_count: 45
  }
];

const DEFAULT_USERS = [
  { id: 1, name: 'Admin User', email: 'admin@eventhub.edu', role: 'admin', password: 'admin123', department: 'Administration', year: 'Staff', phone: '+91 98765 43210' },
  { id: 2, name: 'Arjun Sharma', email: 'arjun@student.edu', role: 'student', password: 'student123', department: 'Computer Science', year: '3rd Year', phone: '+91 98111 22233' },
  { id: 3, name: 'Priya Patel', email: 'priya@student.edu', role: 'student', password: 'student123', department: 'Electronics', year: '2nd Year', phone: '+91 98222 33344' },
  { id: 4, name: 'Dev Organizer', email: 'dev@eventhub.edu', role: 'organizer', password: 'org123', department: 'Management', year: 'Staff', phone: '+91 98333 44455' },
];

class StandaloneStore {
  constructor() {
    this.key = 'eventhub_client_db';
    this.init();
  }

  init() {
    const raw = localStorage.getItem(this.key);
    if (!raw) {
      this.data = {
        users: DEFAULT_USERS,
        events: DEFAULT_EVENTS,
        registrations: [
          {
            id: 1,
            event_id: 1,
            user_id: 2,
            status: 'registered',
            payment_status: 'free',
            ticket_id: 'EVH-DEMO-TKT01',
            qr_data: '{"ticket":"EVH-DEMO-TKT01","event":"TechFest 2026","user":"Arjun Sharma"}',
            registered_at: new Date().toISOString()
          }
        ],
        feedback: [
          { id: 1, event_id: 1, user_id: 2, user_name: 'Arjun Sharma', department: 'Computer Science', rating: 5, category: 'general', comment: 'Spectacular technical event! Loved the hackathon track.', created_at: new Date().toISOString() }
        ],
        notifications: [
          { id: 1, user_id: 2, title: 'Welcome to EventHub! 🎉', message: 'Hi Arjun! Explore upcoming college events and grab your passes.', type: 'success', is_read: false, created_at: new Date().toISOString() }
        ],
        counter: 100
      };
      this.save();
    } else {
      try {
        this.data = JSON.parse(raw);
        if (!this.data.events || !this.data.events.length) {
          this.data.events = DEFAULT_EVENTS;
          this.save();
        }
      } catch (e) {
        localStorage.removeItem(this.key);
        this.init();
      }
    }
  }

  save() {
    localStorage.setItem(this.key, JSON.stringify(this.data));
  }

  nextId() {
    this.data.counter = (this.data.counter || 100) + 1;
    this.save();
    return this.data.counter;
  }
}

const mockDB = new StandaloneStore();

// Standalone Mock Request Handler
async function handleMockRequest(method, path, body = {}) {
  await new Promise(r => setTimeout(r, 80)); // Realistic network latency
  const currentUser = JSON.parse(localStorage.getItem('eventhub_user') || 'null');

  // Auth: Login
  if (path === '/auth/login' && method === 'POST') {
    const emailInput = (body.email || '').toLowerCase().trim();
    let user = mockDB.data.users.find(u => u.email.toLowerCase() === emailInput);
    if (!user) {
      user = DEFAULT_USERS.find(u => u.email.toLowerCase() === emailInput);
      if (user) {
        mockDB.data.users.push({ ...user });
        mockDB.save();
      }
    }
    const isPwMatch = user && (
      user.password === body.password ||
      (emailInput === 'admin@eventhub.edu' && body.password === 'admin123') ||
      (emailInput === 'arjun@student.edu' && body.password === 'student123')
    );
    if (!user || !isPwMatch) {
      throw new Error('Invalid email or password');
    }
    const { password: _, ...safeUser } = user;
    return { success: true, token: 'demo-token-' + user.id, user: safeUser };
  }

  // Auth: Register
  if (path === '/auth/register' && method === 'POST') {
    const existing = mockDB.data.users.find(u => u.email.toLowerCase() === body.email.toLowerCase().trim());
    if (existing) throw new Error('Email already registered');
    const id = mockDB.nextId();
    const newUser = {
      id,
      name: body.name,
      email: body.email.toLowerCase().trim(),
      password: body.password,
      role: 'student',
      department: body.department || '',
      year: body.year || '',
      phone: body.phone || '',
      created_at: new Date().toISOString()
    };
    mockDB.data.users.push(newUser);
    mockDB.data.notifications.push({
      id: mockDB.nextId(),
      user_id: id,
      title: 'Welcome to EventHub! 🎉',
      message: `Welcome, ${newUser.name}! Start exploring amazing campus events!`,
      type: 'success',
      is_read: false,
      created_at: new Date().toISOString()
    });
    mockDB.save();
    const { password: _, ...safeUser } = newUser;
    return { success: true, token: 'demo-token-' + id, user: safeUser };
  }

  // Auth: Change password
  if (path === '/auth/change-password' && method === 'POST') {
    if (!currentUser) throw new Error('Access token required');
    const u = mockDB.data.users.find(x => x.id === currentUser.id);
    if (u) { u.password = body.newPassword; mockDB.save(); }
    return { success: true, message: 'Password updated successfully' };
  }

  // Events: List
  if (path.startsWith('/events') && method === 'GET') {
    const url = new URL('http://dummy.com' + path);
    const category = url.searchParams.get('category');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const featured = url.searchParams.get('featured');

    let events = [...mockDB.data.events];
    if (category && category !== 'all') events = events.filter(e => e.category === category);
    if (status && status !== 'all') events = events.filter(e => e.status === status);
    if (featured === 'true') events = events.filter(e => e.is_featured);
    if (search) {
      const q = search.toLowerCase();
      events = events.filter(e => e.title.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q));
    }
    return { success: true, data: events, total: events.length };
  }

  // Events: Get single
  if (path.match(/^\/events\/\d+$/) && method === 'GET') {
    const id = parseInt(path.split('/')[2]);
    const event = mockDB.data.events.find(e => e.id === id);
    if (!event) throw new Error('Event not found');
    const regs = mockDB.data.registrations.filter(r => r.event_id === id && r.status !== 'cancelled');
    return { success: true, data: { ...event, registered_count: regs.length } };
  }

  // Registrations: Check
  if (path.match(/^\/registrations\/check\/\d+$/) && method === 'GET') {
    if (!currentUser) return { success: true, registered: false, data: null };
    const eventId = parseInt(path.split('/')[3]);
    const reg = mockDB.data.registrations.find(r => r.event_id === eventId && r.user_id === currentUser.id && r.status !== 'cancelled');
    return { success: true, registered: !!reg, data: reg || null };
  }

  // Registrations: My
  if (path === '/registrations/my' && method === 'GET') {
    if (!currentUser) return { success: true, data: [] };
    const regs = mockDB.data.registrations.filter(r => r.user_id === currentUser.id);
    const enriched = regs.map(r => {
      const ev = mockDB.data.events.find(e => e.id === r.event_id) || {};
      return { ...r, title: ev.title, date: ev.date, time: ev.time, venue: ev.venue, category: ev.category, event_status: ev.status };
    });
    return { success: true, data: enriched };
  }

  // Registrations: All (Admin Ledger)
  if (path === '/registrations/all' && method === 'GET') {
    if (!currentUser) throw new Error('Not logged in');
    const allRegs = (mockDB.data.registrations || []).map(r => {
      const event = mockDB.data.events.find(e => e.id === r.event_id) || {};
      const user = mockDB.data.users.find(u => u.id === r.user_id) || {};
      return {
        ...r,
        title: event.title || 'Campus Event',
        category: event.category || 'General',
        date: event.date || 'TBD',
        venue: event.venue || 'Campus Auditorium',
        userName: r.attendee_name || user.name || 'Student Attendee',
        email: r.email || user.email || 'student@college.edu',
        department: user.department || 'Computer Science',
        year: user.year || '3rd Year'
      };
    }).sort((a, b) => new Date(b.registered_at) - new Date(a.registered_at));
    return { success: true, data: allRegs, total: allRegs.length };
  }

  // Registrations: Create (with Email & Password verification and Repeat Registration support)
  if (path === '/registrations' && method === 'POST') {
    if (!currentUser) throw new Error('Please sign in to generate a pass');
    const eventId = typeof body === 'object' ? parseInt(body.event_id) : parseInt(body);
    const event = mockDB.data.events.find(e => e.id === eventId);
    if (!event) throw new Error('Event not found');

    // Count user's existing passes for this event to support repeat registrations
    const userPasses = mockDB.data.registrations.filter(r => r.event_id === eventId && r.user_id === currentUser.id && r.status !== 'cancelled');
    const passNumber = userPasses.length + 1;

    const attendeeName = (body && body.attendee_name) ? body.attendee_name : currentUser.name;
    const attendeeEmail = (body && body.email) ? body.email : currentUser.email;

    const ticketId = 'EH-2026-' + Date.now().toString(36).toUpperCase() + '-P' + passNumber;
    const newReg = {
      id: mockDB.nextId(),
      event_id: eventId,
      user_id: currentUser.id,
      attendee_name: attendeeName,
      email: attendeeEmail,
      pass_number: passNumber,
      status: 'registered',
      payment_status: event.fee > 0 ? 'paid' : 'free',
      ticket_id: ticketId,
      qr_data: JSON.stringify({
        ticket: ticketId,
        passNumber: `Pass #${passNumber}`,
        event: event.title,
        venue: event.venue,
        date: event.date,
        attendee: attendeeName,
        email: attendeeEmail
      }),
      registered_at: new Date().toISOString()
    };

    mockDB.data.registrations.push(newReg);
    event.registered_count = (event.registered_count || 0) + 1;
    mockDB.data.notifications.push({
      id: mockDB.nextId(),
      user_id: currentUser.id,
      title: `Pass #${passNumber} Ready: ${event.title}`,
      message: `Your pass #${passNumber} (${ticketId}) for ${event.title} is confirmed.`,
      type: 'success',
      is_read: false,
      created_at: new Date().toISOString()
    });
    mockDB.save();
    return { success: true, message: `Pass #${passNumber} generated successfully! You can register again for more passes.`, data: newReg, passNumber };
  }

  // Registrations: Update status (Admin toggle)
  if (path.match(/^\/registrations\/\d+\/status$/) && method === 'PATCH') {
    const regId = parseInt(path.split('/')[2]);
    const reg = mockDB.data.registrations.find(r => r.id === regId);
    if (!reg) throw new Error('Registration not found');
    const newStatus = (body && body.status) ? body.status : (reg.status === 'attended' ? 'registered' : 'attended');
    reg.status = newStatus;
    mockDB.save();
    return { success: true, message: `Status updated to ${newStatus}`, status: newStatus };
  }

  // Registrations: Cancel
  if (path.match(/^\/registrations\/\d+$/) && method === 'DELETE') {
    if (!currentUser) throw new Error('Not logged in');
    const eventId = parseInt(path.split('/')[2]);
    const reg = mockDB.data.registrations.find(r => r.event_id === eventId && r.user_id === currentUser.id);
    if (reg) {
      reg.status = 'cancelled';
      const ev = mockDB.data.events.find(e => e.id === eventId);
      if (ev && ev.registered_count > 0) ev.registered_count -= 1;
      mockDB.save();
    }
    return { success: true, message: 'Registration cancelled' };
  }

  // Notifications: List
  if (path.startsWith('/notifications') && method === 'GET') {
    if (!currentUser) return { success: true, data: [], unreadCount: 0 };
    const notifs = mockDB.data.notifications.filter(n => n.user_id === currentUser.id);
    const unread = notifs.filter(n => !n.is_read).length;
    return { success: true, data: notifs, unreadCount: unread };
  }

  // Notifications: Mark read
  if (path.match(/^\/notifications\/\d+\/read$/) && method === 'PATCH') {
    const id = parseInt(path.split('/')[2]);
    const n = mockDB.data.notifications.find(x => x.id === id);
    if (n) { n.is_read = true; mockDB.save(); }
    return { success: true };
  }

  // Feedback: For Event
  if (path.match(/^\/feedback\/event\/\d+$/) && method === 'GET') {
    const eventId = parseInt(path.split('/')[3]);
    const fb = mockDB.data.feedback.filter(f => f.event_id === eventId);
    return { success: true, data: fb, stats: { avg_rating: 4.8, total: fb.length } };
  }

  // Profile: Get
  if (path === '/users/profile' && method === 'GET') {
    if (!currentUser) throw new Error('Not logged in');
    const u = mockDB.data.users.find(x => x.id === currentUser.id) || currentUser;
    const { password: _, ...safe } = u;
    return { success: true, data: safe };
  }

  // Fallback default response
  return { success: true, message: 'OK', data: [] };
}

// ==================== PRIMARY API CLIENT ====================
let forceMockMode = !isLocalServer;

const API = {
  getToken() {
    return localStorage.getItem('eventhub_token');
  },

  headers(isFormData = false) {
    const h = { 'Authorization': `Bearer ${this.getToken()}` };
    if (!isFormData) h['Content-Type'] = 'application/json';
    return h;
  },

  async request(method, path, body = null, isForm = false) {
    // If running on GitHub Pages (static hosting) or standalone demo
    if (forceMockMode || window.location.hostname.endsWith('github.io')) {
      return handleMockRequest(method, path, body);
    }

    const opts = {
      method,
      headers: this.headers(isForm),
    };
    if (body) opts.body = isForm ? body : JSON.stringify(body);

    try {
      const res = await fetch(`${API_BASE}${path}`, opts);
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 && !path.startsWith('/auth/')) {
          if (typeof handleLogout === 'function') handleLogout();
        }
        throw new Error(data.message || `HTTP ${res.status}`);
      }
      return data;
    } catch (err) {
      // If network connection to local backend failed, gracefully switch to Client Mock
      console.warn(`[EventHub] Backend unreachable at ${API_BASE}${path}. Switching to Standalone Demo mode.`);
      forceMockMode = true;
      return handleMockRequest(method, path, body);
    }
  },

  // Auth
  auth: {
    login: (body) => API.request('POST', '/auth/login', body),
    register: (body) => API.request('POST', '/auth/register', body),
    changePassword: (body) => API.request('POST', '/auth/change-password', body),
  },

  // Events
  events: {
    list: (params = {}) => API.request('GET', `/events?${new URLSearchParams(params)}`),
    get: (id) => API.request('GET', `/events/${id}`),
    create: (body) => API.request('POST', '/events', body),
    update: (id, body) => API.request('PUT', `/events/${id}`, body),
    delete: (id) => API.request('DELETE', `/events/${id}`),
    updateStatus: (id, status) => API.request('PATCH', `/events/${id}/status`, { status }),
  },

  // Registrations
  registrations: {
    all: () => API.request('GET', '/registrations/all'),
    my: () => API.request('GET', '/registrations/my'),
    forEvent: (eventId) => API.request('GET', `/registrations/event/${eventId}`),
    check: (eventId) => API.request('GET', `/registrations/check/${eventId}`),
    create: (payload) => API.request('POST', '/registrations', typeof payload === 'object' ? payload : { event_id: payload }),
    updateStatus: (id, status) => API.request('PATCH', `/registrations/${id}/status`, { status }),
    cancel: (eventId) => API.request('DELETE', `/registrations/${eventId}`),
    markAttend: (id) => API.request('PATCH', `/registrations/${id}/attend`),
  },

  // Feedback
  feedback: {
    forEvent: (eventId) => API.request('GET', `/feedback/event/${eventId}`),
    submit: (body) => API.request('POST', '/feedback', body),
    my: () => API.request('GET', '/feedback/my'),
  },

  // Analytics
  analytics: {
    overview: () => API.request('GET', '/analytics/overview'),
    event: (id) => API.request('GET', `/analytics/event/${id}`),
  },

  // Notifications
  notifications: {
    list: (params = {}) => API.request('GET', `/notifications?${new URLSearchParams(params)}`),
    markRead: (id) => API.request('PATCH', `/notifications/${id}/read`),
    markAllRead: () => API.request('PATCH', '/notifications/read-all'),
    delete: (id) => API.request('DELETE', `/notifications/${id}`),
  },

  // Users
  users: {
    profile: () => API.request('GET', '/users/profile'),
    updateProfile: (body) => API.request('PUT', '/users/profile', body),
    list: (params = {}) => API.request('GET', `/users?${new URLSearchParams(params)}`),
    updateRole: (id, role) => API.request('PUT', `/users/${id}/role`, { role }),
    delete: (id) => API.request('DELETE', `/users/${id}`),
  },
};
