/* ============================================
   APP - Main Application Controller
   ============================================ */

// ==================== UTILITIES ====================

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  try {
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  } catch { return timeStr; }
}

function formatDateTime(dtStr) {
  if (!dtStr) return '';
  try {
    return new Date(dtStr).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return dtStr; }
}

// ==================== TOAST ====================

function showToast(type, title, message, duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || 'ℹ️'}</div>
    <div class="toast-content">
      <div class="toast-title">${escapeHtml(title)}</div>
      ${message ? `<div class="toast-message">${escapeHtml(message)}</div>` : ''}
    </div>
    <button class="toast-close" onclick="dismissToast(this.parentElement)">✕</button>
  `;
  container.appendChild(toast);

  setTimeout(() => dismissToast(toast), duration);
  return toast;
}

function dismissToast(toast) {
  if (!toast || !toast.parentElement) return;
  toast.classList.add('exiting');
  setTimeout(() => toast.remove(), 300);
}

// ==================== MODAL ====================

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
  document.body.style.overflow = '';
}

// Close modals on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
    document.body.style.overflow = '';
  }
});

// Close modals on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => {
      m.classList.add('hidden');
      document.body.style.overflow = '';
    });
  }
});

// ==================== NAVIGATION ====================

function navigate(page) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // Show target page
  const targetPage = document.getElementById(`page-${page}`);
  if (targetPage) targetPage.classList.add('active');

  // Update nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
  document.querySelectorAll('.bottom-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });

  // Close mobile sidebar
  closeSidebar();

  // Load page data
  switch (page) {
    case 'dashboard': loadDashboard(); break;
    case 'events': loadAllEvents(); break;
    case 'my-registrations': loadMyRegistrations(); break;
    case 'notifications': loadNotifications(); break;
    case 'admin-registrations': loadAdminRegistrations(); break;
    case 'manage-events': loadAdminEvents(); break;
    case 'users': loadUsers(); break;
    case 'analytics': loadAnalytics(); break;
    case 'profile': loadProfile(); break;
  }

  // Update URL hash
  window.location.hash = page;
}

// ==================== SIDEBAR ====================

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('visible');
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('visible');
}

// ==================== INIT ====================

function initApp() {
  if (!currentUser) return;

  // Show main app
  document.getElementById('auth-overlay').classList.remove('active');
  document.getElementById('auth-overlay').style.display = 'none';
  document.getElementById('main-app').classList.remove('hidden');

  // Update sidebar
  updateSidebarUser();

  // Show/hide admin nav
  const adminNav = document.getElementById('admin-nav');
  const createEventBtnWrap = document.getElementById('create-event-btn-wrap');
  const adminOnlyEls = document.querySelectorAll('.admin-only');

  if (['admin', 'organizer'].includes(currentUser.role)) {
    adminOnlyEls.forEach(el => el.classList.remove('hidden'));
  } else {
    adminOnlyEls.forEach(el => el.classList.add('hidden'));
  }

  // Add sidebar overlay for mobile
  if (!document.getElementById('sidebar-overlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'sidebar-overlay';
    overlay.className = 'sidebar-overlay';
    overlay.onclick = closeSidebar;
    document.body.appendChild(overlay);
  }

  // Navigate to initial page
  const hash = window.location.hash.replace('#', '');
  const validPages = ['dashboard', 'events', 'my-registrations', 'notifications', 'admin-registrations', 'manage-events', 'users', 'analytics', 'profile'];
  const initPage = (hash && validPages.includes(hash)) ? hash : 'dashboard';
  navigate(initPage);

  // Start notification polling
  updateNotifBadge();
  if (window.notifInterval) clearInterval(window.notifInterval);
  window.notifInterval = setInterval(updateNotifBadge, 30000); // Poll every 30s
}

// ==================== BOOT ====================

document.addEventListener('DOMContentLoaded', () => {
  if (checkAuth()) {
    initApp();
  } else {
    document.getElementById('auth-overlay').classList.add('active');
    document.getElementById('auth-overlay').style.display = 'flex';
  }
});
