(() => {
  const AUTH_STATUS_URL = 'https://classroom.neverjustsell.com/session/status';

  async function syncAuthLinks() {
    const links = document.querySelectorAll('[data-njs-auth-link]');
    if (!links.length) return;

    try {
      const response = await fetch(AUTH_STATUS_URL, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
      if (!response.ok) return;
      const state = await response.json();
      const authenticated = state && state.authenticated === true;

      links.forEach((link) => {
        link.textContent = authenticated ? '로그아웃' : '로그인';
        link.setAttribute('href', authenticated ? '/logout' : '/login');
      });
    } catch (_) {
      // Public content remains usable if auth status cannot be loaded.
    }
  }

  syncAuthLinks();

  const button = document.querySelector('.njs-menu-toggle');
  const nav = document.querySelector('#njs-nav');
  if (button && nav) {
    button.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      button.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      button.setAttribute('aria-expanded', 'false');
    }));
  }
})();
