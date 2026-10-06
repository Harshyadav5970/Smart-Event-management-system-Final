/* ============================================
   PROFILE - User Profile Management
   ============================================ */

async function loadProfile() {
  const container = document.getElementById('profile-content');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner">Loading...</div>';

  try {
    const [profileData, regsData] = await Promise.all([
      API.users.profile(),
      API.registrations.my()
    ]);

    const user = profileData.data;
    const regs = regsData.data;
    const attended = regs.filter(r => r.status === 'attended').length;
    const upcoming = regs.filter(r => r.status === 'registered').length;
    const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    container.innerHTML = `
      <div class="profile-layout">
        <!-- Profile Card -->
        <div>
          <div class="profile-card">
            <div class="profile-avatar">${initials}</div>
            <div class="profile-name">${escapeHtml(user.name)}</div>
            <div class="profile-email">${escapeHtml(user.email)}</div>
            <span class="profile-role-badge">${user.role}</span>
            ${user.department ? `<div style="font-size:0.85rem;color:var(--text-secondary)">${escapeHtml(user.department)}</div>` : ''}
            ${user.year ? `<div style="font-size:0.8rem;color:var(--text-muted)">${escapeHtml(user.year)}</div>` : ''}
            <div class="profile-stats">
              <div class="profile-stat">
                <span class="profile-stat-value">${regs.length}</span>
                <span class="profile-stat-label">Registered</span>
              </div>
              <div class="profile-stat">
                <span class="profile-stat-value">${attended}</span>
                <span class="profile-stat-label">Attended</span>
              </div>
              <div class="profile-stat">
                <span class="profile-stat-value">${upcoming}</span>
                <span class="profile-stat-label">Upcoming</span>
              </div>
            </div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.5rem">
              Member since ${formatDate(user.created_at)}
            </div>
          </div>
        </div>

        <!-- Edit Profile Form -->
        <div>
          <div class="profile-form-card" style="margin-bottom:1rem">
            <h3>✏️ Edit Profile</h3>
            <form onsubmit="handleProfileUpdate(event)" style="display:flex;flex-direction:column;gap:1rem">
              <div class="form-row">
                <div class="form-group">
                  <label>Full Name</label>
                  <input type="text" id="profile-name" value="${escapeHtml(user.name)}" required />
                </div>
                <div class="form-group">
                  <label>Phone</label>
                  <input type="tel" id="profile-phone" value="${escapeHtml(user.phone || '')}" placeholder="+91 XXXXX XXXXX" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Department</label>
                  <select id="profile-dept">
                    <option value="">Select Department</option>
                    ${['Computer Science','Electronics','Mechanical','Civil','Chemical','Information Technology','MBA','Other'].map(d =>
                      `<option ${user.department === d ? 'selected' : ''}>${d}</option>`
                    ).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label>Year</label>
                  <select id="profile-year">
                    <option value="">Select Year</option>
                    ${['1st Year','2nd Year','3rd Year','4th Year','PG 1st Year','PG 2nd Year'].map(y =>
                      `<option ${user.year === y ? 'selected' : ''}>${y}</option>`
                    ).join('')}
                  </select>
                </div>
              </div>
              <button type="submit" class="btn-primary" style="align-self:flex-start">Save Changes</button>
            </form>
          </div>

          <div class="profile-form-card">
            <h3>🔒 Change Password</h3>
            <form onsubmit="handleChangePassword(event)" style="display:flex;flex-direction:column;gap:1rem">
              <div class="form-group">
                <label>Current Password</label>
                <input type="password" id="curr-pw" placeholder="••••••••" required />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>New Password</label>
                  <input type="password" id="new-pw" placeholder="Min. 6 characters" required />
                </div>
                <div class="form-group">
                  <label>Confirm New Password</label>
                  <input type="password" id="confirm-pw" placeholder="Repeat new password" required />
                </div>
              </div>
              <button type="submit" class="btn-secondary" style="align-self:flex-start">Update Password</button>
            </form>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><h3>Failed to load profile</h3><p>${err.message}</p></div>`;
  }
}

async function handleProfileUpdate(e) {
  e.preventDefault();
  const name = document.getElementById('profile-name').value.trim();
  const phone = document.getElementById('profile-phone').value.trim();
  const department = document.getElementById('profile-dept').value;
  const year = document.getElementById('profile-year').value;

  try {
    const data = await API.users.updateProfile({ name, phone, department, year });
    // Update local storage
    currentUser = { ...currentUser, ...data.data };
    localStorage.setItem('eventhub_user', JSON.stringify(currentUser));
    updateSidebarUser();
    showToast('success', 'Profile Updated!', 'Your changes have been saved');
    loadProfile();
  } catch (err) {
    showToast('error', 'Error', err.message);
  }
}

async function handleChangePassword(e) {
  e.preventDefault();
  const curr = document.getElementById('curr-pw').value;
  const newPw = document.getElementById('new-pw').value;
  const confirm = document.getElementById('confirm-pw').value;

  if (newPw !== confirm) {
    showToast('warning', 'Mismatch', 'New passwords do not match');
    return;
  }

  try {
    await API.auth.changePassword({ currentPassword: curr, newPassword: newPw });
    showToast('success', 'Password Changed!', 'Your password has been updated');
    document.getElementById('curr-pw').value = '';
    document.getElementById('new-pw').value = '';
    document.getElementById('confirm-pw').value = '';
  } catch (err) {
    showToast('error', 'Error', err.message);
  }
}
