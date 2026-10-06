/* ============================================
   ADMIN - Event Management, Users, Analytics
   ============================================ */

let editingEventId = null;
let userSearchTimer = null;
let currentUserRoleFilter = '';

// ==================== EVENT MANAGEMENT ====================

async function loadAdminEvents() {
  const container = document.getElementById('admin-events-list');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner">Loading events...</div>';

  try {
    const data = await API.events.list({ limit: 100 });
    const events = data.data;

    if (!events.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📅</div><h3>No Events Yet</h3><p>Create your first event</p></div>`;
      return;
    }

    container.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Category</th>
            <th>Date</th>
            <th>Venue</th>
            <th>Registrations</th>
            <th>Status</th>
            <th>Rating</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${events.map(e => {
            const cat = getCatConfig(e.category);
            return `
              <tr>
                <td class="td-title">${escapeHtml(e.title)}</td>
                <td><span class="event-category-badge ${cat.class}" style="position:static;display:inline-block">${cat.emoji} ${cat.label}</span></td>
                <td>${formatDate(e.date)}</td>
                <td>${escapeHtml(e.venue)}</td>
                <td>${e.registered_count || 0}/${e.max_participants}</td>
                <td><span class="event-status-pill status-${e.status}">${e.status}</span></td>
                <td>${e.avg_rating ? `⭐ ${parseFloat(e.avg_rating).toFixed(1)}` : '—'}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn-secondary btn-sm" onclick="openEventDetail(${e.id})">👁</button>
                    <button class="btn-secondary btn-sm" onclick="openEditEventModal(${e.id})">✏️</button>
                    <button class="btn-danger btn-sm" onclick="deleteEvent(${e.id})">🗑</button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><h3>${err.message}</h3></div>`;
  }
}

function openCreateEventModal() {
  editingEventId = null;
  document.getElementById('event-form-title').textContent = 'Create New Event';
  document.getElementById('event-submit-btn').textContent = 'Create Event';
  document.getElementById('edit-event-id').value = '';
  document.getElementById('event-form').reset();
  document.getElementById('event-form-error').classList.add('hidden');
  // Set min date
  document.getElementById('ef-date').min = new Date().toISOString().split('T')[0];
  document.getElementById('create-event-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

async function openEditEventModal(eventId) {
  editingEventId = eventId;
  document.getElementById('event-form-title').textContent = 'Edit Event';
  document.getElementById('event-submit-btn').textContent = 'Save Changes';
  document.getElementById('edit-event-id').value = eventId;
  document.getElementById('event-form-error').classList.add('hidden');

  try {
    const data = await API.events.get(eventId);
    const e = data.data;
    document.getElementById('ef-title').value = e.title;
    document.getElementById('ef-category').value = e.category;
    document.getElementById('ef-description').value = e.description;
    document.getElementById('ef-date').value = e.date;
    document.getElementById('ef-time').value = e.time;
    document.getElementById('ef-end-time').value = e.end_time || '';
    document.getElementById('ef-venue').value = e.venue;
    document.getElementById('ef-max').value = e.max_participants;
    document.getElementById('ef-deadline').value = e.registration_deadline || '';
    document.getElementById('ef-fee').value = e.fee || 0;
    document.getElementById('ef-prize').value = e.prize || '';
    document.getElementById('ef-tags').value = Array.isArray(e.tags) ? e.tags.join(', ') : '';
    document.getElementById('ef-featured').checked = !!e.is_featured;
    document.getElementById('create-event-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  } catch (err) {
    showToast('error', 'Error', err.message);
  }
}

async function handleEventSubmit(e) {
  e.preventDefault();
  const errEl = document.getElementById('event-form-error');
  errEl.classList.add('hidden');

  const tags = document.getElementById('ef-tags').value
    .split(',').map(t => t.trim()).filter(Boolean);

  const payload = {
    title: document.getElementById('ef-title').value.trim(),
    category: document.getElementById('ef-category').value,
    description: document.getElementById('ef-description').value.trim(),
    date: document.getElementById('ef-date').value,
    time: document.getElementById('ef-time').value,
    end_time: document.getElementById('ef-end-time').value || null,
    venue: document.getElementById('ef-venue').value.trim(),
    max_participants: parseInt(document.getElementById('ef-max').value) || 100,
    registration_deadline: document.getElementById('ef-deadline').value || null,
    fee: parseFloat(document.getElementById('ef-fee').value) || 0,
    prize: document.getElementById('ef-prize').value.trim(),
    tags,
    is_featured: document.getElementById('ef-featured').checked,
  };

  const btn = document.getElementById('event-submit-btn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    if (editingEventId) {
      await API.events.update(editingEventId, payload);
      showToast('success', 'Event Updated!', 'Changes saved successfully');
    } else {
      await API.events.create(payload);
      showToast('success', 'Event Created!', 'New event is now live');
    }
    closeModal('create-event-modal');
    loadAdminEvents();
    loadDashboard();
    loadAllEvents();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = editingEventId ? 'Save Changes' : 'Create Event';
  }
}

// ==================== USER MANAGEMENT ====================

async function loadUsers() {
  const container = document.getElementById('users-list');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner">Loading users...</div>';

  const params = {};
  if (currentUserRoleFilter) params.role = currentUserRoleFilter;
  const searchVal = document.getElementById('user-search')?.value?.trim();
  if (searchVal) params.search = searchVal;

  try {
    const data = await API.users.list(params);
    const users = data.data;

    if (!users.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👥</div><h3>No Users Found</h3></div>';
      return;
    }

    container.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Department</th>
            <th>Year</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(u => `
            <tr>
              <td class="td-title">
                <div style="display:flex;align-items:center;gap:0.5rem">
                  <div class="user-avatar" style="width:30px;height:30px;font-size:0.75rem">${u.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}</div>
                  ${escapeHtml(u.name)}
                </div>
              </td>
              <td>${escapeHtml(u.email)}</td>
              <td><span class="profile-role-badge">${u.role}</span></td>
              <td>${escapeHtml(u.department || '—')}</td>
              <td>${escapeHtml(u.year || '—')}</td>
              <td>${formatDate(u.created_at)}</td>
              <td>
                <div class="table-actions">
                  <select class="chip" onchange="changeUserRole(${u.id}, this.value)" style="padding:0.3rem 0.5rem;cursor:pointer">
                    <option value="">Change Role</option>
                    <option value="student" ${u.role==='student'?'selected':''}>Student</option>
                    <option value="organizer" ${u.role==='organizer'?'selected':''}>Organizer</option>
                    <option value="admin" ${u.role==='admin'?'selected':''}>Admin</option>
                  </select>
                  ${u.id !== currentUser.id ? `<button class="btn-danger btn-sm" onclick="deleteUser(${u.id}, '${escapeHtml(u.name)}')">🗑</button>` : ''}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><h3>${err.message}</h3></div>`;
  }
}

function debounceUserSearch() {
  clearTimeout(userSearchTimer);
  userSearchTimer = setTimeout(loadUsers, 400);
}

function filterUserRole(btn, role) {
  btn.closest('.filter-chips').querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  currentUserRoleFilter = role;
  loadUsers();
}

async function changeUserRole(userId, role) {
  if (!role) return;
  if (!confirm(`Change user role to ${role}?`)) return;
  try {
    await API.users.updateRole(userId, role);
    showToast('success', 'Role Updated', `User role changed to ${role}`);
    loadUsers();
  } catch (err) {
    showToast('error', 'Error', err.message);
  }
}

async function deleteUser(userId, name) {
  if (!confirm(`Delete user "${name}"? This will also delete all their registrations.`)) return;
  try {
    await API.users.delete(userId);
    showToast('success', 'Deleted', `User ${name} deleted`);
    loadUsers();
  } catch (err) {
    showToast('error', 'Error', err.message);
  }
}

// ==================== ANALYTICS ====================

async function loadAnalytics() {
  const container = document.getElementById('analytics-content');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner">Loading analytics...</div>';

  try {
    const data = await API.analytics.overview();
    const { overview, eventsByCategory, eventsByStatus, topEvents, recentRegistrations, monthlyRegistrations, departmentParticipation } = data.data;

    container.innerHTML = `
      <!-- Overview Stats -->
      <div class="stats-grid" style="margin-bottom:2rem">
        <div class="stat-card purple">
          <div class="stat-icon">📅</div>
          <div class="stat-info">
            <span class="stat-value">${overview.totalEvents}</span>
            <span class="stat-label">Total Events</span>
          </div>
        </div>
        <div class="stat-card blue">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <span class="stat-value">${overview.totalUsers}</span>
            <span class="stat-label">Students</span>
          </div>
        </div>
        <div class="stat-card green">
          <div class="stat-icon">🎫</div>
          <div class="stat-info">
            <span class="stat-value">${overview.totalRegistrations}</span>
            <span class="stat-label">Registrations</span>
          </div>
        </div>
        <div class="stat-card orange">
          <div class="stat-icon">⭐</div>
          <div class="stat-info">
            <span class="stat-value">${overview.avgRating || '—'}</span>
            <span class="stat-label">Avg Rating</span>
          </div>
        </div>
      </div>

      <div class="analytics-grid">
        <!-- Events by Category -->
        <div class="analytics-card">
          <h3>📊 Events by Category</h3>
          <div class="chart-bar-list">
            ${eventsByCategory.map(c => {
              const max = Math.max(...eventsByCategory.map(x => x.count));
              const pct = max ? (c.count / max * 100) : 0;
              const cat = getCatConfig(c.category);
              return `<div class="chart-bar-item">
                <div class="chart-bar-label">
                  <span>${cat.emoji} ${cat.label}</span>
                  <span>${c.count}</span>
                </div>
                <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${pct}%"></div></div>
              </div>`;
            }).join('')}
          </div>
        </div>

        <!-- Events by Status -->
        <div class="analytics-card">
          <h3>📈 Events by Status</h3>
          <div class="chart-bar-list">
            ${eventsByStatus.map(s => {
              const max = Math.max(...eventsByStatus.map(x => x.count));
              const pct = max ? (s.count / max * 100) : 0;
              return `<div class="chart-bar-item">
                <div class="chart-bar-label">
                  <span><span class="event-status-pill status-${s.status}">${s.status}</span></span>
                  <span>${s.count}</span>
                </div>
                <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${pct}%"></div></div>
              </div>`;
            }).join('')}
          </div>
        </div>

        <!-- Top Events -->
        <div class="analytics-card">
          <h3>🏆 Top Events by Registrations</h3>
          <div>
            ${topEvents.map((e, i) => `
              <div class="analytics-stat-row">
                <span class="analytics-stat-label">${i+1}. ${escapeHtml(e.title)}</span>
                <span class="analytics-stat-value">${e.registrations} regs ${e.avg_rating ? `· ⭐${parseFloat(e.avg_rating).toFixed(1)}` : ''}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Department Participation -->
        <div class="analytics-card">
          <h3>🎓 Department Participation</h3>
          <div class="chart-bar-list">
            ${departmentParticipation.map(d => {
              const max = Math.max(...departmentParticipation.map(x => x.registrations));
              const pct = max ? (d.registrations / max * 100) : 0;
              return `<div class="chart-bar-item">
                <div class="chart-bar-label">
                  <span>${escapeHtml(d.department || 'Unknown')}</span>
                  <span>${d.registrations}</span>
                </div>
                <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${pct}%"></div></div>
              </div>`;
            }).join('')}
          </div>
        </div>

        <!-- Monthly Registrations -->
        <div class="analytics-card">
          <h3>📅 Monthly Registrations</h3>
          <div class="chart-bar-list">
            ${monthlyRegistrations.map(m => {
              const max = Math.max(...monthlyRegistrations.map(x => x.count));
              const pct = max ? (m.count / max * 100) : 0;
              return `<div class="chart-bar-item">
                <div class="chart-bar-label">
                  <span>${m.month}</span>
                  <span>${m.count}</span>
                </div>
                <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${pct}%"></div></div>
              </div>`;
            }).join('')}
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="analytics-card">
          <h3>🕐 Recent Registrations</h3>
          <div>
            ${recentRegistrations.map(r => `
              <div class="analytics-stat-row">
                <span class="analytics-stat-label" style="max-width:200px;overflow:hidden;text-overflow:ellipsis">
                  ${escapeHtml(r.name)} → ${escapeHtml(r.title)}
                </span>
                <span class="analytics-stat-value" style="font-size:0.75rem;color:var(--text-muted)">${formatDateTime(r.registered_at)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><h3>Failed to load analytics</h3><p>${err.message}</p></div>`;
  }
}

// ==================== REGISTRATION RECORDS LEDGER (ADMIN) ====================
let adminRegsCache = [];
let adminRegStatusFilter = 'all';

async function loadAdminRegistrations() {
  const container = document.getElementById('admin-registrations-container');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner">Loading registration records...</div>';

  try {
    const res = await API.registrations.all();
    adminRegsCache = res.data || [];
    renderAdminRegistrations();
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><h3>Failed to load records</h3><p>${err.message}</p></div>`;
  }
}

function renderAdminRegistrations() {
  const container = document.getElementById('admin-registrations-container');
  if (!container) return;

  const searchTerm = (document.getElementById('admin-reg-search')?.value || '').toLowerCase().trim();
  const eventFilter = document.getElementById('admin-reg-event-filter')?.value || 'all';

  let list = adminRegsCache.filter(r => {
    if (adminRegStatusFilter !== 'all' && r.status !== adminRegStatusFilter) return false;
    if (eventFilter !== 'all' && String(r.event_id) !== eventFilter) return false;
    if (searchTerm) {
      const matchName = (r.userName || r.attendee_name || '').toLowerCase().includes(searchTerm);
      const matchEmail = (r.email || '').toLowerCase().includes(searchTerm);
      const matchTicket = (r.ticket_id || '').toLowerCase().includes(searchTerm);
      const matchEvent = (r.title || '').toLowerCase().includes(searchTerm);
      if (!matchName && !matchEmail && !matchTicket && !matchEvent) return false;
    }
    return true;
  });

  const total = adminRegsCache.length;
  const attendedCount = adminRegsCache.filter(r => r.status === 'attended').length;
  const activeCount = adminRegsCache.filter(r => r.status === 'registered').length;
  const repeatCount = adminRegsCache.filter(r => (r.pass_number || 1) > 1).length;

  // Build unique events for filter dropdown
  const uniqueEvents = {};
  adminRegsCache.forEach(r => {
    if (r.event_id && r.title) uniqueEvents[r.event_id] = r.title;
  });

  container.innerHTML = `
    <!-- Top Summary Metric Cards -->
    <div class="stats-grid" style="margin-bottom:1.5rem">
      <div class="stat-card" style="border-left: 4px solid var(--primary)">
        <div class="stat-info">
          <span class="stat-value">${total}</span>
          <span class="stat-label">Total Passes Generated</span>
        </div>
      </div>
      <div class="stat-card" style="border-left: 4px solid #10b981">
        <div class="stat-info">
          <span class="stat-value">${attendedCount}</span>
          <span class="stat-label">Checked-In Attendees</span>
        </div>
      </div>
      <div class="stat-card" style="border-left: 4px solid #3b82f6">
        <div class="stat-info">
          <span class="stat-value">${activeCount}</span>
          <span class="stat-label">Confirmed Upcoming</span>
        </div>
      </div>
      <div class="stat-card" style="border-left: 4px solid #8b5cf6">
        <div class="stat-info">
          <span class="stat-value">${repeatCount}</span>
          <span class="stat-label">Repeat Registrations</span>
        </div>
      </div>
    </div>

    <!-- Filters & Action Toolbar -->
    <div class="filter-bar" style="margin-bottom:1.25rem;flex-wrap:wrap;gap:0.75rem;align-items:center;justify-content:space-between">
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center">
        <div class="search-box" style="min-width:260px">
          <span class="search-icon">🔍</span>
          <input type="text" id="admin-reg-search" placeholder="Search student, email, pass ID..." value="${escapeHtml(searchTerm)}" oninput="renderAdminRegistrations()" />
        </div>
        <select id="admin-reg-event-filter" class="chip" onchange="renderAdminRegistrations()" style="padding:0.5rem 0.75rem;font-size:0.875rem;border-radius:9999px">
          <option value="all">All Events (${Object.keys(uniqueEvents).length})</option>
          ${Object.entries(uniqueEvents).map(([eid, title]) => `<option value="${eid}" ${eventFilter === eid ? 'selected' : ''}>${escapeHtml(title)}</option>`).join('')}
        </select>
        <div class="filter-chips" style="margin:0">
          <button class="chip ${adminRegStatusFilter === 'all' ? 'active' : ''}" onclick="filterAdminRegStatus('all')">All (${total})</button>
          <button class="chip ${adminRegStatusFilter === 'registered' ? 'active' : ''}" onclick="filterAdminRegStatus('registered')">Active (${activeCount})</button>
          <button class="chip ${adminRegStatusFilter === 'attended' ? 'active' : ''}" onclick="filterAdminRegStatus('attended')">Checked-In (${attendedCount})</button>
        </div>
      </div>
      <div>
        <button class="btn-secondary btn-sm" onclick="exportRegistrationsCSV()" style="display:inline-flex;align-items:center;gap:0.35rem">
          📥 Export CSV
        </button>
      </div>
    </div>

    <!-- Table -->
    ${list.length === 0 ? `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <h3>No Registration Records Found</h3>
        <p>Try adjusting your search query or filter selection</p>
      </div>
    ` : `
      <div class="admin-table-wrapper" style="background:var(--card-bg);border-radius:12px;border:1px solid var(--border-color);overflow-x:auto">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Pass ID</th>
              <th>Attendee / Student</th>
              <th>Email</th>
              <th>Event</th>
              <th>Pass #</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(r => {
              const passNum = r.pass_number || 1;
              const isAttended = r.status === 'attended';
              return `
                <tr>
                  <td>
                    <span style="font-family:monospace;font-weight:700;color:var(--primary);font-size:0.85rem">${r.ticket_id || ('EH-2026-P' + r.id)}</span>
                  </td>
                  <td class="td-title">
                    <div style="font-weight:600">${escapeHtml(r.userName || r.attendee_name || 'Student')}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted)">${escapeHtml(r.department || 'Computer Science')} ${r.year ? '• ' + r.year : ''}</div>
                  </td>
                  <td style="font-size:0.85rem;color:var(--text-muted)">${escapeHtml(r.email || '—')}</td>
                  <td>
                    <div style="font-weight:500">${escapeHtml(r.title || 'Event')}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted)">${formatDate(r.date)}</div>
                  </td>
                  <td>
                    <span class="chip" style="font-size:0.75rem;padding:0.2rem 0.5rem;background:rgba(16,185,129,0.1);color:#059669;font-weight:600">
                      Pass #${passNum}
                    </span>
                  </td>
                  <td style="font-size:0.8rem;color:var(--text-muted)">${formatDateTime(r.registered_at)}</td>
                  <td>
                    <span class="event-status-pill status-${r.status}">
                      ${isAttended ? '✅ Attended' : '🎫 Registered'}
                    </span>
                  </td>
                  <td>
                    <div class="table-actions">
                      <button class="btn-secondary btn-sm" onclick="inspectPassModal('${escapeHtml(r.ticket_id || '')}', '${escapeHtml(r.title || '')}', '${escapeHtml(r.userName || r.attendee_name || '')}', '${escapeHtml(r.email || '')}', ${passNum}, '${escapeHtml(r.venue || '')}', '${escapeHtml(r.date || '')}')" title="Inspect Pass">
                        👁 Pass
                      </button>
                      <button class="${isAttended ? 'btn-secondary' : 'btn-success'} btn-sm" onclick="toggleRegStatus(${r.id})" title="Toggle Check-In">
                        ${isAttended ? 'Undo Check-In' : '✅ Check-In'}
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `}
  `;
}

function filterAdminRegStatus(status) {
  adminRegStatusFilter = status;
  renderAdminRegistrations();
}

async function toggleRegStatus(regId) {
  try {
    const res = await API.registrations.updateStatus(regId);
    showToast('success', 'Status Updated', res.message || 'Registration updated');
    // Update local cache
    const item = adminRegsCache.find(r => r.id === regId);
    if (item && res.status) {
      item.status = res.status;
    }
    renderAdminRegistrations();
  } catch (err) {
    showToast('error', 'Update Failed', err.message);
  }
}

function exportRegistrationsCSV() {
  if (!adminRegsCache.length) {
    showToast('info', 'No Records', 'There are no registration records to export');
    return;
  }
  const headers = ['Ticket_ID', 'Event_Title', 'Attendee_Name', 'Email', 'Department', 'Year', 'Pass_Number', 'Status', 'Registered_At'];
  const rows = adminRegsCache.map(r => [
    `"${r.ticket_id || ''}"`,
    `"${(r.title || '').replace(/"/g, '""')}"`,
    `"${(r.userName || r.attendee_name || '').replace(/"/g, '""')}"`,
    `"${(r.email || '').replace(/"/g, '""')}"`,
    `"${(r.department || '').replace(/"/g, '""')}"`,
    `"${(r.year || '').replace(/"/g, '""')}"`,
    r.pass_number || 1,
    r.status || 'registered',
    `"${r.registered_at || ''}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `EventHub_Registration_Records_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('success', 'Exported', 'Registration ledger downloaded as CSV');
}

function inspectPassModal(ticketId, eventTitle, attendeeName, email, passNum, venue, date) {
  const modal = document.getElementById('event-modal');
  const content = document.getElementById('event-modal-content');
  if (!modal || !content) return;

  const qrData = encodeURIComponent(`EVENTHUB|PASS|${ticketId}|${attendeeName}|${eventTitle}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrData}&color=047857`;

  content.innerHTML = `
    <div style="padding:2rem;text-align:center">
      <div style="font-size:0.8rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);font-weight:700">Official Campus Gate Pass</div>
      <h2 style="margin:0.5rem 0 1rem;font-size:1.5rem;font-weight:800;color:var(--text-primary)">${escapeHtml(eventTitle)}</h2>
      <div style="display:inline-block;padding:0.3rem 0.8rem;background:rgba(16,185,129,0.15);color:#059669;border-radius:9999px;font-weight:700;font-size:0.85rem;margin-bottom:1.5rem">
        Pass #${passNum}
      </div>
      
      <div style="background:var(--bg-secondary);border:2px dashed var(--border-color);border-radius:16px;padding:1.5rem;max-width:360px;margin:0 auto 1.5rem">
        <div style="margin-bottom:1rem;background:#fff;padding:0.75rem;border-radius:12px;display:inline-block">
          <img src="${qrUrl}" alt="Pass QR Code" style="width:160px;height:160px;display:block" />
        </div>
        <div style="font-family:monospace;font-size:1rem;font-weight:800;letter-spacing:0.05em;color:var(--primary)">${escapeHtml(ticketId)}</div>
        <div style="margin-top:0.75rem;text-align:left;font-size:0.875rem;display:flex;flex-direction:column;gap:0.35rem">
          <div><span style="color:var(--text-muted)">Attendee:</span> <strong>${escapeHtml(attendeeName)}</strong></div>
          <div><span style="color:var(--text-muted)">Email:</span> ${escapeHtml(email)}</div>
          <div><span style="color:var(--text-muted)">Venue:</span> ${escapeHtml(venue || 'Campus')}</div>
          <div><span style="color:var(--text-muted)">Date:</span> ${formatDate(date)}</div>
        </div>
      </div>

      <div style="display:flex;gap:0.75rem;justify-content:center">
        <button class="btn-primary" onclick="closeModal('event-modal')">Close</button>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
