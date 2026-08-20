/**
 * dashboard.js — Powers dashboard.html: welcome message, stats,
 * upcoming registered events, saved events preview, recommendations.
 */

function registrationRowHtml(reg) {
  const image = reg.image_url || `https://picsum.photos/seed/event${reg.event_id}/200/150`;
  const isPast = new Date(reg.event_date) < new Date().setHours(0, 0, 0, 0);
  return `
    <div class="list-row">
      <img src="${image}" alt="">
      <div class="info">
        <h4>${escapeHtml(reg.title)}</h4>
        <p>📅 ${formatDate(reg.event_date)} · 📍 ${escapeHtml(reg.city)} · ${reg.ticket_quantity} ticket(s)</p>
      </div>
      <div class="actions">
        <span class="badge ${isPast ? 'badge-muted' : 'badge-success'}">${isPast ? 'Past' : 'Upcoming'}</span>
        <a href="event-details.html?id=${reg.event_id}" class="btn btn-outline btn-sm">View</a>
      </div>
    </div>
  `;
}

async function loadDashboard() {
  const user = getCurrentUser();
  document.getElementById('welcome-heading').textContent = `Welcome back, ${user.name.split(' ')[0]}!`;

  try {
    const [registrationsRes, bookmarksRes, recommendationsRes] = await Promise.all([
      api.get('/registrations?status=CONFIRMED'),
      api.get('/bookmarks'),
      api.get('/recommendations?limit=4')
    ]);

    const registrations = registrationsRes.data;
    const bookmarks = bookmarksRes.data;
    const upcoming = registrations.filter((r) => new Date(r.event_date) >= new Date().setHours(0, 0, 0, 0));

    // Stats
    document.getElementById('stats-grid').innerHTML = `
      <div class="stat-card"><div class="stat-value">${registrations.length}</div><div class="stat-label">Total Registrations</div></div>
      <div class="stat-card"><div class="stat-value">${upcoming.length}</div><div class="stat-label">Upcoming Events</div></div>
      <div class="stat-card"><div class="stat-value">${bookmarks.length}</div><div class="stat-label">Saved Events</div></div>
      <div class="stat-card"><div class="stat-value">${registrations.length - upcoming.length}</div><div class="stat-label">Past Events</div></div>
    `;

    // Upcoming registered events
    const upcomingList = document.getElementById('upcoming-registered-list');
    upcomingList.innerHTML = upcoming.length
      ? upcoming.slice(0, 5).map(registrationRowHtml).join('')
      : `<div class="state-box"><h3>No upcoming events.</h3><p><a href="events.html">Browse events</a> to register for something exciting.</p></div>`;

    // Saved events preview
    const savedGrid = document.getElementById('saved-preview-grid');
    const bookmarkedIds = new Set(bookmarks.map((b) => b.id));
    savedGrid.innerHTML = bookmarks.length
      ? bookmarks.slice(0, 4).map((b) => eventCardHtml(b, bookmarkedIds)).join('')
      : `<div class="state-box"><h3>No saved events yet.</h3><p>Bookmark events you're interested in to see them here.</p></div>`;
    attachBookmarkHandlers(savedGrid);

    // Recommendations
    const recGrid = document.getElementById('recommended-grid');
    recGrid.innerHTML = recommendationsRes.data.length
      ? recommendationsRes.data.map((e) => eventCardHtml(e, bookmarkedIds)).join('')
      : `<div class="state-box"><h3>No recommendations yet.</h3><p>Update your interests in your profile to get personalized picks.</p></div>`;
    attachBookmarkHandlers(recGrid);
  } catch (err) {
    showToast('Unable to load dashboard. ' + err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  loadDashboard();
});
