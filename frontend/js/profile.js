/**
 * profile.js — Powers profile.html: view/update personal info, interests,
 * and password.
 */

let allCategories = [];
let userInterestIds = new Set();

async function loadCategoriesForProfile() {
  const res = await api.get('/categories');
  allCategories = res.data;
}

function renderInterestPills() {
  const container = document.getElementById('interests-container');
  container.innerHTML = allCategories
    .map(
      (c) => `<span class="checkbox-pill ${userInterestIds.has(c.id) ? 'active' : ''}" data-category-id="${c.id}">${escapeHtml(c.name)}</span>`
    )
    .join('');
  container.querySelectorAll('.checkbox-pill').forEach((pill) => {
    pill.addEventListener('click', () => pill.classList.toggle('active'));
  });
}

async function loadProfile() {
  try {
    const res = await api.get('/users/profile');
    const profile = res.data;

    document.getElementById('profile-name').textContent = profile.name;
    document.getElementById('profile-email').textContent = profile.email;
    document.getElementById('profile-role').innerHTML =
      `<span class="badge ${profile.role === 'ADMIN' ? 'badge-success' : 'badge-muted'}">${profile.role}</span>`;
    document.getElementById('profile-avatar').textContent = profile.name.charAt(0).toUpperCase();

    document.getElementById('p-name').value = profile.name || '';
    document.getElementById('p-phone').value = profile.phone || '';
    document.getElementById('p-city').value = profile.city || '';

    userInterestIds = new Set((profile.interests || []).map((i) => i.id));
    renderInterestPills();
  } catch (err) {
    showToast('Unable to load profile. ' + err.message, 'error');
  }
}

function initProfileForm() {
  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const selectedIds = Array.from(
      document.getElementById('interests-container').querySelectorAll('.checkbox-pill.active')
    ).map((el) => parseInt(el.getAttribute('data-category-id'), 10));

    try {
      const res = await api.put('/users/profile', {
        name: document.getElementById('p-name').value.trim(),
        phone: document.getElementById('p-phone').value.trim(),
        city: document.getElementById('p-city').value,
        interests: selectedIds
      });
      // Keep localStorage user in sync for navbar / greetings
      const stored = getCurrentUser();
      localStorage.setItem('sef_user', JSON.stringify({ ...stored, name: res.data.name }));
      renderNavbar();
      showToast('Profile updated successfully.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

function initPasswordForm() {
  document.getElementById('password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById('password-error');
    errorBox.textContent = '';

    try {
      await api.put('/users/password', {
        current_password: document.getElementById('current-password').value,
        new_password: document.getElementById('new-password').value
      });
      showToast('Password updated successfully.', 'success');
      document.getElementById('password-form').reset();
    } catch (err) {
      errorBox.textContent = err.message;
      showToast('Password update failed.', 'error');
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  await loadCategoriesForProfile();
  await loadProfile();
  initProfileForm();
  initPasswordForm();
});
