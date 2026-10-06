/* ============================================
   EVENTS - Listing, Detail, Registration
   ============================================ */

let currentFilters = { category: 'all', status: 'all', search: '' };
let searchTimer = null;
let currentRating = 0;

// Category display config
const CATEGORY_CONFIG = {
  technical: { emoji: '💻', label: 'Technical', class: 'category-technical' },
  cultural: { emoji: '🎭', label: 'Cultural', class: 'category-cultural' },
  sports: { emoji: '⚽', label: 'Sports', class: 'category-sports' },
  workshop: { emoji: '🛠', label: 'Workshop', class: 'category-workshop' },
  seminar: { emoji: '📢', label: 'Seminar', class: 'category-seminar' },
  fest: { emoji: '🎉', label: 'Fest', class: 'category-fest' },
  other: { emoji: '🌐', label: 'Other', class: 'category-other' },
};

const CATEGORY_IMAGES = {
  technical: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
  cultural: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
  sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80',
  workshop: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
  seminar: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
  fest: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
  other: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&auto=format&fit=crop&q=80'
};

function getCatConfig(cat) {
  return CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.other;
}

function getEventCoverImage(event) {
  const title = (event.title || '').toLowerCase();
  if (title.includes('robot') || title.includes('hardware')) {
    return 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80';
  }
  if (title.includes('music') || title.includes('concert') || title.includes('rock') || title.includes('band')) {
    return 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80';
  }
  if (title.includes('hackathon') || title.includes('code') || title.includes('web') || title.includes('cyber')) {
    return 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80';
  }
  if (title.includes('ai') || title.includes('machine learning') || title.includes('seminar')) {
    return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80';
  }
  if (title.includes('badminton') || title.includes('cricket') || title.includes('football') || title.includes('sport')) {
    return 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80';
  }
  if (title.includes('dance') || title.includes('drama') || title.includes('fest')) {
    return 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80';
  }
  return CATEGORY_IMAGES[event.category] || CATEGORY_IMAGES.other;
}

function createEventCard(event, compact = false) {
  const cat = getCatConfig(event.category);
  const registered = event.registered_count || 0;
  const capacity = event.max_participants || 100;
  const capPercent = Math.min((registered / capacity) * 100, 100);
  const rating = event.avg_rating ? parseFloat(event.avg_rating).toFixed(1) : null;
  const tags = Array.isArray(event.tags) ? event.tags : [];
  const fee = event.fee > 0 ? `₹${event.fee}` : 'Free';
  const coverImg = getEventCoverImage(event);

  const statusClass = `status-${event.status}`;
  const statusLabel = event.status.charAt(0).toUpperCase() + event.status.slice(1);

  // Avatar stack letters
  const initials = ['A', 'S', 'R', 'P', 'M'];
  const i1 = initials[(event.id + 1) % initials.length];
  const i2 = initials[(event.id + 2) % initials.length];
  const i3 = initials[(event.id + 3) % initials.length];

  return `
    <div class="event-card" onclick="openEventDetail(${event.id})">
      <div class="event-banner">
        <img class="event-cover-img" src="${coverImg}" alt="${escapeHtml(event.title)}" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&auto=format&fit=crop&q=80';" />
        <div class="event-banner-gradient"></div>
        <div class="event-category-badge ${cat.class}">${cat.label}</div>
        ${event.is_featured ? '<div class="event-featured-badge">⭐ Featured</div>' : ''}
        <div class="event-fee-badge">${fee}</div>
      </div>
      <div class="event-body">
        <div class="event-title">${escapeHtml(event.title)}</div>
        <div class="event-meta">
          <div class="event-meta-item">
            <span class="event-meta-icon">📅</span>
            <span>${formatDate(event.date)} · ${formatTime(event.time)}</span>
          </div>
          <div class="event-meta-item">
            <span class="event-meta-icon">📍</span>
            <span>${escapeHtml(event.venue)}</span>
          </div>
          ${event.prize ? `<div class="event-meta-item"><span class="event-meta-icon">🏆</span><span>${escapeHtml(event.prize)}</span></div>` : ''}
        </div>

        <div class="event-capacity-wrap">
          <div class="event-capacity-header">
            <span>Capacity</span>
            <span class="event-capacity-val">${registered}/${capacity}</span>
          </div>
          <div class="event-capacity-track">
            <div class="event-capacity-bar" style="width:${capPercent}%"></div>
          </div>
        </div>

        <div class="event-footer">
          <div class="event-attendees">
            <div class="avatar-stack">
              <div class="avatar-stack-item" style="background:#6366f1">${i1}</div>
              <div class="avatar-stack-item" style="background:#06b6d4">${i2}</div>
              <div class="avatar-stack-item" style="background:#10b981">${i3}</div>
            </div>
            <span class="attendee-text">+${registered > 0 ? registered : 42} attending</span>
          </div>
          <button type="button" class="event-action-btn" onclick="event.stopPropagation(); openEventDetail(${event.id})">
            ${fee === 'Free' ? 'Register' : 'Get Tickets'}
          </button>
        </div>
      </div>
    </div>
  `;
}

async function loadAllEvents() {
  const container = document.getElementById('all-events-list');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner">Loading events...</div>';

  const params = {};
  if (currentFilters.category !== 'all') params.category = currentFilters.category;
  if (currentFilters.status !== 'all') params.status = currentFilters.status;
  if (currentFilters.search) params.search = currentFilters.search;

  try {
    const data = await API.events.list(params);
    if (data.data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <h3>No Events Found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      `;
      return;
    }
    container.innerHTML = data.data.map(e => createEventCard(e)).join('');
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><h3>Failed to load events</h3><p>${err.message}</p></div>`;
  }
}

function debounceSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentFilters.search = document.getElementById('search-input').value.trim();
    loadAllEvents();
  }, 400);
}

function filterCategory(btn, cat) {
  document.querySelectorAll('#category-filters .chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  currentFilters.category = cat;
  loadAllEvents();
}

function filterStatus(btn, status) {
  // find the status chips
  btn.closest('.filter-chips').querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  currentFilters.status = status;
  loadAllEvents();
}

async function openEventDetail(eventId) {
  const modal = document.getElementById('event-modal');
  const content = document.getElementById('event-modal-content');
  content.innerHTML = '<div class="loading-spinner" style="padding:4rem">Loading...</div>';
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  try {
    const [eventData, regCheck] = await Promise.all([
      API.events.get(eventId),
      currentUser ? API.registrations.check(eventId).catch(() => ({ registered: false, data: null })) : Promise.resolve({ registered: false })
    ]);

    const event = eventData.data;
    const isRegistered = regCheck.registered && regCheck.data?.status !== 'cancelled';
    const regData = regCheck.data;
    const cat = getCatConfig(event.category);
    const registered = event.registered_count || 0;
    const capacity = event.max_participants || 100;
    const capPercent = Math.min((registered / capacity) * 100, 100);
    const tags = Array.isArray(event.tags) ? event.tags : [];
    const isAdmin = currentUser && ['admin', 'organizer'].includes(currentUser.role);
    const isFull = registered >= capacity;
    const isPast = event.status === 'completed' || event.status === 'cancelled';
    const fee = event.fee > 0 ? `₹${event.fee}` : 'FREE';

    let regBtn = '';
    if (isRegistered) {
      const status = regData?.status;
      if (status === 'waitlist') {
        regBtn = `<button class="btn-secondary" disabled>⏳ On Waitlist</button>
          <button class="btn-danger" onclick="cancelRegistration(${event.id})">Cancel</button>`;
      } else if (status === 'attended') {
        regBtn = `<button class="btn-secondary" disabled>✅ Attended</button>
          <button class="btn-primary" onclick="openFeedbackModal(${event.id})">📝 Leave Feedback</button>
          <button class="btn-secondary" onclick="openPassRegModal(${event.id}, '${escapeHtml(event.title)}')">🎫 Register Again (New Pass)</button>`;
      } else {
        regBtn = `<button class="btn-success" disabled>✅ Active Pass • ${regData?.ticket_id || ''}</button>
          <button class="btn-primary" onclick="openPassRegModal(${event.id}, '${escapeHtml(event.title)}')">🎫 Register Again (Pass #${(regData?.pass_number || 1) + 1})</button>
          <button class="btn-danger" onclick="cancelRegistration(${event.id})">Cancel</button>`;
      }
    } else if (isPast) {
      regBtn = `<button class="btn-secondary" disabled>Event ${event.status}</button>`;
    } else if (isFull) {
      regBtn = `<button class="btn-secondary" onclick="openPassRegModal(${event.id}, '${escapeHtml(event.title)}')">⏳ Join Waitlist</button>`;
    } else {
      regBtn = `<button class="btn-primary" onclick="openPassRegModal(${event.id}, '${escapeHtml(event.title)}')">🎫 Register & Get Pass ${fee !== 'FREE' ? '• ' + fee : '• Free'}</button>`;
    }

    content.innerHTML = `
      <div class="event-detail-banner ${cat.banner}" style="background: linear-gradient(135deg, var(--primary-dark), var(--secondary-dark))">
        <div class="event-detail-emoji">${cat.emoji}</div>
        <div class="event-category-badge ${cat.class}" style="position:absolute;top:1rem;left:1rem">${cat.label}</div>
        ${event.is_featured ? '<div class="event-featured-badge" style="position:absolute;top:1rem;right:1rem">⭐ Featured</div>' : ''}
      </div>
      <div class="event-detail-body">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.75rem">
          <div>
            <h1 class="event-detail-title">${escapeHtml(event.title)}</h1>
            <span class="event-status-pill status-${event.status}">${event.status}</span>
          </div>
          <div style="text-align:right">
            <div style="font-size:1.5rem;font-weight:900;color:var(--primary-light)">${fee}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">Registration Fee</div>
          </div>
        </div>
        
        <div class="event-detail-meta">
          <div class="detail-meta-item">📅 ${formatDate(event.date)}</div>
          <div class="detail-meta-item">🕐 ${formatTime(event.time)}${event.end_time ? ' – ' + formatTime(event.end_time) : ''}</div>
          <div class="detail-meta-item">📍 ${escapeHtml(event.venue)}</div>
          ${event.prize ? `<div class="detail-meta-item">🏆 ${escapeHtml(event.prize)}</div>` : ''}
          <div class="detail-meta-item">👤 By ${escapeHtml(event.organizer_name)}</div>
          ${event.registration_deadline ? `<div class="detail-meta-item">⏰ Deadline: ${formatDate(event.registration_deadline)}</div>` : ''}
        </div>

        <p class="event-detail-desc">${escapeHtml(event.description)}</p>

        ${tags.length ? `<div class="event-tags" style="margin-bottom:1rem">${tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}

        <div class="capacity-bar">
          <div class="capacity-label">Capacity: ${registered} / ${capacity} registered ${isFull ? '(Full)' : ''}</div>
          <div class="progress-bar"><div class="progress-fill" style="width:${capPercent}%"></div></div>
        </div>

        ${event.avg_rating ? `
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem">
            <span style="color:var(--accent);font-size:1.2rem">★ ${parseFloat(event.avg_rating).toFixed(1)}</span>
            <span style="color:var(--text-muted);font-size:0.85rem">(${event.feedback_count} reviews)</span>
          </div>
        ` : ''}

        ${isAdmin ? `
          <div style="margin-bottom:1rem;display:flex;gap:0.5rem;flex-wrap:wrap">
            <button class="btn-secondary btn-sm" onclick="openEditEventModal(${event.id})">✏️ Edit Event</button>
            <button class="btn-success btn-sm" onclick="updateEventStatus(${event.id},'ongoing')">▶ Set Ongoing</button>
            <button class="btn-success btn-sm" onclick="updateEventStatus(${event.id},'completed')">✅ Set Completed</button>
            <button class="btn-danger btn-sm" onclick="deleteEvent(${event.id})">🗑 Delete</button>
            <button class="btn-secondary btn-sm" onclick="viewRegistrations(${event.id})">👥 View Registrations</button>
          </div>
        ` : ''}

        <div class="event-detail-actions">${regBtn}</div>

        <!-- Feedback Section -->
        <div id="event-feedback-section" class="feedback-section">
          <h3 style="margin-bottom:1rem;font-size:1rem">Reviews & Feedback</h3>
          <div id="event-feedback-content"><div class="loading-spinner">Loading...</div></div>
        </div>
      </div>
    `;

    // Load feedback
    loadEventFeedback(event.id);

  } catch (err) {
    content.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><h3>Failed to load event</h3><p>${err.message}</p></div>`;
  }
}

async function loadEventFeedback(eventId) {
  const container = document.getElementById('event-feedback-content');
  if (!container) return;
  try {
    const data = await API.feedback.forEvent(eventId);
    const { data: feedbacks, stats } = data;

    if (!feedbacks.length) {
      container.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem">No reviews yet. Be the first to review!</p>';
      return;
    }

    const avgRating = stats.avg_rating ? parseFloat(stats.avg_rating).toFixed(1) : '0.0';
    const totalFeedback = stats.total || 0;

    container.innerHTML = `
      <div class="feedback-avg">
        <div class="feedback-avg-score">${avgRating}</div>
        <div class="feedback-avg-info">
          <div class="star-mini">${'★'.repeat(Math.round(parseFloat(avgRating)))}${'☆'.repeat(5 - Math.round(parseFloat(avgRating)))}</div>
          <span style="font-size:0.82rem;color:var(--text-muted)">${totalFeedback} review${totalFeedback !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <div class="rating-breakdown">
        ${[5,4,3,2,1].map(r => {
          const cnt = stats[['','one_star','two_star','three_star','four_star','five_star'][r]] || 0;
          const pct = totalFeedback ? (cnt / totalFeedback * 100) : 0;
          return `<div class="rating-row">
            <span class="r-label">${r}★</span>
            <div class="r-bar"><div class="r-fill" style="width:${pct}%"></div></div>
            <span class="r-count">${cnt}</span>
          </div>`;
        }).join('')}
      </div>
      <div style="margin-top:1.25rem">
        ${feedbacks.map(f => `
          <div class="feedback-card">
            <div class="feedback-card-header">
              <span class="feedback-user">${escapeHtml(f.user_name)}</span>
              <span class="feedback-stars">${'★'.repeat(f.rating)}${'☆'.repeat(5 - f.rating)}</span>
            </div>
            ${f.comment ? `<p class="feedback-comment">${escapeHtml(f.comment)}</p>` : ''}
            <div class="feedback-meta">${f.department || ''} · ${formatDateTime(f.created_at)}</div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    container.innerHTML = '<p style="color:var(--text-muted)">Could not load reviews.</p>';
  }
}

let currentPassRegEventId = null;

function openPassRegModal(eventId, eventTitle) {
  currentPassRegEventId = eventId;
  const modal = document.getElementById('pass-reg-modal');
  if (!modal) {
    registerForEvent(eventId);
    return;
  }

  document.getElementById('prm-event-title').textContent = eventTitle || 'Campus Fest';
  document.getElementById('prm-name').value = currentUser ? currentUser.name : '';
  document.getElementById('prm-email').value = currentUser ? currentUser.email : '';
  document.getElementById('prm-password').value = '';
  document.getElementById('prm-error').classList.add('hidden');

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

async function handlePassRegSubmit(e) {
  e.preventDefault();
  if (!currentPassRegEventId) return;

  const btn = document.getElementById('prm-submit-btn');
  const errEl = document.getElementById('prm-error');
  errEl.classList.add('hidden');

  const attendeeName = document.getElementById('prm-name').value.trim();
  const email = document.getElementById('prm-email').value.trim();
  const password = document.getElementById('prm-password').value;

  if (!email || !password) {
    errEl.textContent = 'Please enter your email and password to generate and authorize the pass.';
    errEl.classList.remove('hidden');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="btn-loader">⏳</span> Generating Pass...';

  try {
    const res = await API.registrations.create({
      event_id: currentPassRegEventId,
      attendee_name: attendeeName,
      email: email,
      password: password
    });

    closeModal('pass-reg-modal');
    showToast('success', 'Pass Generated!', res.message || 'Pass generated successfully!');

    // Refresh views
    if (typeof loadDashboard === 'function') loadDashboard();
    if (typeof loadMyRegistrations === 'function') loadMyRegistrations();
    if (typeof loadAllEvents === 'function') loadAllEvents();

    // Inspect newly generated pass
    const pass = res.data;
    if (pass && typeof inspectPassModal === 'function') {
      const title = document.getElementById('prm-event-title')?.textContent || 'Event';
      inspectPassModal(
        pass.ticket_id,
        title,
        pass.attendee_name || attendeeName,
        pass.email || email,
        pass.pass_number || res.passNumber || 1,
        'Campus Auditorium',
        new Date().toISOString().split('T')[0]
      );
    }
  } catch (err) {
    errEl.textContent = err.message || 'Failed to generate pass';
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🎫 Authenticate & Generate Pass';
  }
}

async function registerForEvent(eventId) {
  const actionsContainer = document.querySelector('.event-detail-actions');
  const originalHtml = actionsContainer ? actionsContainer.innerHTML : '';
  if (actionsContainer) {
    actionsContainer.innerHTML = '<button class="btn-primary" disabled><span class="btn-loader">⏳</span> Registering...</button>';
  }

  try {
    const data = await API.registrations.create(eventId);
    showToast('success', 'Registered!', data.message || 'Successfully registered!');
    await openEventDetail(eventId);
    loadDashboard();
    loadMyRegistrations();
    loadAllEvents();
  } catch (err) {
    if (actionsContainer) actionsContainer.innerHTML = originalHtml;
    showToast('error', 'Registration Failed', err.message || 'Could not register for this event');
  }
}

async function cancelRegistration(eventId) {
  if (!confirm('Are you sure you want to cancel your registration?')) return;
  try {
    await API.registrations.cancel(eventId);
    showToast('info', 'Cancelled', 'Registration cancelled successfully');
    await openEventDetail(eventId);
    loadMyRegistrations();
    loadDashboard();
    loadAllEvents();
  } catch (err) {
    showToast('error', 'Error', err.message || 'Failed to cancel registration');
  }
}

async function loadMyRegistrations() {
  const container = document.getElementById('my-registrations-list');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner">Loading tickets...</div>';

  try {
    const data = await API.registrations.my();
    if (!data.data.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🎫</div>
          <h3>No Tickets Found</h3>
          <p>Register for campus hackathons, workshops or concerts to view your digital passes here</p>
          <button class="btn-primary" style="margin-top:1rem" onclick="navigate('events')">Browse Events</button>
        </div>
      `;
      return;
    }

    const userName = currentUser ? currentUser.name : 'Student Attendee';
    const userDept = currentUser && currentUser.department ? currentUser.department : 'Computer Science & Engineering';

    container.innerHTML = data.data.map(reg => {
      const statusClass = `reg-${reg.status}`;
      const ticketId = reg.ticket_id || `EVH-2026-${String(reg.event_id * 137).padStart(5, '0')}`;
      const seatBlock = String.fromCharCode(65 + (reg.event_id % 4));
      const seatTable = ((reg.event_id * 7) % 25) + 1;

      return `
        <div class="pro-ticket-pass">
          <div class="ticket-top-stripe"></div>
          <div class="ticket-left-stub">
            <div class="ticket-crest">
              <span class="ticket-crest-icon">🏛️</span>
              <span>CENTRAL TECH UNIVERSITY • OFFICIAL PASS</span>
            </div>
            <div class="ticket-event-title">${escapeHtml(reg.title)}</div>
            <div class="ticket-attendee-name">${escapeHtml(userName)}</div>
            <div class="ticket-attendee-dept">${escapeHtml(userDept)}</div>

            <div class="ticket-meta-grid">
              <div class="ticket-meta-cell">
                <label>Venue</label>
                <span>${escapeHtml(reg.venue)}</span>
              </div>
              <div class="ticket-meta-cell">
                <label>Date</label>
                <span>${formatDate(reg.date)}</span>
              </div>
              <div class="ticket-meta-cell">
                <label>Time</label>
                <span>${formatTime(reg.time)}</span>
              </div>
              <div class="ticket-meta-cell">
                <label>Seat / Table</label>
                <span>Block ${seatBlock} - Table ${seatTable}</span>
              </div>
            </div>

            <div class="ticket-actions-row">
              <button type="button" class="apple-wallet-btn" onclick="downloadAppleWalletPass('${ticketId}')">
                <span class="wallet-icon"></span> Add to Apple Wallet
              </button>
              <button type="button" class="ticket-pdf-btn" onclick="printOrDownloadTicket('${ticketId}', '${escapeHtml(reg.title)}')">
                📄 Download PDF
              </button>
              ${(reg.status === 'registered' || reg.status === 'waitlist') ? `
                <button type="button" class="btn-danger btn-sm" onclick="cancelRegistration(${reg.event_id})">Cancel</button>
              ` : ''}
              ${(reg.status === 'attended' || reg.status === 'registered') && reg.event_status === 'completed' ? `
                <button type="button" class="btn-secondary btn-sm" onclick="openFeedbackModal(${reg.event_id})">📝 Review</button>
              ` : ''}
            </div>
          </div>

          <!-- Perforation divider -->
          <div class="ticket-perforation">
            <div class="ticket-notch-top"></div>
            <div class="ticket-perforated-line"></div>
            <div class="ticket-notch-bottom"></div>
          </div>

          <!-- Right stub (QR Code & Barcode) -->
          <div class="ticket-right-stub">
            <div class="ticket-qr-box">
              <svg class="ticket-qr-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="100" fill="#ffffff" />
                <path fill="#000000" d="M10,10 h24 v24 h-24 z M14,14 v16 h16 v-16 z M18,18 h8 v8 h-8 z" />
                <path fill="#000000" d="M66,10 h24 v24 h-24 z M70,14 v16 h16 v-16 z M74,18 h8 v8 h-8 z" />
                <path fill="#000000" d="M10,66 h24 v24 h-24 z M14,70 v16 h16 v-16 z M18,74 h8 v8 h-8 z" />
                <rect x="40" y="14" width="6" height="6" fill="#000" />
                <rect x="52" y="14" width="6" height="6" fill="#000" />
                <rect x="40" y="26" width="18" height="6" fill="#000" />
                <rect x="14" y="42" width="6" height="6" fill="#000" />
                <rect x="26" y="48" width="8" height="6" fill="#000" />
                <rect x="42" y="42" width="16" height="16" fill="#000" />
                <rect x="66" y="42" width="8" height="6" fill="#000" />
                <rect x="80" y="48" width="6" height="8" fill="#000" />
                <rect x="40" y="66" width="6" height="18" fill="#000" />
                <rect x="52" y="74" width="14" height="6" fill="#000" />
                <rect x="74" y="66" width="14" height="6" fill="#000" />
                <rect x="80" y="80" width="8" height="8" fill="#000" />
              </svg>
            </div>
            <div class="ticket-id-label">TICKET #${ticketId}</div>
            <div class="ticket-barcode-box">
              <svg viewBox="0 0 120 24" xmlns="http://www.w3.org/2000/svg">
                <rect width="120" height="24" fill="none"/>
                <path fill="#ffffff" d="M4,0 h2 v24 h-2 z M8,0 h1 v24 h-1 z M12,0 h3 v24 h-3 z M18,0 h1 v24 h-1 z M22,0 h2 v24 h-2 z M28,0 h3 v24 h-3 z M34,0 h1 v24 h-1 z M38,0 h2 v24 h-2 z M44,0 h3 v24 h-3 z M50,0 h1 v24 h-1 z M54,0 h2 v24 h-2 z M60,0 h3 v24 h-3 z M66,0 h1 v24 h-1 z M70,0 h2 v24 h-2 z M76,0 h3 v24 h-3 z M82,0 h1 v24 h-1 z M86,0 h2 v24 h-2 z M92,0 h3 v24 h-3 z M98,0 h1 v24 h-1 z M102,0 h2 v24 h-2 z M108,0 h3 v24 h-3 z M114,0 h2 v24 h-2 z"/>
              </svg>
            </div>
            <span class="ticket-badge-pill ${statusClass}">${reg.status}</span>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><h3>Error</h3><p>${err.message}</p></div>`;
  }
}

function downloadAppleWalletPass(ticketId) {
  showToast('success', 'Apple Wallet', `Digital Pass #${ticketId} ready! Added to Apple Wallet (.pkpass)`);
}

function printOrDownloadTicket(ticketId, eventTitle) {
  showToast('info', 'Download Ticket', `Generating PDF for ${eventTitle || 'Event'} (Ticket #${ticketId})...`);
  setTimeout(() => window.print(), 350);
}

// Feedback Modal
function openFeedbackModal(eventId) {
  document.getElementById('fb-event-id').value = eventId;
  document.getElementById('fb-rating').value = '';
  document.getElementById('fb-comment').value = '';
  currentRating = 0;
  updateStars(0);
  document.getElementById('feedback-modal').classList.remove('hidden');
}

function setRating(val) {
  currentRating = val;
  document.getElementById('fb-rating').value = val;
  updateStars(val);
}

function updateStars(val) {
  document.querySelectorAll('#star-rating .star').forEach((s, i) => {
    s.classList.toggle('active', i < val);
  });
}

async function handleFeedbackSubmit(e) {
  e.preventDefault();
  const eventId = document.getElementById('fb-event-id').value;
  const rating = document.getElementById('fb-rating').value;
  const comment = document.getElementById('fb-comment').value;
  const category = document.getElementById('fb-category').value;

  if (!rating) { showToast('warning', 'Rating Required', 'Please select a star rating'); return; }

  try {
    await API.feedback.submit({ event_id: parseInt(eventId), rating: parseInt(rating), comment, category });
    showToast('success', 'Feedback Submitted!', 'Thank you for your feedback!');
    closeModal('feedback-modal');
    // Refresh feedback in event modal if open
    loadEventFeedback(eventId);
  } catch (err) {
    showToast('error', 'Error', err.message);
  }
}

async function updateEventStatus(eventId, status) {
  try {
    await API.events.updateStatus(eventId, status);
    showToast('success', 'Updated!', `Event status set to ${status}`);
    openEventDetail(eventId);
    loadAdminEvents();
  } catch (err) {
    showToast('error', 'Error', err.message);
  }
}

async function deleteEvent(eventId) {
  if (!confirm('Permanently delete this event? This cannot be undone.')) return;
  try {
    await API.events.delete(eventId);
    showToast('success', 'Deleted!', 'Event deleted successfully');
    closeModal('event-modal');
    loadAllEvents();
    loadAdminEvents();
    loadDashboard();
  } catch (err) {
    showToast('error', 'Error', err.message);
  }
}

async function viewRegistrations(eventId) {
  // Show registrations in a simple way
  try {
    const data = await API.registrations.forEvent(eventId);
    const regs = data.data;
    const content = document.getElementById('event-modal-content');
    
    const list = regs.length ? regs.map(r => `
      <tr>
        <td>${escapeHtml(r.name)}</td>
        <td>${escapeHtml(r.email)}</td>
        <td>${escapeHtml(r.department || '-')}</td>
        <td>${escapeHtml(r.year || '-')}</td>
        <td><span class="reg-status-badge reg-${r.status}">${r.status}</span></td>
        <td><code style="font-size:0.75rem">${r.ticket_id || '-'}</code></td>
        <td>
          ${r.status === 'registered' ? `<button class="btn-success btn-sm" onclick="markAttended(${r.id})">Mark Attended</button>` : ''}
        </td>
      </tr>
    `).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:2rem">No registrations</td></tr>';

    content.innerHTML = `
      <div style="padding:1.5rem">
        <h2 style="margin-bottom:1.25rem">👥 Registrations (${regs.length})</h2>
        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead><tr>
              <th>Name</th><th>Email</th><th>Dept</th><th>Year</th><th>Status</th><th>Ticket</th><th>Action</th>
            </tr></thead>
            <tbody>${list}</tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    showToast('error', 'Error', err.message);
  }
}

async function markAttended(regId) {
  try {
    await API.registrations.markAttend(regId);
    showToast('success', 'Marked!', 'Attendance recorded');
    // Refresh the view by finding the event ID
  } catch (err) {
    showToast('error', 'Error', err.message);
  }
}
