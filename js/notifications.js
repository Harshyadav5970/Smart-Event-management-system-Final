/* ============================================
   NOTIFICATIONS
   ============================================ */

async function loadNotifications() {
  const container = document.getElementById('notifications-list');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner">Loading...</div>';

  try {
    const data = await API.notifications.list({ limit: 50 });
    const notifs = data.data;

    if (!notifs.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔔</div>
          <h3>All Caught Up!</h3>
          <p>No notifications yet</p>
        </div>
      `;
      return;
    }

    container.innerHTML = notifs.map(n => {
      const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌', event: '🎉' };
      const icon = icons[n.type] || '🔔';
      return `
        <div class="notif-card ${!n.is_read ? 'unread' : ''}" onclick="readNotif(${n.id}, this)">
          <div class="notif-icon">${icon}</div>
          <div class="notif-content">
            <div class="notif-title">${escapeHtml(n.title)}</div>
            <div class="notif-message">${escapeHtml(n.message)}</div>
            <div class="notif-time">${formatDateTime(n.created_at)}</div>
          </div>
          ${!n.is_read ? '<div class="notif-unread-dot"></div>' : ''}
          <button class="btn-icon" style="background:none;border:none;color:var(--text-muted);cursor:pointer" onclick="deleteNotif(event,${n.id}, this)">✕</button>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><h3>${err.message}</h3></div>`;
  }
}

async function readNotif(id, cardEl) {
  try {
    await API.notifications.markRead(id);
    cardEl.classList.remove('unread');
    const dot = cardEl.querySelector('.notif-unread-dot');
    if (dot) dot.remove();
    updateNotifBadge();
  } catch (err) {}
}

async function deleteNotif(e, id, btnEl) {
  e.stopPropagation();
  const card = btnEl.closest('.notif-card');
  try {
    await API.notifications.delete(id);
    card.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => card.remove(), 300);
    updateNotifBadge();
  } catch (err) {}
}

async function markAllRead() {
  try {
    await API.notifications.markAllRead();
    showToast('success', 'Done!', 'All notifications marked as read');
    loadNotifications();
    updateNotifBadge();
  } catch (err) {
    showToast('error', 'Error', err.message);
  }
}

async function updateNotifBadge() {
  try {
    const data = await API.notifications.list({ unread_only: 'true', limit: 1 });
    const count = data.unreadCount;
    const badge = document.getElementById('notif-badge');
    const mobileBadge = document.getElementById('mobile-notif-count');
    const bottomBadge = document.getElementById('bottom-notif-badge');

    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline' : 'none';
    }
    if (mobileBadge) {
      mobileBadge.textContent = count > 0 ? count : '';
    }
    if (bottomBadge) {
      bottomBadge.textContent = count;
      bottomBadge.style.display = count > 0 ? 'inline-block' : 'none';
    }
  } catch (err) {}
}
