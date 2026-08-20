/**
 * api.js — Central fetch wrapper used by every page.
 * Adds the JWT (if present), JSON headers, and normalizes error handling.
 */

const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('sef_token');
}

async function apiRequest(url, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${url}`, { ...options, headers });

  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = { success: false, message: 'Unexpected server response.' };
  }

  if (!response.ok) {
    // If the token is invalid/expired, clear it so the UI reflects logged-out state.
    if (response.status === 401) {
      localStorage.removeItem('sef_token');
      localStorage.removeItem('sef_user');
    }
    throw new Error(data.message || 'Something went wrong.');
  }

  return data;
}

const api = {
  get: (url) => apiRequest(url, { method: 'GET' }),
  post: (url, body) => apiRequest(url, { method: 'POST', body: JSON.stringify(body || {}) }),
  put: (url, body) => apiRequest(url, { method: 'PUT', body: JSON.stringify(body || {}) }),
  del: (url) => apiRequest(url, { method: 'DELETE' })
};
