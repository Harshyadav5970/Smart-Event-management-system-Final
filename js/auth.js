/* ============================================
   AUTH - Login, Register, Session Management
   ============================================ */

let currentUser = null;

function showAuthTab(tab) {
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');
  const tabs = document.querySelectorAll('.tab-btn');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    regForm.classList.add('hidden');
    tabs[0].classList.add('active');
    tabs[1].classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    regForm.classList.remove('hidden');
    tabs[0].classList.remove('active');
    tabs[1].classList.add('active');
  }
}

function fillDemo(email, pw) {
  document.getElementById('login-email').value = email;
  document.getElementById('login-password').value = pw;
  showAuthTab('login');
}

function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
}

async function handleLogin(e) {
  if (e) e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');

  errEl.classList.add('hidden');
  errEl.textContent = '';
  setButtonLoading(btn, true);

  try {
    const data = await API.auth.login({ email, password });
    if (data.success) {
      localStorage.setItem('eventhub_token', data.token);
      localStorage.setItem('eventhub_user', JSON.stringify(data.user));
      currentUser = data.user;
      initApp();
      showToast('success', 'Welcome back!', `Logged in as ${data.user.name}`);
    }
  } catch (err) {
    errEl.textContent = err.message || 'Login failed. Please check credentials.';
    errEl.classList.remove('hidden');
  } finally {
    setButtonLoading(btn, false);
  }
}

async function handleRegister(e) {
  if (e) e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;
  const dept = document.getElementById('reg-dept').value;
  const year = document.getElementById('reg-year').value;
  const phone = document.getElementById('reg-phone').value.trim();
  const errEl = document.getElementById('reg-error');
  const btn = document.getElementById('reg-btn');

  errEl.classList.add('hidden');
  errEl.textContent = '';

  if (!name || !email || !password) {
    errEl.textContent = 'Name, email, and password are required.';
    errEl.classList.remove('hidden');
    return;
  }

  if (password.length < 6) {
    errEl.textContent = 'Password must be at least 6 characters long.';
    errEl.classList.remove('hidden');
    return;
  }

  if (password !== confirm) {
    errEl.textContent = 'Passwords do not match!';
    errEl.classList.remove('hidden');
    return;
  }

  setButtonLoading(btn, true);

  try {
    const data = await API.auth.register({ name, email, password, department: dept, year, phone });
    if (data.success) {
      localStorage.setItem('eventhub_token', data.token);
      localStorage.setItem('eventhub_user', JSON.stringify(data.user));
      currentUser = data.user;
      initApp();
      showToast('success', 'Account Created!', `Welcome to EventHub, ${data.user.name}!`);
    }
  } catch (err) {
    errEl.textContent = err.message || 'Registration failed. Please try again.';
    errEl.classList.remove('hidden');
  } finally {
    setButtonLoading(btn, false);
  }
}

function handleLogout(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // Clear notification interval
  if (window.notifInterval) {
    clearInterval(window.notifInterval);
    window.notifInterval = null;
  }

  // Close any open modals
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
  document.body.style.overflow = '';

  // Clear user session
  localStorage.removeItem('eventhub_token');
  localStorage.removeItem('eventhub_user');
  currentUser = null;

  // Reset hash in address bar
  try {
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname);
    }
  } catch (err) {}

  // Hide main app
  const mainApp = document.getElementById('main-app');
  if (mainApp) mainApp.classList.add('hidden');

  // Show auth overlay
  const overlay = document.getElementById('auth-overlay');
  if (overlay) {
    overlay.style.display = 'flex';
    overlay.classList.add('active');
  }

  // Reset login & register forms
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');
  if (loginForm) loginForm.reset();
  if (regForm) regForm.reset();
  
  const loginErr = document.getElementById('login-error');
  const regErr = document.getElementById('reg-error');
  if (loginErr) { loginErr.textContent = ''; loginErr.classList.add('hidden'); }
  if (regErr) { regErr.textContent = ''; regErr.classList.add('hidden'); }

  showAuthTab('login');
  showToast('info', 'Logged Out', 'You have been successfully logged out.');
}

function checkAuth() {
  const token = localStorage.getItem('eventhub_token');
  const user = localStorage.getItem('eventhub_user');
  if (token && user) {
    try {
      currentUser = JSON.parse(user);
      return true;
    } catch (e) { return false; }
  }
  return false;
}

function setButtonLoading(btn, loading) {
  if (!btn) return;
  const text = btn.querySelector('.btn-text');
  const loader = btn.querySelector('.btn-loader');
  btn.disabled = loading;
  if (text) text.style.display = loading ? 'none' : '';
  if (loader) loader.classList.toggle('hidden', !loading);
}

function updateSidebarUser() {
  if (!currentUser) return;
  const nameEl = document.getElementById('sidebar-name');
  const roleEl = document.getElementById('sidebar-role');
  const avatarEl = document.getElementById('sidebar-avatar');
  const mobAvatar = document.getElementById('mobile-user-avatar');
  const deskName = document.getElementById('desktop-user-name');
  const deskAvatar = document.getElementById('desktop-user-avatar');

  if (nameEl) nameEl.textContent = currentUser.name;
  if (roleEl) roleEl.textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
  const initials = currentUser.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  if (avatarEl) avatarEl.textContent = initials;
  if (mobAvatar) mobAvatar.textContent = initials;
  if (deskAvatar) deskAvatar.textContent = initials;
  if (deskName) {
    const dept = currentUser.department ? ` · ${currentUser.department.split(' ')[0]}` : '';
    deskName.textContent = `${currentUser.name}${dept}`;
  }
}

// Attach globally for inline event handlers
window.handleLogout = handleLogout;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.showAuthTab = showAuthTab;
window.fillDemo = fillDemo;
window.togglePassword = togglePassword;
