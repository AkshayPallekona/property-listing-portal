import { api } from './api.js';
import { showToast } from './ui.js';

async function loadListings(endpoint, containerId) {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  grid.innerHTML = '<p>Loading...</p>';
  try {
    const res = await api(endpoint);
    const items = res.data.items || [];
    if (!items.length) {
      grid.innerHTML = '<p>No listings yet.</p>';
      return;
    }
    grid.innerHTML = items.map(p => `
      <article class="card">
        <img src="${p.images?.[0]?.url || '/assets/images/placeholder.jpg'}" alt="${p.title}">
        <div class="card-body">
          <h3>${p.title}</h3>
          <p>${p.city}, ${p.state}</p>
          <p><strong>₹${p.price.toLocaleString()}</strong> ${p.purpose === 'rent' ? '/month' : ''}</p>
          <a href="/pages/details.html?id=${p._id}" class="btn">View</a>
        </div>
      </article>
    `).join('');
  } catch (err) {
    grid.innerHTML = '<p>Failed to load listings.</p>';
    showToast(err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadListings('/properties/featured', 'featured-grid');
  loadListings('/properties/recent', 'recent-grid');
});
