/* =========================================================
   WEAVE – product.js  |  Gallery · Tabs · Compare · Wishlist
   ========================================================= */
'use strict';

/* ---- Gallery ---- */
const mainImg  = document.getElementById('main-product-img');
const thumbs   = document.querySelectorAll('.thumb');
thumbs.forEach(thumb => {
  thumb.addEventListener('click', () => {
    thumbs.forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
    if (mainImg) {
      mainImg.style.opacity = '0';
      mainImg.style.transform = 'scale(0.97)';
      setTimeout(() => {
        mainImg.src = thumb.querySelector('img').src;
        mainImg.style.opacity = '1';
        mainImg.style.transform = 'scale(1)';
      }, 200);
      mainImg.style.transition = 'opacity .2s ease, transform .2s ease';
    }
  });
});

/* ---- Size buttons ---- */
document.querySelectorAll('.size-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

/* ---- Color swatches ---- */
document.querySelectorAll('.color-swatch').forEach(sw => {
  sw.addEventListener('click', () => {
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    sw.classList.add('active');
  });
});

/* ---- Sticky product nav ---- */
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
  }, { threshold: 0.4 });
  productSections.forEach(s => io.observe(s));
}

/* ---- Wishlist ---- */
function getWishlist() {
  try { return JSON.parse(localStorage.getItem('weave-wishlist')) || []; } catch { return []; }
}
function saveWishlist(list) {
  localStorage.setItem('weave-wishlist', JSON.stringify(list));
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

/* Initialize heart icons */
document.querySelectorAll('[data-wishlist]').forEach(btn => {
  const icon = btn.querySelector('i');
  if (icon && isWishlisted(btn.dataset.wishlist)) {
    icon.className = 'fas fa-heart';
    icon.style.color = 'var(--cta)';
  }
});

/* ---- Compare drawer ---- */
let compareList = [];
const compareDrawer = document.getElementById('compare-drawer');
const compareClose  = document.getElementById('compare-close');
if (compareClose) compareClose.addEventListener('click', () => {
  compareDrawer.classList.remove('open');
});
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-compare]');
  if (!btn) return;
  const id   = btn.dataset.compare;
  const name = btn.dataset.name || 'Product';
  if (!compareList.includes(id)) {
    if (compareList.length >= 3) {
      window.showToast?.('You can compare up to 3 products', 'error'); return;
    }
    compareList.push(id);
    window.showToast?.(`${name} added to compare`);
  } else {
    compareList = compareList.filter(i => i !== id);
    window.showToast?.(`${name} removed from compare`);
  }
  if (compareDrawer && compareList.length > 0) compareDrawer.classList.add('open');
  else if (compareDrawer) compareDrawer.classList.remove('open');
});

window.WeaveProd = { toggleWishlist, isWishlisted, getWishlist };
