/* =========================================================
   VERVA – account.js | Dashboard, Order History & Profile
   ========================================================= */
'use strict';

async function initAccount() {
  const user = window.API?.getUserFromToken();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  // Set user info
  document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);
  document.querySelectorAll('.user-email').forEach(el => el.textContent = user.email);
  
  // Set avatar
  const avatarBtn = document.getElementById('header-avatar-btn');
  if (avatarBtn) {
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    avatarBtn.innerHTML = `<span style="background:var(--cta);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;">${initials}</span>`;
  }

  initStats(user);
  loadOrders();
}

function initStats(user) {
  // Potentially fetch stats from an endpoint if it exists
  // For now, let's keep it somewhat realistic
}

async function loadOrders() {
  const orderList = document.querySelector('#orders > div');
  if (!orderList) return;

  try {
    const response = await window.API.Order.getOrders();
    if (response.success && response.data && response.data.length > 0) {
      renderOrders(response.data, orderList);
    } else {
      orderList.innerHTML = `
        <div style="text-align:center;padding:3rem 1rem;">
          <i class="fas fa-box-open" style="font-size:3rem;opacity:.2;margin-bottom:1rem;display:block;"></i>
          <p style="color:var(--text-muted);">You haven't placed any orders yet.</p>
          <a href="shop.html" class="btn btn-primary btn-sm" style="margin-top:1.2rem;">Start Shopping</a>
        </div>`;
    }
  } catch (error) {
    console.warn('Could not load real orders, keeping static ones for demo.', error);
    // If backend is not available, we keep the static mockups
  }
}

function renderOrders(orders, container) {
  container.innerHTML = orders.map(order => `
    <div style="margin-bottom:2rem;padding-bottom:2rem;border-bottom:1px solid var(--glass-dark);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <div>
          <strong style="font-size:.9rem;">Order #${order._id.slice(-8).toUpperCase()}</strong>
          <p style="font-size:var(--fs-xs);">Placed ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · ${order.items.length} Item${order.items.length !== 1 ? 's' : ''}</p>
        </div>
        <span class="chip" style="color:${getStatusColor(order.status)};border-color:${getStatusColor(order.status)};">${order.status}</span>
      </div>
      <div class="order-timeline">
        ${renderTimeline(order.status)}
      </div>
    </div>
  `).join('');
}

function getStatusColor(status) {
  switch (status.toLowerCase()) {
    case 'delivered': return 'var(--success)';
    case 'shipped': return 'var(--cta)';
    case 'processing': return 'var(--warning)';
    case 'cancelled': return 'var(--error)';
    default: return 'var(--text-muted)';
  }
}

function renderTimeline(status) {
  const steps = ['Ordered', 'Packed', 'Shipped', 'Delivered'];
  const statusIdx = steps.findIndex(s => s.toLowerCase() === status.toLowerCase());
  
  // If status is not in the list (like Processing), assume it's after Ordered
  let currentStep = statusIdx;
  if (currentStep === -1) {
    if (status.toLowerCase() === 'processing') currentStep = 1;
    else if (status.toLowerCase() === 'packed') currentStep = 1;
    else currentStep = 0;
  }

  return steps.map((step, i) => {
    let cls = '';
    let icon = i === 3 ? 'fa-house' : (i === 2 ? 'fa-truck' : 'fa-check');
    if (i < currentStep) cls = 'done';
    else if (i === currentStep) cls = 'active';
    
    return `
      <div class="timeline-step ${cls}">
        <div class="timeline-dot"><i class="fas ${icon}"></i></div>
        <div class="timeline-label">${step}</div>
        ${i < 3 ? '<div class="timeline-line"></div>' : ''}
      </div>
    `;
  }).join('');
}

// Initialize on load
window.addEventListener('DOMContentLoaded', initAccount);
document.addEventListener('VERVA:authchanged', initAccount);
