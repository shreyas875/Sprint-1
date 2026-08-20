/**
 * event-details.js — Fetches a single event by ID from the URL query string,
 * renders full details, handles bookmarking, ticket quantity selection,
 * and registration.
 */

let currentEvent = null;
let ticketQty = 1;
let isBookmarked = false;

function getEventIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function checkBookmarkStatus(eventId) {
  if (!isLoggedIn()) return false;
  try {
    const res = await api.get('/bookmarks');
    return res.data.some((b) => b.id === parseInt(eventId, 10));
  } catch (e) {
    return false;
  }
}

async function checkRegistrationStatus(eventId) {
  if (!isLoggedIn()) return null;
  try {
    const res = await api.get('/registrations?status=CONFIRMED');
    return res.data.find((r) => r.event_id === parseInt(eventId, 10)) || null;
  } catch (e) {
    return null;
  }
}

function renderRelatedEvents(related) {
  if (!related || related.length === 0) return '';
  return `
    <section class="section">
      <div class="section-head"><h2>Related Events</h2></div>
      <div class="events-grid">
        ${related.map((evt) => eventCardHtml(evt)).join('')}
      </div>
    </section>
  `;
}

function renderDetails(evt, bookmarked, existingRegistration) {
  const image = evt.image_url || `https://picsum.photos/seed/event${evt.id}/1200/600`;
  const seatsLow = evt.available_seats > 0 && evt.available_seats <= 10;
  const soldOut = evt.available_seats <= 0;

  const container = document.getElementById('details-container');
  container.innerHTML = `
    <div class="event-hero-banner" style="background-image:url('${image}')">
      <div class="overlay">
        <div>
          <span class="cat">${escapeHtml(evt.category_name)}</span>
          <h1>${escapeHtml(evt.title)}</h1>
        </div>
      </div>
    </div>

    <div class="details-layout">
      <div class="details-main">
        <div class="flex-between">
          <div class="flex gap-8">
            <span class="badge badge-muted">${evt.event_type}</span>
            ${seatsLow && !soldOut ? `<span class="badge badge-danger">🔥 Only ${evt.available_seats} seats left</span>` : ''}
            ${soldOut ? `<span class="badge badge-danger">Sold Out</span>` : ''}
          </div>
          <button class="btn btn-outline btn-sm" id="detail-bookmark-btn">
            ${bookmarked ? '♥ Saved' : '♡ Save Event'}
          </button>
        </div>

        <div class="info-grid">
          <div class="info-item"><span class="icon">📅</span><div><div class="label">Date & Time</div><div class="value">${formatDate(evt.event_date)}${evt.start_time ? ' · ' + formatTime(evt.start_time) : ''}</div></div></div>
          <div class="info-item"><span class="icon">📍</span><div><div class="label">Venue</div><div class="value">${escapeHtml(evt.venue || '—')}, ${escapeHtml(evt.city)}</div></div></div>
          <div class="info-item"><span class="icon">💰</span><div><div class="label">Price</div><div class="value">${formatPrice(evt.price)}</div></div></div>
          <div class="info-item"><span class="icon">🪑</span><div><div class="label">Available Seats</div><div class="value">${evt.available_seats} / ${evt.capacity}</div></div></div>
          <div class="info-item"><span class="icon">🏷️</span><div><div class="label">Category</div><div class="value">${escapeHtml(evt.category_name)}</div></div></div>
          <div class="info-item"><span class="icon">👤</span><div><div class="label">Organizer</div><div class="value">${escapeHtml(evt.organizer_name || '—')}</div></div></div>
        </div>

        <h3>About This Event</h3>
        <p class="text-muted">${escapeHtml(evt.description || 'No description provided.')}</p>

        ${evt.latitude && evt.longitude ? `
        <h3 class="mt-24">Location</h3>
        <div class="map-placeholder">
          <iframe
            width="100%" height="100%" style="border:0"
            loading="lazy"
            src="https://maps.google.com/maps?q=${evt.latitude},${evt.longitude}&z=14&output=embed">
          </iframe>
        </div>` : ''}
      </div>

      <aside class="booking-card">
        <div class="price-display">${formatPrice(evt.price)}</div>
        <div class="seats-info text-muted">${evt.available_seats} seats available</div>

        <div id="registration-status-box"></div>

        <div class="qty-selector" id="qty-selector" style="display:${existingRegistration || soldOut ? 'none' : 'flex'};">
          <button type="button" id="qty-minus">−</button>
          <span id="qty-value">1</span>
          <button type="button" id="qty-plus">+</button>
          <span class="text-muted" style="font-size:0.8rem;">ticket(s)</span>
        </div>

        <button class="btn btn-primary btn-block" id="register-btn" ${soldOut ? 'disabled' : ''}>
          ${soldOut ? 'Sold Out' : existingRegistration ? 'Already Registered' : 'Register Now'}
        </button>
      </aside>
    </div>

    ${renderRelatedEvents(evt.related_events)}
  `;

  if (existingRegistration) {
    document.getElementById('register-btn').disabled = true;
    document.getElementById('registration-status-box').innerHTML =
      `<div class="badge badge-success mt-8" style="display:inline-block; margin-bottom:14px;">✓ You're registered (${existingRegistration.ticket_quantity} ticket${existingRegistration.ticket_quantity > 1 ? 's' : ''})</div>`;
  }

  // Bookmark handler
  document.getElementById('detail-bookmark-btn').addEventListener('click', async () => {
    const result = await toggleBookmark(evt.id, isBookmarked);
    if (result !== null) {
      isBookmarked = result;
      document.getElementById('detail-bookmark-btn').innerHTML = isBookmarked ? '♥ Saved' : '♡ Save Event';
    }
  });

  // Quantity selectors
  if (!existingRegistration && !soldOut) {
    document.getElementById('qty-minus').addEventListener('click', () => {
      if (ticketQty > 1) {
        ticketQty--;
        document.getElementById('qty-value').textContent = ticketQty;
      }
    });
    document.getElementById('qty-plus').addEventListener('click', () => {
      if (ticketQty < evt.available_seats) {
        ticketQty++;
        document.getElementById('qty-value').textContent = ticketQty;
      }
    });
  }

  // Register handler
  document.getElementById('register-btn').addEventListener('click', async () => {
    if (!isLoggedIn()) {
      showToast('Please login to register for this event.', 'info');
      setTimeout(() => (window.location.href = 'login.html'), 1000);
      return;
    }
    const btn = document.getElementById('register-btn');
    btn.disabled = true;
    btn.textContent = 'Registering...';
    try {
      await api.post('/registrations', { event_id: evt.id, ticket_quantity: ticketQty });
      showToast('Registration confirmed!', 'success');
      setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Register Now';
    }
  });

  attachBookmarkHandlers(container);
}

document.addEventListener('DOMContentLoaded', async () => {
  const eventId = getEventIdFromUrl();
  const container = document.getElementById('details-container');

  if (!eventId) {
    container.innerHTML = `<div class="state-box"><h3>No event specified.</h3><p><a href="events.html">Browse all events</a></p></div>`;
    return;
  }

  try {
    const [eventRes, bookmarked, existingRegistration] = await Promise.all([
      api.get(`/events/${eventId}`),
      checkBookmarkStatus(eventId),
      checkRegistrationStatus(eventId)
    ]);
    currentEvent = eventRes.data;
    isBookmarked = bookmarked;
    renderDetails(currentEvent, bookmarked, existingRegistration);
  } catch (err) {
    container.innerHTML = `<div class="state-box"><h3>Unable to load event.</h3><p>${escapeHtml(err.message)}</p></div>`;
  }
});
