/* ============================================
   DASHBOARD - Stats and Featured Events
   ============================================ */

async function loadDashboard() {
  // Load stats
  loadDashboardStats();

  // Load hero showcase banner
  loadHeroBanner();

  // Load featured events
  loadFeaturedEvents();

  // Load upcoming events
  loadUpcomingEvents();

  // Sync user meta in topbar
  syncDesktopTopbarUser();

  // Personalized greeting
  const greetEl = document.getElementById('dashboard-greeting');
  if (greetEl && currentUser) {
    greetEl.textContent = `Dashboard Overview`;
  }
}

function syncDesktopTopbarUser() {
  if (!currentUser) return;
  const nameEl = document.getElementById('desktop-user-name');
  const avatarEl = document.getElementById('desktop-user-avatar');
  if (nameEl) {
    const dept = currentUser.department ? ` - ${currentUser.department.split(' ')[0]}` : '';
    nameEl.textContent = `${currentUser.name}${dept}`;
  }
  if (avatarEl) {
    const initials = currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    avatarEl.textContent = initials || 'JD';
  }
}

async function loadHeroBanner() {
  const container = document.getElementById('dashboard-hero-container');
  if (!container) return;

  try {
    const data = await API.events.list({ featured: 'true', limit: 1 });
    let heroEvent = data.data && data.data.length ? data.data[0] : null;

    if (!heroEvent) {
      const allEvents = await API.events.list({ limit: 1, status: 'upcoming' });
      heroEvent = allEvents.data && allEvents.data.length ? allEvents.data[0] : null;
    }

    const title = heroEvent ? heroEvent.title : 'TechFest 2026 – Annual Tech Symposium';
    const date = heroEvent ? formatDate(heroEvent.date) : 'Oct 15, 2026';
    const eventId = heroEvent ? heroEvent.id : 1;
    const venue = heroEvent && heroEvent.venue ? heroEvent.venue.split('&')[0].trim() : 'Main Auditorium';
    const prize = heroEvent && heroEvent.prize ? heroEvent.prize.replace('Total Prize Pool', 'Prize').trim() : '₹50,000 Pool';
    const capacity = heroEvent && heroEvent.max_participants ? `${heroEvent.max_participants}+ Innovators` : '500+ Innovators';
    const tagline = 'Annual Inter-College Hackathon, Robotics & Innovation Arena';
    const localImg = 'assets/event_hero.jpg';
    const fallbackImg = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80';

    container.innerHTML = `
      <div class="dashboard-hero-banner" onclick="openEventDetail(${eventId})">
        <div class="hero-banner-content">
          <span class="hero-date-badge">🚀 Featured Fest · ${date}</span>
          <h2 class="hero-title">${escapeHtml(title)}</h2>
          <p class="hero-tagline">${escapeHtml(tagline)}</p>
          <div class="hero-highlights">
            <span class="hero-chip">🏆 ${escapeHtml(prize)}</span>
            <span class="hero-chip">⚡ ${escapeHtml(capacity)}</span>
            <span class="hero-chip">📍 ${escapeHtml(venue)}</span>
          </div>
          <button type="button" class="hero-cta" onclick="event.stopPropagation(); openEventDetail(${eventId})">
            Register Now →
          </button>
        </div>
        <div class="hero-banner-image">
          <img src="${localImg}" onerror="this.onerror=null;this.src='${fallbackImg}'" alt="${escapeHtml(title)}" />
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = '';
  }
}

async function loadDashboardStats() {
  try {
    const [eventsData, regsData] = await Promise.all([
      API.events.list({ limit: 100 }),
      API.registrations.my()
    ]);

    const events = (eventsData && eventsData.data) || [];
    const regs = (regsData && regsData.data) || [];
    const isAdmin = currentUser && ['admin', 'organizer'].includes(currentUser.role);

    const totalEl = document.getElementById('stat-total-events');
    const myRegsEl = document.getElementById('stat-my-regs');
    const myRegsLabelEl = document.getElementById('stat-my-regs-label');
    const upcomingEl = document.getElementById('stat-upcoming');
    const upcomingLabelEl = document.getElementById('stat-upcoming-label');
    const attendedEl = document.getElementById('stat-attended');
    const attendedLabelEl = document.getElementById('stat-attended-label');

    // 1. Total Campus Events
    if (totalEl) totalEl.textContent = events.length;

    // 2. Registrations Stat: personal registrations for student, campus registrations for admin
    if (myRegsEl) {
      if (isAdmin) {
        const totalCampusRegs = events.reduce((sum, e) => sum + (e.registered_count || 0), 0);
        myRegsEl.textContent = totalCampusRegs;
        if (myRegsLabelEl) myRegsLabelEl.textContent = 'Total Registrations';
      } else {
        myRegsEl.textContent = regs.length;
        if (myRegsLabelEl) myRegsLabelEl.textContent = 'My Registrations';
      }
    }

    // 3. Upcoming Scheduled Events (upcoming or ongoing)
    const upcomingEvents = events.filter(e => e.status === 'upcoming' || e.status === 'ongoing');
    if (upcomingEl) upcomingEl.textContent = upcomingEvents.length;
    if (upcomingLabelEl) upcomingLabelEl.textContent = 'Upcoming Events';

    // 4. Active Entry Tickets / Passes
    if (attendedEl) {
      if (isAdmin) {
        const totalPasses = events.reduce((sum, e) => sum + (e.registered_count || 0), 0);
        attendedEl.textContent = totalPasses;
        if (attendedLabelEl) attendedLabelEl.textContent = 'Passes Issued';
      } else {
        const activeTickets = regs.filter(r => r.status !== 'cancelled').length;
        attendedEl.textContent = activeTickets;
        if (attendedLabelEl) attendedLabelEl.textContent = 'Tickets Active';
      }
    }
  } catch (err) {
    console.warn('Stats error:', err.message);
  }
}

async function loadFeaturedEvents() {
  const container = document.getElementById('featured-events');
  if (!container) return;

  try {
    const data = await API.events.list({ featured: 'true', limit: 6 });
    if (!data.data.length) {
      const allData = await API.events.list({ limit: 6, status: 'upcoming' });
      container.innerHTML = allData.data.map(e => createEventCard(e)).join('') || '<p class="text-muted" style="padding:1rem">No events found</p>';
      return;
    }
    container.innerHTML = data.data.map(e => createEventCard(e)).join('');
  } catch (err) {
    container.innerHTML = '<p class="text-muted" style="padding:1rem">Failed to load events</p>';
  }
}

async function loadUpcomingEvents() {
  const container = document.getElementById('upcoming-events');
  if (!container) return;

  try {
    const data = await API.events.list({ status: 'upcoming', limit: 6 });
    if (!data.data.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📅</div><h3>No Upcoming Events</h3></div>';
      return;
    }
    container.innerHTML = data.data.map(e => createEventCard(e)).join('');
  } catch (err) {
    container.innerHTML = '<p class="text-muted" style="padding:1rem">Failed to load events</p>';
  }
}

// Global Keyboard Shortcut: Ctrl+K / Cmd+K for Search
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    const searchInput = document.getElementById('desktop-search-input') || document.getElementById('search-input');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }
});

function handleDesktopSearch(e) {
  if (e.key === 'Enter') {
    const query = e.target.value.trim();
    navigate('events');
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.value = query;
      debounceSearch();
    }
  }
}
