import { api } from './api.js';

export function showToast(message, type = 'info') {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.display = 'block';
  toast.style.background = type === 'error' ? '#c53030' : '#2d3748';
  setTimeout(() => { toast.style.display = 'none'; }, 4000);
}

export function confirmAction(message) {
  return window.confirm(message);
}
