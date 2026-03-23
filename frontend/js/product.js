/* =========================================================
   VERVA – product.js  |  Gallery · Wishlist · Compare · Qty
   ========================================================= */
'use strict';

/* ---- Wishlist helpers (shared across ALL pages) ---- */
function getWishlist() {
  try { return JSON.parse(localStorage.getItem('VERVA-wishlist')) || []; } catch { return []; }
}
function saveWishlist(list) {
  localStorage.setItem('VERVA-wishlist', JSON.stringify(list));
}
function isWishlisted(id) {
  return getWishlist().includes(String(id));
}
function toggleWishlist(id, name) {
  let list = getWishlist();
  if (list.includes(String(id))) {
    list = list.filter(i => i !== String(id));
    window.showToast?.(`${name} removed from wishlist`);
  } else {
    list.push(String(id));
    window.showToast?.(`${name} added to wishlist ♥`, 'success');
  }
  saveWishlist(list);
  updateWishlistBadge();
  return isWishlisted(id);
}
function updateWishlistBadge() {
  const count = getWishlist().length;
  document.querySelectorAll('.wishlist-badge').forEach(el => {
    el.textContent = count;
    el.style.display = count === 0 ? 'none' : 'flex';
  });
}
updateWishlistBadge();

/* ---- Delegated wishlist click ---- */
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-wishlist]');
  if (!btn) return;
  const id   = btn.dataset.wishlist;
  const name = btn.dataset.name || 'Product';
  const icon = btn.querySelector('i');
  const active = toggleWishlist(id, name);
  if (icon) {
    icon.className = active ? 'fas fa-heart' : 'far fa-heart';
    icon.style.color = active ? 'var(--cta)' : '';
  }
});

/* ---- Init heart icons from localStorage ---- */
document.querySelectorAll('[data-wishlist]').forEach(btn => {
  const icon = btn.querySelector('i');
  if (icon && isWishlisted(btn.dataset.wishlist)) {
    icon.className = 'fas fa-heart';
    icon.style.color = 'var(--cta)';
  }
});

/* =========================================================
   Product detail page specific code (only runs if elements exist)
   ========================================================= */

/* ---- Gallery ---- */
const mainImg = document.getElementById('main-product-img');
const thumbs  = document.querySelectorAll('.thumb');
thumbs.forEach(thumb => {
  thumb.addEventListener('click', () => {
    thumbs.forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
    if (mainImg) {
      mainImg.style.transition = 'opacity .2s ease, transform .2s ease';
      mainImg.style.opacity = '0';
      mainImg.style.transform = 'scale(0.97)';
      setTimeout(() => {
        mainImg.src = thumb.querySelector('img').src;
        mainImg.style.opacity = '1';
        mainImg.style.transform = 'scale(1)';
      }, 200);
    }
  });
});

/* ---- Size buttons – also update the add-to-cart variant ---- */
document.querySelectorAll('.size-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // Propagate selected size to all add-to-cart buttons on the page
    const size = btn.dataset.size || btn.textContent.trim();
    document.querySelectorAll('[data-add-cart]').forEach(b => {
      b.dataset.variant = size;
    });
  });
});

/* ---- Color swatches – update label + add-to-cart variant ---- */
document.querySelectorAll('.color-swatch').forEach(sw => {
  sw.addEventListener('click', () => {
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    sw.classList.add('active');
    const label = document.getElementById('color-label');
    if (label) label.textContent = sw.dataset.color || '';
  });
});

/* ---- Quantity stepper – updates the data-qty on add-to-cart buttons ---- */
let currentQty = 1;
const qtyPlus  = document.getElementById('qty-plus');
const qtyMinus = document.getElementById('qty-minus');
const qtyVal   = document.getElementById('qty-val');

function setQty(n) {
  currentQty = Math.min(10, Math.max(1, n));
  if (qtyVal) qtyVal.textContent = currentQty;
  // Sync qty into every [data-add-cart] button on page
  document.querySelectorAll('[data-add-cart]').forEach(b => {
    b.dataset.qty = currentQty;
  });
}
qtyPlus  && qtyPlus.addEventListener ('click', () => setQty(currentQty + 1));
qtyMinus && qtyMinus.addEventListener('click', () => setQty(currentQty - 1));

/* ---- Sticky product nav highlight ---- */
const productSections = document.querySelectorAll('[data-section]');
const stickyNavLinks  = document.querySelectorAll('.sticky-product-nav a');
if (productSections.length) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.dataset.section;
        stickyNavLinks.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { threshold: 0.35, rootMargin: '-72px 0px 0px 0px' });
  productSections.forEach(s => io.observe(s));
}

/* ---- Compare drawer ---- */
let compareList = [];
const compareDrawer = document.getElementById('compare-drawer');
const compareClose  = document.getElementById('compare-close');
if (compareClose && compareDrawer) {
  compareClose.addEventListener('click', () => compareDrawer.classList.remove('open'));
}
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-compare]');
  if (!btn) return;
  const id   = btn.dataset.compare;
  const name = btn.dataset.name || 'Product';
  if (!compareList.includes(id)) {
    if (compareList.length >= 3) { window.showToast?.('Compare up to 3 products', 'error'); return; }
    compareList.push(id);
    window.showToast?.(`${name} added to compare`);
  } else {
    compareList = compareList.filter(i => i !== id);
    window.showToast?.(`${name} removed from compare`);
  }
  if (compareDrawer) compareDrawer.classList.toggle('open', compareList.length > 0);
});

/* ---- Public API (accessible on wishlist.html too) ---- */
window.VERVAProd = { toggleWishlist, isWishlisted, getWishlist, updateWishlistBadge };
// Alias used by wishlist.html which referenced WeaveProd before rename
window.WeaveProd = window.VERVAProd;
