import { api } from './api.js';
import { showToast } from './ui.js';

function buildQuery() {
  const form = document.getElementById('search-form');
  const params = new URLSearchParams();
  ['q','city','purpose'].forEach(k => {
    if (form[k].value) params.set(k, form[k].value);
  });
  return params.toString();
}

async function search(page = 1) {
  const grid = document.getElementById('results');
  grid.innerHTML = '<p>Loading...</p>';
  const qs = buildQuery();
  try {
    const res = await api(`/properties?${qs}&page=${page}&limit=12`);
    const { items, totalPages } = res.data;
    if (!items.length) {
      grid.innerHTML = '<p>No properties found. Try different filters.</p>';
      return;
    }
    grid.innerHTML = items.map(p => `
      <article class="card">
        <img src="${p.images?.[0]?.url || '/assets/images/placeholder.jpg'}" alt="">
        <div class="card-body">
          <h3>${p.title}</h3>
          <p>${p.locality || ''}, ${p.city}</p>
          <p>₹${Number(p.price).toLocaleString()} ${p.purpose === 'rent' ? '/mo' : ''}</p>
          <a href="/pages/details.html?id=${p._id}" class="btn">Details</a>
        </div>
      </article>
    `).join('');
  } catch (err) {
    grid.innerHTML = '<p>Error loading results.</p>';
    showToast(err.message, 'error');
  }
}

document.getElementById('search-form')?.addEventListener('submit', e => {
  e.preventDefault();
  // Update URL
  const qs = buildQuery();
  history.replaceState(null, '', `?${qs}`);
  search();
});

// Debounce text inputs
let timer;
document.querySelectorAll('#search-form input').forEach(inp => {
  inp.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => search(), 400);
  });
});

document.addEventListener('DOMContentLoaded', () => {
  // Restore from URL
  const params = new URLSearchParams(location.search);
  const form = document.getElementById('search-form');
  ['q','city','purpose'].forEach(k => {
    if (params.has(k) && form[k]) form[k].value = params.get(k);
  });
  search();
});
