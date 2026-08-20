/**
 * events.js — Powers events.html: search, filters, sorting, pagination,
 * "Near Me" geolocation-based discovery, and quick filter shortcuts.
 */

let bookmarkedIds = new Set();
let currentPage = 1;
const PAGE_LIMIT = 12;
let nearMeCoords = null; // { latitude, longitude } when "Near Me" is active

async function loadBookmarkedIds() {
  if (!isLoggedIn()) return;
  try {
    const res = await api.get('/bookmarks');
    bookmarkedIds = new Set(res.data.map((b) => b.id));
  } catch (e) { /* ignore */ }
}

async function populateCategoryFilter() {
  const select = document.getElementById('filter-category');
  try {
    const res = await api.get('/categories');
    res.data.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.name;
      opt.textContent = c.name;
      select.appendChild(opt);
    });
  } catch (e) { /* ignore */ }
}

function readFiltersFromUI() {
  const priceRadio = document.querySelector('input[name="price"]:checked');
  return {
    category: document.getElementById('filter-category').value,
    city: document.getElementById('filter-city').value,
    date: document.getElementById('filter-date').value,
    price: priceRadio ? priceRadio.value : '',
    event_type: document.getElementById('filter-type').value,
    sort: document.getElementById('sort-select').value,
    q: document.getElementById('search-input').value.trim()
  };
}

function applyFiltersFromURL() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('category')) document.getElementById('filter-category').value = params.get('category');
  if (params.get('city')) document.getElementById('filter-city').value = params.get('city');
  if (params.get('q')) document.getElementById('search-input').value = params.get('q');
}

async function fetchAndRenderEvents() {
  const grid = document.getElementById('events-grid');
  const resultCount = document.getElementById('result-count');
  const pagination = document.getElementById('pagination');
  grid.innerHTML = '<div class="spinner"></div>';
  resultCount.textContent = 'Loading...';
  pagination.innerHTML = '';

  const filters = readFiltersFromUI();

  try {
    let res;

    if (nearMeCoords) {
      res = await api.get(`/events/nearby?latitude=${nearMeCoords.latitude}&longitude=${nearMeCoords.longitude}&radius=25`);
      renderGrid(res.data, grid, true);
      resultCount.textContent = `${res.data.length} event(s) found near you`;
      return;
    }

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set('page', currentPage);
    params.set('limit', PAGE_LIMIT);

    if (filters.q) {
      params.delete('q');
      const searchParams = new URLSearchParams();
      searchParams.set('q', filters.q);
      searchParams.set('page', currentPage);
      searchParams.set('limit', PAGE_LIMIT);
      res = await api.get(`/events/search?${searchParams.toString()}`);
    } else {
      res = await api.get(`/events?${params.toString()}`);
    }

    renderGrid(res.data, grid, false);
    resultCount.textContent = `${res.pagination.total} event(s) found`;
    renderPagination(res.pagination);
  } catch (err) {
    grid.innerHTML = `<div class="state-box"><h3>Unable to load events.</h3><p>Please try again.</p></div>`;
    resultCount.textContent = '';
  }
}

function renderGrid(events, grid, isNearMe) {
  if (!events || events.length === 0) {
    grid.innerHTML = `<div class="state-box"><h3>No events found.</h3><p>Try changing your filters.</p></div>`;
    return;
  }
  grid.innerHTML = events
    .map((evt) => {
      let card = eventCardHtml(evt, bookmarkedIds);
      if (isNearMe && evt.distance_km !== undefined) {
        card = card.replace('</div>\n        <div class="price-row">',
          `<span>📏 ${Number(evt.distance_km).toFixed(1)} km away</span></div>\n        <div class="price-row">`);
      }
      return card;
    })
    .join('');
  attachBookmarkHandlers(grid, (eventId, isNowBookmarked) => {
    if (isNowBookmarked) bookmarkedIds.add(parseInt(eventId, 10));
    else bookmarkedIds.delete(parseInt(eventId, 10));
  });
}

function renderPagination(pg) {
  const el = document.getElementById('pagination');
  if (pg.totalPages <= 1) { el.innerHTML = ''; return; }

  let html = `<button ${pg.page <= 1 ? 'disabled' : ''} data-page="${pg.page - 1}">‹ Prev</button>`;
  for (let i = 1; i <= pg.totalPages; i++) {
    if (i === 1 || i === pg.totalPages || Math.abs(i - pg.page) <= 1) {
      html += `<button class="${i === pg.page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    } else if (i === pg.page - 2 || i === pg.page + 2) {
      html += `<span>…</span>`;
    }
  }
  html += `<button ${pg.page >= pg.totalPages ? 'disabled' : ''} data-page="${pg.page + 1}">Next ›</button>`;
  el.innerHTML = html;

  el.querySelectorAll('button[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.getAttribute('data-page'), 10);
      fetchAndRenderEvents();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function initEvents() {
  document.getElementById('page-search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    nearMeCoords = null;
    currentPage = 1;
    fetchAndRenderEvents();
  });

  document.getElementById('apply-filters-btn').addEventListener('click', () => {
    nearMeCoords = null;
    currentPage = 1;
    fetchAndRenderEvents();
  });

  document.getElementById('sort-select').addEventListener('change', () => {
    currentPage = 1;
    fetchAndRenderEvents();
  });

  document.querySelectorAll('.quick-filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.quick-filter-btn').forEach((b) => b.classList.remove('active'));
      const type = btn.getAttribute('data-quick');

      if (type === 'clear') {
        document.getElementById('filter-category').value = '';
        document.getElementById('filter-city').value = '';
        document.getElementById('filter-date').value = '';
        document.getElementById('filter-type').value = '';
        document.getElementById('search-input').value = '';
        document.querySelector('input[name="price"][value=""]').checked = true;
        nearMeCoords = null;
        currentPage = 1;
        fetchAndRenderEvents();
        return;
      }

      btn.classList.add('active');
      nearMeCoords = null;

      if (type === 'this_weekend') {
        document.getElementById('filter-date').value = 'this_weekend';
        currentPage = 1;
        fetchAndRenderEvents();
      } else if (type === 'free') {
        document.querySelector('input[name="price"][value="free"]').checked = true;
        currentPage = 1;
        fetchAndRenderEvents();
      } else if (type === 'near_me') {
        if (!navigator.geolocation) {
          showToast('Geolocation is not supported by your browser.', 'error');
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (position) => {
            nearMeCoords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };
            fetchAndRenderEvents();
          },
          () => {
            showToast('Location permission denied. Please select a city instead.', 'error');
            btn.classList.remove('active');
          }
        );
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  applyFiltersFromURL();
  await Promise.all([loadBookmarkedIds(), populateCategoryFilter()]);
  initEvents();
  fetchAndRenderEvents();
});
