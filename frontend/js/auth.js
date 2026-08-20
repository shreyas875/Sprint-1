/**
 * auth.js — Handles login.html and register.html form submissions.
 */

async function loadInterestOptions(containerId, selected = []) {
  const container = document.getElementById(containerId);
  if (!container) return;
  try {
    const res = await api.get('/categories');
    container.innerHTML = res.data
      .map(
        (c) => `<span class="checkbox-pill ${selected.includes(c.id) ? 'active' : ''}" data-category-id="${c.id}">${escapeHtml(c.name)}</span>`
      )
      .join('');

    container.querySelectorAll('.checkbox-pill').forEach((pill) => {
      pill.addEventListener('click', () => pill.classList.toggle('active'));
    });
  } catch (err) {
    container.innerHTML = '<p class="text-muted">Could not load interests.</p>';
  }
}

function getSelectedInterestIds(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return [];
  return Array.from(container.querySelectorAll('.checkbox-pill.active')).map((el) =>
    parseInt(el.getAttribute('data-category-id'), 10)
  );
}

function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById('form-error');
    errorBox.textContent = '';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('sef_token', res.data.token);
      localStorage.setItem('sef_user', JSON.stringify(res.data.user));
      showToast('Login successful!', 'success');
      setTimeout(() => {
        window.location.href = res.data.user.role === 'ADMIN' ? 'admin/dashboard.html' : 'dashboard.html';
      }, 500);
    } catch (err) {
      errorBox.textContent = err.message;
      showToast('Login failed.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Login';
    }
  });
}

function initRegisterForm() {
  const form = document.getElementById('register-form');
  if (!form) return;

  loadInterestOptions('interests-container');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById('form-error');
    errorBox.textContent = '';

    const payload = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value,
      phone: document.getElementById('phone').value.trim(),
      city: document.getElementById('city').value,
      interests: getSelectedInterestIds('interests-container')
    };

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';

    try {
      const res = await api.post('/auth/register', payload);
      localStorage.setItem('sef_token', res.data.token);
      localStorage.setItem('sef_user', JSON.stringify(res.data.user));
      showToast('Account created successfully!', 'success');
      setTimeout(() => (window.location.href = 'dashboard.html'), 500);
    } catch (err) {
      errorBox.textContent = err.message;
      showToast('Registration failed.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initLoginForm();
  initRegisterForm();
});
