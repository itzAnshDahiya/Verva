/* =========================================================
   VERVA – auth.js  |  Login & Signup flow (Backend Integration)
   ========================================================= */
'use strict';

// Use API helpers from api.js for authentication state
const isLoggedIn = () => API.isLoggedIn();
const getSession = () => API.getUserFromToken();
const clearSession = () => {
  localStorage.removeItem('VERVA-token');
  localStorage.removeItem('VERVA-refresh-token');
  localStorage.removeItem('VERVA-user');
};

/* ---- Redirect if already logged in ---- */
if (isLoggedIn() && (location.pathname.includes('login') || location.pathname.includes('signup'))) {
  location.href = 'account.html';
}

/* ---- Login form ---- */
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm.querySelector('#login-email').value.trim();
    const pass = loginForm.querySelector('#login-password').value;
    
    try {
      showToast?.('Logging in...', 'info');
      const response = await API.Auth.login(email, pass);
      
      if (response.success) {
        showToast?.('Welcome back!', 'success');
        document.dispatchEvent(new CustomEvent('VERVA:authchanged'));
        setTimeout(() => { location.href = 'account.html'; }, 800);
      } else {
        showToast?.(response.message || 'Login failed', 'error');
      }
    } catch (error) {
      showToast?.(error.message || 'Login failed', 'error');
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
    const name = document.getElementById('signup-name')?.value.trim();
    const email = document.getElementById('signup-email')?.value.trim();
    const pass = document.getElementById('signup-password')?.value;
    
    if (!name || !email || !pass) {
      window.showToast?.('Please fill all fields', 'error');
      return;
    }
    if (pass.length < 6) {
      window.showToast?.('Password must be at least 6 characters', 'error');
      return;
    }
    goToSignupStep(2);
  });
}

const signupForm = document.getElementById('signup-form');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const pass = document.getElementById('signup-password').value;
    const phone = document.getElementById('signup-phone')?.value.trim();

    try {
      showToast?.('Creating account...', 'info');
      const response = await API.Auth.signup(name, email, pass, phone);

      if (response.success) {
        showToast?.('Account created! Welcome to VERVA!', 'success');
        document.dispatchEvent(new CustomEvent('VERVA:authchanged'));
        setTimeout(() => { location.href = 'account.html'; }, 900);
      } else {
        showToast?.(response.message || 'Signup failed', 'error');
      }
    } catch (error) {
      showToast?.(error.message || 'Signup failed', 'error');
    }
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
