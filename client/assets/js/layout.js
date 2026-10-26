export async function injectLayout() {
  const nav = document.getElementById('navbar');
  if (nav) {
    nav.innerHTML = `
      <div class="navbar">
        <a href="/pages/index.html" style="font-weight:bold;font-size:1.25rem;">PropertyPortal</a>
        <div>
          <a href="/pages/search.html">Search</a>
          <a href="/pages/login.html">Login</a>
          <a href="/pages/register.html">Register</a>
          <a href="/pages/profile.html" id="nav-profile" style="display:none;">Profile</a>
        </div>
      </div>
    `;
  }
  const footer = document.getElementById('footer');
  if (footer) {
    footer.innerHTML = `<footer style="text-align:center;padding:2rem;background:#f7fafc;margin-top:2rem;">
      <a href="/pages/privacy.html">Privacy</a> | <a href="/pages/terms.html">Terms</a>
      <p>&copy; ${new Date().getFullYear()} Property Portal. Listings for informational purposes only. No payments or contracts handled here.</p>
    </footer>`;
  }
}

document.addEventListener('DOMContentLoaded', injectLayout);
