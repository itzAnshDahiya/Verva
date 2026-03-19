/* =========================================================
   WEAVE – auth.js  |  Login & Signup flow
   ========================================================= */
'use strict';

/* ---- Fake user store ---- */
function getUsers() {
  try { return JSON.parse(localStorage.getItem('weave-users')) || []; }
  catch { return []; }
}
function saveUsers(users) {
  localStorage.setItem('weave-users', JSON.stringify(users));
}
function getSession() {
  try { return JSON.parse(localStorage.getItem('weave-session')); }
  catch { return null; }
}
function setSession(user) {
  localStorage.setItem('weave-session', JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem('weave-session');
}
function isLoggedIn() { return !!getSession(); }

/* ---- Redirect if already logged in ---- */
if (isLoggedIn() && (location.pathname.includes('login') || location.pathname.includes('signup'))) {
  location.href = 'account.html';
}

/* ---- Login form ---- */
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = loginForm.querySelector('#login-email').value.trim();
    const pass  = loginForm.querySelector('#login-password').value;
    const users = getUsers();
    const user  = users.find(u => u.email === email && u.password === pass);
    if (user) {
      setSession({ name: user.name, email: user.email });
      showToast?.('Welcome back, ' + user.name.split(' ')[0] + '!', 'success');
      setTimeout(() => { location.href = 'account.html'; }, 800);
    } else {
      showToast?.('Invalid email or password', 'error');
      loginForm.querySelector('#login-email').focus();
    }
  });
}

/* ---- Signup multi-step ---- */
let signupStep = 1;
const TOTAL_STEPS = 2;

function updateStepDots() {
  document.querySelectorAll('.signup-step-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i + 1 === signupStep);
  });
}
function goToSignupStep(step) {
  document.querySelectorAll('.signup-form-step').forEach((el, i) => {
    el.style.display = i + 1 === step ? 'block' : 'none';
  });
  signupStep = step;
  updateStepDots();
}

const stepNextBtn = document.getElementById('signup-next');
if (stepNextBtn) {
  stepNextBtn.addEventListener('click', () => {
    const name  = document.getElementById('signup-name')?.value.trim();
    const email = document.getElementById('signup-email')?.value.trim();
    const pass  = document.getElementById('signup-password')?.value;
    if (!name || !email || !pass) {
      window.showToast?.('Please fill all fields', 'error'); return;
    }
    if (pass.length < 6) {
      window.showToast?.('Password must be at least 6 characters', 'error'); return;
    }
    goToSignupStep(2);
  });
}

const signupForm = document.getElementById('signup-form');
if (signupForm) {
  signupForm.addEventListener('submit', e => {
    e.preventDefault();
    const name  = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const pass  = document.getElementById('signup-password').value;
    const users = getUsers();
    if (users.find(u => u.email === email)) {
      window.showToast?.('Email already registered', 'error'); return;
    }
    users.push({ name, email, password: pass, createdAt: Date.now() });
    saveUsers(users);
    setSession({ name, email });
    window.showToast?.('Account created! Welcome, ' + name.split(' ')[0] + '!', 'success');
    setTimeout(() => { location.href = 'account.html'; }, 900);
  });
}

/* ---- Account page ---- */
const session = getSession();
if (session) {
  document.querySelectorAll('.user-name').forEach(el => el.textContent = session.name);
  document.querySelectorAll('.user-email').forEach(el => el.textContent = session.email);
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    clearSession();
    window.showToast?.('Logged out successfully', 'success');
    setTimeout(() => { location.href = 'index.html'; }, 800);
  });
}

/* ---- Update header avatar ---- */
const headerAvatar = document.getElementById('header-avatar-btn');
if (headerAvatar && session) {
  headerAvatar.innerHTML = `<span style="width:32px;height:32px;border-radius:50%;background:var(--cta);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.75rem;">${session.name[0]}</span>`;
}

window.Auth = { isLoggedIn, getSession, clearSession };
