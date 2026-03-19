/* =========================================================
   VERVA – main.js  |  Navigation · Theme · Scroll · Misc
   ========================================================= */

'use strict';

/* ---- State ---- */
const STATE = {
  theme: localStorage.getItem('VERVA-theme') || 'light',
  menuOpen: false,
};

/* ---- Helpers ---- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const emit = (name, detail = {}) => document.dispatchEvent(new CustomEvent(name, { detail }));

/* ---- Theme ---- */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('VERVA-theme', theme);
  STATE.theme = theme;
}
function toggleTheme() {
  applyTheme(STATE.theme === 'light' ? 'dark' : 'light');
}
applyTheme(STATE.theme);

/* ---- Header ---- */
const header = $('#site-header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

/* ---- Mark active nav item ---- */
function markActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  $$('.header-nav a').forEach(a => {
    const href = a.getAttribute('href');
    a.classList.toggle('active', href === path || (path === '' && href === 'index.html'));
  });
}
markActiveNav();

/* ---- Mobile menu ---- */
const hamburger = $('#hamburger');
const mobileNav = $('#mobile-nav');
if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    STATE.menuOpen = !STATE.menuOpen;
    hamburger.classList.toggle('open', STATE.menuOpen);
    mobileNav.classList.toggle('open', STATE.menuOpen);
    document.body.style.overflow = STATE.menuOpen ? 'hidden' : '';
  });
  mobileNav.addEventListener('click', e => {
    if (e.target.tagName === 'A') {
      STATE.menuOpen = false;
      hamburger.classList.remove('open');
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

/* ---- Theme toggle ---- */
const themeToggle = $('#theme-toggle');
if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

/* ---- Search overlay ---- */
const searchOverlay = $('#search-overlay');
const searchClose = $('#search-close');
const searchBtn = $('#search-btn');
if (searchBtn && searchOverlay) {
  searchBtn.addEventListener('click', () => {
    searchOverlay.classList.add('active');
    const inp = searchOverlay.querySelector('input');
    if (inp) setTimeout(() => inp.focus(), 100);
  });
}
if (searchClose && searchOverlay) {
  searchClose.addEventListener('click', () => searchOverlay.classList.remove('active'));
}
if (searchOverlay) {
  searchOverlay.addEventListener('keydown', e => {
    if (e.key === 'Escape') searchOverlay.classList.remove('active');
  });
}

/* ---- Mini Cart ---- */
const miniCart = $('#mini-cart');
const cartOverlay = $('#cart-overlay');
const cartBtn = $('#cart-btn');
const cartClose = $('#cart-close');

function openCart() {
  if (!miniCart) return;
  miniCart.classList.add('open');
  if (cartOverlay) cartOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  if (!miniCart) return;
  miniCart.classList.remove('open');
  if (cartOverlay) cartOverlay.classList.remove('active');
  document.body.style.overflow = '';
}
if (cartBtn) cartBtn.addEventListener('click', openCart);
if (cartClose) cartClose.addEventListener('click', closeCart);
if (cartOverlay) cartOverlay.addEventListener('click', closeCart);
document.addEventListener('VERVA:opencart', openCart);

/* ---- Scroll animations ---- */
function initScrollAnimations(root = document) {
  const animEls = [...root.querySelectorAll('.anim-fade, .anim-left, .anim-right, .anim-scale')];
  if (!animEls.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('anim-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px 0px 0px' });

  animEls.forEach((el, i) => {
    // Elements already visible on page load → show immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.style.transitionDelay = `${(i % 6) * 0.06}s`;
      setTimeout(() => el.classList.add('anim-in'), i * 40);
    } else {
      el.style.transitionDelay = `0s`;
      observer.observe(el);
    }
  });
}
initScrollAnimations();
window.initScrollAnimations = initScrollAnimations; // exposed for shop.js dynamic cards

/* ---- Magnetic buttons ---- */
$$('.magnetic').forEach(el => {
  el.addEventListener('mousemove', e => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * 0.25;
    const y = (e.clientY - r.top - r.height / 2) * 0.25;
    el.style.transform = `translate(${x}px, ${y}px)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = '';
  });
});

/* ---- Accordion ---- */
$$('.accordion-header').forEach(header => {
  header.addEventListener('click', () => {
    const item = header.closest('.accordion-item');
    const isOpen = item.classList.contains('open');
    // Close all in same group
    const group = item.closest('.accordion-group');
    if (group) {
      $$('.accordion-item', group).forEach(i => i.classList.remove('open'));
    }
    if (!isOpen) item.classList.add('open');
  });
});

/* ---- Toast ---- */
function showToast(message, type = 'success') {
  let container = $('#toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-xmark';
  toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}
window.showToast = showToast;

/* ---- Smooth scroll for anchor links ---- */
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  if (id === '#') return;
  const target = $(id);
  if (target) {
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

/* ---- Parallax hero bg word ---- */
const bgWord = $('.hero-bg-word');
if (bgWord) {
  window.addEventListener('scroll', () => {
    const y = window.scrollY * 0.2;
    bgWord.style.transform = `translate(-50%, calc(-50% + ${y}px))`;
  }, { passive: true });
}

/* ---- Expose helpers ---- */
window.VERVAMain = { showToast, openCart, closeCart, toggleTheme };
