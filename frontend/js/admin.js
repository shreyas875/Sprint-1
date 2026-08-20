/**
 * admin.js — Powers all admin/*.html pages. Detects which page is active
 * via presence of specific DOM elements and initializes accordingly.
 */

let adminCategories = [];

// ---------------- Dashboard ----------------
async function initAdminDashboard() {
  const statsGrid = document.getElementById('admin-stats-grid');
  if (!statsGrid) return;

  try {
    const res = await api.get('/admin/dashboard');
    const d = res.data;

    statsGrid.innerHTML = `
      <div class="stat-card"><div class="stat-value">${d.totalUsers}</div><div class="stat-label">Total Users</div></div>
      <div class="stat-card"><div class="stat-value">${d.totalEvents}</div><div class="stat-label">Total Events</div></div>
      <div class="stat-card"><div class="stat-value">${d.totalRegistrations}</div><div class="stat-label">Total Registrations</div></div>
      <div class="stat-card"><div class="stat-value">${d.upcomingEvents.length}</div><div class="stat-label">Upcoming Events</div></div>
    `;

    const catBody = document.querySelector('#popular-categories-table tbody');
    catBody.innerHTML = d.popularCategories.length
      ? d.popularCategories.map((c) => `<tr><td>${escapeHtml(c.name)}</td><td>${c.event_count}</td></tr>`).join('')
      : '<tr><td colspan="2">No categories found.</td></tr>';

    const upcomingBody = document.querySelector('#upcoming-events-table tbody');
    upcomingBody.innerHTML = d.upcomingEvents.length
      ? d.upcomingEvents.map((e) => `<tr><td>${escapeHtml(e.title)}</td><td>${formatDate(e.event_date)}</td><td>${escapeHtml(e.city)}</td></tr>`).join('')
      : '<tr><td colspan="3">No upcoming events.</td></tr>';
  } catch (err) {
    statsGrid.innerHTML = `<div class="state-box"><h3>Unable to load dashboard.</h3><p>${escapeHtml(err.message)}</p></div>`;
  }
}

// ---------------- Events CRUD ----------------
async function loadCategoryOptions() {
  const select = document.getElementById('ev-category');
  if (!select) return;
  const res = await api.get('/categories');
  adminCategories = res.data;
  select.innerHTML = adminCategories.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
}

function eventTableRow(evt) {
  const image = evt.image_url || `https://picsum.photos/seed/event${evt.id}/100/80`;
  const statusBadgeClass = evt.status === 'PUBLISHED' ? 'badge-success' : evt.status === 'CANCELLED' ? 'badge-danger' : 'badge-muted';
  return `
    <tr data-row-id="${evt.id}">
      <td><img src="${image}" class="thumb-sm" alt=""></td>
      <td>${escapeHtml(evt.title)}</td>
      <td>${escapeHtml(evt.category_name)}</td>
      <td>${escapeHtml(evt.city)}</td>
      <td>${formatDate(evt.event_date)}</td>
      <td>${formatPrice(evt.price)}</td>
      <td>${evt.available_seats}/${evt.capacity}</td>
      <td><span class="badge ${statusBadgeClass}">${evt.status}</span></td>
      <td>
        <div class="flex gap-8">
          <button class="btn btn-outline btn-sm" data-edit-id="${evt.id}">Edit</button>
          <button class="btn btn-danger btn-sm" data-delete-id="${evt.id}">Delete</button>
        </div>
      </td>
    </tr>
  `;
}

let allAdminEvents = [];

async function loadAdminEvents() {
  const tbody = document.getElementById('events-table-body');
  if (!tbody) return;
  try {
    const res = await api.get('/events?limit=100&status=PUBLISHED&sort=newest');
    // Fetch drafts/cancelled too for full admin visibility
    const resAll = await Promise.all(
      ['PUBLISHED', 'DRAFT', 'CANCELLED', 'COMPLETED'].map((s) => api.get(`/events?limit=100&status=${s}&sort=newest`))
    );
    allAdminEvents = resAll.flatMap((r) => r.data);

    if (allAdminEvents.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9">No events found.</td></tr>`;
      return;
    }
    tbody.innerHTML = allAdminEvents.map(eventTableRow).join('');
    attachEventTableHandlers();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="9">Unable to load events. ${escapeHtml(err.message)}</td></tr>`;
  }
}

function attachEventTableHandlers() {
  document.querySelectorAll('[data-edit-id]').forEach((btn) => {
    btn.addEventListener('click', () => openEventModal(btn.getAttribute('data-edit-id')));
  });
  document.querySelectorAll('[data-delete-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this event? This cannot be undone.')) return;
      try {
        await api.del(`/events/${btn.getAttribute('data-delete-id')}`);
        showToast('Event deleted successfully.', 'success');
        loadAdminEvents();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });
}

function openEventModal(eventId) {
  const overlay = document.getElementById('event-modal-overlay');
  const title = document.getElementById('event-modal-title');
  const form = document.getElementById('event-form');
  form.reset();
  document.getElementById('event-form-error').textContent = '';

  if (eventId) {
    const evt = allAdminEvents.find((e) => String(e.id) === String(eventId));
    title.textContent = 'Edit Event';
    document.getElementById('event-id').value = evt.id;
    document.getElementById('ev-title').value = evt.title;
    document.getElementById('ev-description').value = evt.description || '';
    document.getElementById('ev-category').value = evt.category_id;
    document.getElementById('ev-type').value = evt.event_type;
    document.getElementById('ev-organizer').value = evt.organizer_name || '';
    document.getElementById('ev-organizer-email').value = evt.organizer_email || '';
    document.getElementById('ev-venue').value = evt.venue || '';
    document.getElementById('ev-address').value = evt.address || '';
    document.getElementById('ev-city').value = evt.city;
    document.getElementById('ev-latitude').value = evt.latitude || '';
    document.getElementById('ev-longitude').value = evt.longitude || '';
    document.getElementById('ev-date').value = evt.event_date;
    document.getElementById('ev-status').value = evt.status;
    document.getElementById('ev-start-time').value = evt.start_time || '';
    document.getElementById('ev-end-time').value = evt.end_time || '';
    document.getElementById('ev-price').value = evt.price;
    document.getElementById('ev-capacity').value = evt.capacity;
    document.getElementById('ev-image').value = evt.image_url || '';
  } else {
    title.textContent = 'Add Event';
    document.getElementById('event-id').value = '';
  }

  overlay.classList.add('open');
}

function closeEventModal() {
  document.getElementById('event-modal-overlay').classList.remove('open');
}

function initEventModal() {
  const addBtn = document.getElementById('add-event-btn');
  const cancelBtn = document.getElementById('cancel-event-modal');
  const overlay = document.getElementById('event-modal-overlay');
  const form = document.getElementById('event-form');
  if (!addBtn) return;

  addBtn.addEventListener('click', () => openEventModal(null));
  cancelBtn.addEventListener('click', closeEventModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeEventModal(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById('event-form-error');
    errorBox.textContent = '';

    const payload = {
      title: document.getElementById('ev-title').value.trim(),
      description: document.getElementById('ev-description').value.trim(),
      category_id: parseInt(document.getElementById('ev-category').value, 10),
      event_type: document.getElementById('ev-type').value,
      organizer_name: document.getElementById('ev-organizer').value.trim(),
      organizer_email: document.getElementById('ev-organizer-email').value.trim(),
      venue: document.getElementById('ev-venue').value.trim(),
      address: document.getElementById('ev-address').value.trim(),
      city: document.getElementById('ev-city').value.trim(),
      latitude: document.getElementById('ev-latitude').value ? parseFloat(document.getElementById('ev-latitude').value) : null,
      longitude: document.getElementById('ev-longitude').value ? parseFloat(document.getElementById('ev-longitude').value) : null,
      event_date: document.getElementById('ev-date').value,
      status: document.getElementById('ev-status').value,
      start_time: document.getElementById('ev-start-time').value || null,
      end_time: document.getElementById('ev-end-time').value || null,
      price: parseFloat(document.getElementById('ev-price').value) || 0,
      capacity: parseInt(document.getElementById('ev-capacity').value, 10),
      image_url: document.getElementById('ev-image').value.trim()
    };

    const eventId = document.getElementById('event-id').value;
    const saveBtn = document.getElementById('save-event-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      if (eventId) {
        await api.put(`/events/${eventId}`, payload);
        showToast('Event updated successfully.', 'success');
      } else {
        await api.post('/events', payload);
        showToast('Event created successfully.', 'success');
      }
      closeEventModal();
      loadAdminEvents();
    } catch (err) {
      errorBox.textContent = err.message;
      showToast('Failed to save event.', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Event';
    }
  });
}

// ---------------- Users management ----------------
async function loadAdminUsers() {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;
  try {
    const res = await api.get('/admin/users');
    if (res.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">No users found.</td></tr>`;
      return;
    }
    tbody.innerHTML = res.data
      .map(
        (u) => `
        <tr>
          <td>${escapeHtml(u.name)}</td>
          <td>${escapeHtml(u.email)}</td>
          <td>${escapeHtml(u.city || '—')}</td>
          <td><span class="badge ${u.role === 'ADMIN' ? 'badge-success' : 'badge-muted'}">${u.role}</span></td>
          <td>${u.registration_count}</td>
          <td>${formatDate(u.created_at)}</td>
          <td>
            <div class="flex gap-8">
              <button class="btn btn-outline btn-sm" data-toggle-role="${u.id}" data-current-role="${u.role}">
                ${u.role === 'ADMIN' ? 'Make User' : 'Make Admin'}
              </button>
              <button class="btn btn-danger btn-sm" data-delete-user="${u.id}">Delete</button>
            </div>
          </td>
        </tr>`
      )
      .join('');

    tbody.querySelectorAll('[data-toggle-role]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-toggle-role');
        const newRole = btn.getAttribute('data-current-role') === 'ADMIN' ? 'USER' : 'ADMIN';
        try {
          await api.put(`/users/admin/${id}/role`, { role: newRole });
          showToast('User role updated.', 'success');
          loadAdminUsers();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    tbody.querySelectorAll('[data-delete-user]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this user? This cannot be undone.')) return;
        try {
          await api.del(`/users/admin/${btn.getAttribute('data-delete-user')}`);
          showToast('User deleted.', 'success');
          loadAdminUsers();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7">Unable to load users. ${escapeHtml(err.message)}</td></tr>`;
  }
}

// ---------------- Registrations management ----------------
async function loadAdminRegistrations() {
  const tbody = document.getElementById('registrations-table-body');
  if (!tbody) return;
  try {
    const res = await api.get('/admin/registrations');
    if (res.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">No registrations found.</td></tr>`;
      return;
    }
    tbody.innerHTML = res.data
      .map(
        (r) => `
        <tr>
          <td>${escapeHtml(r.user_name)}</td>
          <td>${escapeHtml(r.user_email)}</td>
          <td>${escapeHtml(r.event_title)}</td>
          <td>${formatDate(r.event_date)}</td>
          <td>${r.ticket_quantity}</td>
          <td><span class="badge ${r.status === 'CONFIRMED' ? 'badge-success' : 'badge-danger'}">${r.status}</span></td>
          <td>${formatDate(r.registration_date)}</td>
        </tr>`
      )
      .join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7">Unable to load registrations. ${escapeHtml(err.message)}</td></tr>`;
  }
}

// ---------------- Init ----------------
document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAdmin()) return;

  initAdminDashboard();

  if (document.getElementById('events-table-body')) {
    await loadCategoryOptions();
    initEventModal();
    loadAdminEvents();
  }

  loadAdminUsers();
  loadAdminRegistrations();
});
