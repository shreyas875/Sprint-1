/**
 * common.js — Shared UI helpers used across all pages:
 * toast notifications, navbar rendering based on auth state,
 * formatting utilities, and small DOM helpers.
 */

// ---------------- Auth state helpers ----------------
function getCurrentUser() {
  const raw = localStorage.getItem('sef_user');
  return raw ? JSON.parse(raw) : null;
}

function isLoggedIn() {
  return !!getToken() && !!getCurrentUser();
}

function isAdmin() {
  const user = getCurrentUser();
  return !!user && user.role === 'ADMIN';
}

function logoutUser() {
  localStorage.removeItem('sef_token');
  localStorage.removeItem('sef_user');
  window.location.href = 'index.html';
}

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function requireAdmin() {
  if (!isLoggedIn() || !isAdmin()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// ---------------- Toasts ----------------
function ensureToastContainer() {
  let el = document.getElementById('toast-container');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast-container';
    document.body.appendChild(el);
  }
  return el;
}

function showToast(message, type = 'info', duration = 3200) {
  const container = ensureToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// ---------------- Formatting helpers ----------------
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${m} ${suffix}`;
}

function formatPrice(price) {
  const num = Number(price);
  return num === 0 ? 'Free' : `₹${num.toLocaleString('en-IN')}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// ---------------- Navbar rendering ----------------
function renderNavbar() {
  const navActions = document.getElementById('nav-actions');
  if (!navActions) return;

  const user = getCurrentUser();

  if (user) {
    const initials = user.name ? user.name.trim().charAt(0).toUpperCase() : 'U';
    const dashboardLink = user.role === 'ADMIN' ? 'admin/dashboard.html' : 'dashboard.html';
    navActions.innerHTML = `
      <a href="${dashboardLink}" class="nav-user" style="display:flex;">
        <span class="avatar-badge">${initials}</span>
        <span>${escapeHtml(user.name)}</span>
      </a>
      <button class="btn btn-outline btn-sm" id="logout-btn">Logout</button>
    `;
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logoutUser);
  } else {
    navActions.innerHTML = `
      <a href="login.html" class="btn btn-outline btn-sm">Login</a>
      <a href="register.html" class="btn btn-primary btn-sm">Sign Up</a>
    `;
  }

  const hamburger = document.getElementById('hamburger-btn');
  const navbar = document.getElementById('main-navbar');
  if (hamburger && navbar) {
    hamburger.addEventListener('click', () => navbar.classList.toggle('mobile-open'));
  }
}

// ---------------- Bookmark toggle (shared by index/events/details) ----------------
async function toggleBookmark(eventId, isBookmarked) {
  if (!isLoggedIn()) {
    showToast('Please login to bookmark events.', 'info');
    setTimeout(() => (window.location.href = 'login.html'), 1000);
    return null;
  }
  try {
    if (isBookmarked) {
      await api.del(`/bookmarks/${eventId}`);
      showToast('Bookmark removed.', 'success');
      return false;
    } else {
      await api.post(`/bookmarks/${eventId}`);
      showToast('Event bookmarked!', 'success');
      return true;
    }
  } catch (err) {
    showToast(err.message, 'error');
    return null;
  }
}

// ---------------- Event card builder (shared markup) ----------------
function eventCardHtml(evt, bookmarkedIds = new Set()) {
  const isBookmarked = bookmarkedIds.has(evt.id);
  const seatsLow = evt.available_seats > 0 && evt.available_seats <= 10;
  const image = evt.image_url || `https://picsum.photos/seed/event${evt.id}/600/400`;
  const interested = Number(evt.registration_count || 0) + Number(evt.bookmark_count || 0);

  return `
    <div class="event-card" data-event-id="${evt.id}">
      <div class="thumb" style="background-image:url('${image}')">
        <button class="bookmark-btn" data-bookmark-id="${evt.id}" title="Save event">
          ${isBookmarked ? '♥' : '♡'}
        </button>
        <span class="category-tag">${escapeHtml(evt.category_name || '')}</span>
      </div>
      <div class="body">
        <h3>${escapeHtml(evt.title)}</h3>
        <div class="meta">
          <span>📅 ${formatDate(evt.event_date)}</span>
          <span>📍 ${escapeHtml(evt.city)}</span>
          ${seatsLow ? `<span class="seats-low">🔥 Only ${evt.available_seats} seats left</span>` : ''}
        </div>
        <div class="price-row">
          <span class="price">${formatPrice(evt.price)}</span>
          <span class="interest-count">${interested} interested</span>
        </div>
        <a href="event-details.html?id=${evt.id}" class="btn btn-primary btn-block btn-sm mt-8">View Details</a>
      </div>
    </div>
  `;
}

function attachBookmarkHandlers(container, onToggle) {
  container.querySelectorAll('[data-bookmark-id]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const eventId = btn.getAttribute('data-bookmark-id');
      const wasBookmarked = btn.textContent.trim() === '♥';
      const result = await toggleBookmark(eventId, wasBookmarked);
      if (result !== null) {
        btn.textContent = result ? '♥' : '♡';
        if (onToggle) onToggle(eventId, result);
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', renderNavbar);
