/* =========================================================
   VERVA – cart.js  |  Cart state, mini-cart UI, persistence
   ========================================================= */

'use strict';

/* ---- Persistence ---- */
function loadCart() {
  try { return JSON.parse(localStorage.getItem('VERVA-cart')) || []; }
  catch { return []; }
}
function saveCart(c) {
  localStorage.setItem('VERVA-cart', JSON.stringify(c));
}

/* ---- Cart State ---- */
let cart = loadCart();

/* ---- Helpers ---- */
const fmt = n => '₹' + n.toLocaleString('en-IN');

function findItem(id, variant) {
  return cart.find(i => i.id === id && i.variant === variant);
}

/* ---- Core operations ---- */
function addToCart(product) {
  const existing = findItem(product.id, product.variant);
  if (existing) {
    existing.qty += (product.qty || 1);
  } else {
    cart.push({ ...product, qty: product.qty || 1 });
  }
  saveCart(cart);
  renderMiniCart();
  updateCartBadge();
  refreshCartPageSummary();
  document.dispatchEvent(new CustomEvent('VERVA:cartupdate', { detail: { cart } }));
  window.showToast?.(`${product.name} added to cart`, 'success');
  document.dispatchEvent(new CustomEvent('VERVA:opencart'));
}

function removeFromCart(id, variant) {
  cart = cart.filter(i => !(i.id === id && i.variant === variant));
  saveCart(cart);
  renderMiniCart();
  updateCartBadge();
  refreshCartPageSummary();
}

function updateQty(id, variant, delta) {
  const item = findItem(id, variant);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart(cart);
  renderMiniCart();
  updateCartBadge();
  refreshCartPageSummary();
}

function cartTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}
function cartGst() {
  return Math.round(cartTotal() * 0.18);
}
function cartCount() {
  return cart.reduce((sum, i) => sum + i.qty, 0);
}

/* ---- Badge ---- */
function updateCartBadge() {
  const count = cartCount();
  document.querySelectorAll('.cart-count-badge').forEach(el => {
    el.textContent = count;
    el.style.display = count === 0 ? 'none' : 'flex';
  });
}

/* ---- Mini cart render ---- */
function renderMiniCart() {
  const body    = document.getElementById('mini-cart-body');
  const totalEl = document.getElementById('mini-cart-total');
  const grandEl = document.getElementById('mini-cart-grand');
  const countEl = document.getElementById('mini-cart-count');
  if (!body) return;

  const total = cartTotal();
  countEl && (countEl.textContent = `(${cartCount()} item${cartCount() !== 1 ? 's' : ''})`);
  totalEl && (totalEl.textContent = fmt(total));
  grandEl && (grandEl.textContent = fmt(total));   // free shipping so grand = subtotal

  if (cart.length === 0) {
    body.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60%;gap:1rem;text-align:center;color:var(--text-muted)">
        <i class="fas fa-bag-shopping" style="font-size:3rem;opacity:.2;"></i>
        <p style="font-size:.9rem;">Your cart is empty</p>
        <a href="shop.html" class="btn btn-primary btn-sm">Shop Now</a>
      </div>`;
    return;
  }

  body.innerHTML = cart.map(item => `
    <div class="mini-cart-item">
      <img class="mini-cart-img" src="${item.image}" alt="${item.name}" loading="lazy">
      <div class="mini-cart-info">
        <div class="mini-cart-name">${item.name}</div>
        <div class="mini-cart-variant">${item.variant || ''}</div>
        <div class="mini-cart-price">${fmt(item.price)} × ${item.qty}</div>
        <div class="qty-stepper">
          <button onclick="Cart.updateQty('${item.id}','${item.variant}',-1)" aria-label="Decrease">−</button>
          <span>${item.qty}</span>
          <button onclick="Cart.updateQty('${item.id}','${item.variant}',1)" aria-label="Increase">+</button>
        </div>
      </div>
      <button class="remove-item" onclick="Cart.remove('${item.id}','${item.variant}')" aria-label="Remove">
        <i class="fas fa-xmark"></i>
      </button>
    </div>
  `).join('');
}

/* ---- Cart page summary ---- */
function refreshCartPageSummary() {
  const subtotalEl = document.getElementById('page-cart-subtotal');
  const gstEl      = document.getElementById('page-cart-gst');
  const totalEl    = document.getElementById('page-cart-total');
  const countEl    = document.getElementById('page-cart-item-count');
  if (!subtotalEl) return;   // not on cart page

  const sub = cartTotal();
  const gst = cartGst();
  countEl   && (countEl.textContent   = `${cartCount()} item${cartCount() !== 1 ? 's' : ''}`);
  subtotalEl && (subtotalEl.textContent = fmt(sub));
  gstEl      && (gstEl.textContent      = fmt(gst));
  totalEl    && (totalEl.textContent    = fmt(sub + gst));
}

/* ---- Cart page list render ---- */
function renderCartPage() {
  const list = document.getElementById('cart-page-list');
  if (!list) return;
  refreshCartPageSummary();

  if (cart.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;padding:4rem;color:var(--text-muted)">
        <i class="fas fa-bag-shopping" style="font-size:4rem;opacity:.2;margin-bottom:1.5rem;display:block;"></i>
        <h3>Your cart is empty</h3>
        <p style="margin:1rem 0 2rem;">Add some products and they'll show up here.</p>
        <a href="shop.html" class="btn btn-primary">Browse Shop</a>
      </div>`;
    return;
  }

  list.innerHTML = cart.map(item => `
    <div class="cart-page-item">
      <img class="cart-page-img" src="${item.image}" alt="${item.name}" loading="lazy">
      <div class="cart-page-info">
        <div class="cart-page-name">${item.name}</div>
        <div class="cart-page-variant" style="color:var(--text-muted);font-size:.8rem;margin-bottom:.4rem;">${item.variant || ''}</div>
        <div class="qty-stepper" style="margin-top:.4rem;">
          <button onclick="Cart.updateQtyPage('${item.id}','${item.variant}',-1)">−</button>
          <span>${item.qty}</span>
          <button onclick="Cart.updateQtyPage('${item.id}','${item.variant}',1)">+</button>
        </div>
      </div>
      <div style="text-align:right;display:flex;flex-direction:column;gap:.5rem;align-items:flex-end;">
        <div class="cart-page-price">${fmt(item.price * item.qty)}</div>
        <div style="font-size:.75rem;color:var(--text-muted);">${fmt(item.price)} each</div>
        <button class="save-later" onclick="Cart.remove('${item.id}','${item.variant}');Cart.renderPage();">
          <i class="fas fa-trash-can" style="margin-right:.3rem;"></i>Remove
        </button>
      </div>
    </div>
  `).join('');
}

/* ---- Delegated "Add to cart" click handler ---- */
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-add-cart]');
  if (!btn) return;
  const product = {
    id:      btn.dataset.id      || 'product',
    name:    btn.dataset.name    || 'Product',
    price:   parseInt(btn.dataset.price) || 0,
    image:   btn.dataset.image   || 'assets/img/hero_purifier.png',
    variant: btn.dataset.variant || 'Standard',
    qty:     parseInt(btn.dataset.qty)   || 1,
  };
  addToCart(product);
  const orig = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-check"></i> Added!';
  btn.disabled = true;
  setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; }, 1600);
});

/* ---- Checkout page summary ---- */
function renderCheckoutSummary() {
  const itemsEl = document.getElementById('checkout-items');
  const subEl   = document.getElementById('co-subtotal');
  const gstEl   = document.getElementById('co-gst');
  const totEl   = document.getElementById('co-total');
  if (!itemsEl) return;

  const itemsHtml = cart.map(i =>
    `<div class="flex gap-1" style="margin-bottom:.4rem;">
       <span style="flex:1;font-size:var(--fs-sm);">${i.name} ×${i.qty}</span>
       <span style="font-size:var(--fs-sm);font-weight:600;">${fmt(i.price * i.qty)}</span>
     </div>`
  ).join('');
  
  itemsEl.innerHTML = itemsHtml || '<p style="font-size:var(--fs-sm);color:var(--text-muted);">No items</p>';

  const sub = cartTotal();
  const gst = cartGst();
  const total = sub + gst;

  subEl && (subEl.textContent = fmt(sub));
  gstEl && (gstEl.textContent = fmt(gst));
  totEl && (totEl.textContent = fmt(total));
  
  // Also update review items if they exist
  const reviewEl = document.getElementById('review-items');
  if (reviewEl) reviewEl.innerHTML = itemsHtml;
}

/* ---- Public API ---- */
window.Cart = {
  add:           addToCart,
  remove:        (id, variant) => { removeFromCart(id, variant); },
  updateQty:     (id, variant, delta) => { updateQty(id, variant, delta); },
  updateQtyPage: (id, variant, delta) => { updateQty(id, variant, delta); renderCartPage(); },
  renderMini:    renderMiniCart,
  renderPage:    renderCartPage,
  getCart:       () => cart,
  total:         cartTotal,
  gst:           cartGst,
  count:         cartCount,
  syncWithServer: async () => {
    if (!window.API?.isLoggedIn()) return;
    try {
      const response = await window.API.Cart.getCart();
      if (response.success && response.data.items) {
        // Simple merge: server items replace local if conflict, but server is truth
        cart = response.data.items.map(item => ({
          id: item.productId?._id || item.productId,
          name: item.productId?.name || 'Product',
          price: item.productId?.price || item.price,
          image: item.productId?.mainImage || item.image || 'assets/img/hero_purifier.png',
          variant: item.variant || 'Standard',
          qty: item.quantity
        }));
        saveCart(cart);
        renderMiniCart();
        updateCartBadge();
        refreshCartPageSummary();
        renderCartPage();
        renderCheckoutSummary();
      }
    } catch (e) { console.warn('Cart sync failed', e); }
  }
};

/* ---- Init ---- */
renderMiniCart();
updateCartBadge();
renderCartPage();
renderCheckoutSummary();
