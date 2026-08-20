/**
 * index.js — Homepage logic: categories, upcoming/featured events, recommendations.
 */

const CATEGORY_ICONS = {
  Technology: '💻', Music: '🎵', Sports: '🏆', Business: '💼',
  Education: '📚', Workshops: '🛠️', Conferences: '🎤', Networking: '🤝',
  'Food & Dining': '🍽️', 'Arts & Culture': '🎨', Entertainment: '🎭', 'Health & Fitness': '🧘'
};

let bookmarkedIds = new Set();

async function loadBookmarkedIds() {
  if (!isLoggedIn()) return;
  try {
    const res = await api.get('/bookmarks');
    bookmarkedIds = new Set(res.data.map((b) => b.id));
  } catch (e) { /* silently ignore on homepage */ }
}

async function loadCategories() {
  const grid = document.getElementById('categories-grid');
  try {
    const res = await api.get('/categories');
    if (res.data.length === 0) {
      grid.innerHTML = '<div class="state-box">No categories found.</div>';
      return;
    }
    grid.innerHTML = res.data
      .map(
        (c) => `
        <a href="events.html?category=${encodeURIComponent(c.name)}" class="category-chip">
          <div class="icon">${CATEGORY_ICONS[c.name] || '📌'}</div>
          <div class="name">${escapeHtml(c.name)}</div>
          <div class="count">${c.event_count} events</div>
        </a>`
      )
      .join('');
  } catch (err) {
    grid.innerHTML = `<div class="state-box"><h3>Unable to load categories.</h3><p>Please try again.</p></div>`;
  }
}

async function loadEventsInto(gridId, url) {
  const grid = document.getElementById(gridId);
  try {
    const res = await api.get(url);
    if (!res.data || res.data.length === 0) {
      grid.innerHTML = `<div class="state-box"><h3>No events found.</h3><p>Try changing your filters.</p></div>`;
      return;
    }
    grid.innerHTML = res.data.map((evt) => eventCardHtml(evt, bookmarkedIds)).join('');
    attachBookmarkHandlers(grid, (eventId, isNowBookmarked) => {
      if (isNowBookmarked) bookmarkedIds.add(parseInt(eventId, 10));
      else bookmarkedIds.delete(parseInt(eventId, 10));
    });
  } catch (err) {
    grid.innerHTML = `<div class="state-box"><h3>Unable to load events.</h3><p>Please try again.</p></div>`;
  }
}

async function loadRecommendations() {
  if (!isLoggedIn()) return;
  const section = document.getElementById('recommended-section');
  const grid = document.getElementById('recommended-events-grid');
  try {
    const res = await api.get('/recommendations?limit=4');
    if (res.data.length > 0) {
      section.style.display = 'block';
      grid.innerHTML = res.data.map((evt) => eventCardHtml(evt, bookmarkedIds)).join('');
      attachBookmarkHandlers(grid, (eventId, isNowBookmarked) => {
        if (isNowBookmarked) bookmarkedIds.add(parseInt(eventId, 10));
        else bookmarkedIds.delete(parseInt(eventId, 10));
      });
    }
  } catch (err) { /* recommendations are a bonus, fail silently */ }
}

function initHeroSearch() {
  const form = document.getElementById('hero-search-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = document.getElementById('hero-search-input').value.trim();
    const city = document.getElementById('hero-location-select').value;
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (city) params.set('city', city);
    window.location.href = `events.html?${params.toString()}`;
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  initHeroSearch();
  await loadBookmarkedIds();
  loadCategories();
  loadEventsInto('upcoming-events-grid', '/events?sort=date_asc&limit=8');
  loadEventsInto('featured-events-grid', '/events?sort=popular&limit=8');
  loadRecommendations();
});
