import { api } from './api.js';
import { showToast } from './ui.js';

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = { email: form.email.value, password: form.password.value };
  try {
    await api('/auth/login', { method: 'POST', body: JSON.stringify(data) });
    showToast('Logged in successfully');
    window.location.href = '/pages/index.html';
  } catch (err) {
    showToast(err.message, 'error');
  }
});
