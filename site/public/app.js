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

  function organizeMobileNavigation() {
    const nav = document.querySelector('#njs-nav');
    if (!nav || nav.querySelector('.njs-mobile-more')) return;

    const secondaryHrefs = new Set(['/content', '/store', '/lecture']);
    const secondary = Array.from(nav.querySelectorAll(':scope > a')).filter((link) => {
      try {
        return secondaryHrefs.has(new URL(link.href, window.location.origin).pathname);
      } catch (_) {
        return false;
      }
    });
    if (!secondary.length) return;

    const details = document.createElement('details');
    details.className = 'njs-mobile-more';
    const summary = document.createElement('summary');
    summary.textContent = '더 보기';
    const panel = document.createElement('div');
    panel.className = 'njs-mobile-more-panel';
    secondary.forEach((link) => {
      link.classList.add('njs-desktop-secondary');
      panel.appendChild(link.cloneNode(true));
    });
    details.appendChild(summary);
    details.appendChild(panel);

    const memberServices = nav.querySelector('.njs-mobile-services');
    nav.insertBefore(details, memberServices || null);

    const style = document.createElement('style');
    style.id = 'njs-mobile-ia-style';
    style.textContent = `
      .njs-mobile-more{display:none}
      @media(max-width:1024px){
        .njs-nav>a.njs-desktop-secondary{display:none}
        .njs-mobile-more{display:block;width:100%;border-top:1px solid var(--line);padding-top:14px}
        .njs-mobile-more>summary{list-style:none;cursor:pointer;font-size:14px;font-weight:750;color:var(--muted)}
        .njs-mobile-more>summary::-webkit-details-marker{display:none}
        .njs-mobile-more>summary:after{content:' +';font-weight:500}
        .njs-mobile-more[open]>summary:after{content:' −'}
        .njs-mobile-more-panel{display:flex;flex-direction:column;gap:15px;padding:16px 0 2px}
        .njs-mobile-more-panel a{font-size:14px;font-weight:650}
      }
    `;
    document.head.appendChild(style);
  }

  function injectVerifiedSocialProof() {
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    if (path !== '/' && path !== '/class') return;
    if (document.querySelector('#njs-reader-proof')) return;

    const anchor = path === '/'
      ? document.querySelector('.njs-credentials')
      : document.querySelector('main > section');
    if (!anchor) return;

    if (!document.querySelector('#njs-reader-proof-style')) {
      const style = document.createElement('style');
      style.id = 'njs-reader-proof-style';
      style.textContent = `
        .njs-reader-proof{background:#fff;border-top:1px solid #e4ded6;border-bottom:1px solid #e4ded6}
        .njs-reader-proof-inner{width:min(1180px,calc(100% - 40px));margin:0 auto;padding:46px 0;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:42px;align-items:center}
        .njs-reader-proof .njs-proof-kicker{margin:0 0 9px;font-size:11px;font-weight:800;letter-spacing:.14em;color:#765333}
        .njs-reader-proof h2{margin:0 0 13px;font-size:clamp(27px,4vw,42px);line-height:1.12;letter-spacing:-.04em;color:#171512}
        .njs-reader-proof p{margin:0;color:#716960;line-height:1.75}
        .njs-proof-stats{display:grid;grid-template-columns:1fr 1fr;border:1px solid #ded7ce;background:#ded7ce;gap:1px}
        .njs-proof-stat{background:#fbfaf8;padding:22px 20px;min-height:138px}
        .njs-proof-stat span{display:block;font-size:12px;color:#7c746b;margin-bottom:5px}
        .njs-proof-stat strong{display:block;font-size:29px;letter-spacing:-.04em;color:#171512}
        .njs-proof-stat small{display:block;margin-top:6px;color:#817970;line-height:1.45}
        .njs-proof-source{margin-top:13px!important;font-size:11px!important;color:#8b837b!important}
        .njs-proof-source a{text-decoration:underline;text-underline-offset:3px}
        @media(max-width:720px){.njs-reader-proof-inner{width:calc(100% - 24px);padding:32px 0;grid-template-columns:1fr;gap:24px}.njs-proof-stats{grid-template-columns:1fr 1fr}.njs-proof-stat{padding:18px 16px;min-height:120px}.njs-proof-stat strong{font-size:25px}}
        @media(max-width:430px){.njs-proof-stats{grid-template-columns:1fr}.njs-proof-stat{min-height:auto}}
      `;
      document.head.appendChild(style);
    }

    const section = document.createElement('section');
    section.id = 'njs-reader-proof';
    section.className = 'njs-reader-proof';
    section.innerHTML = `
      <div class="njs-reader-proof-inner">
        <div>
          <p class="njs-proof-kicker">READER RESPONSE</p>
          <h2>책으로 먼저 검증된<br>관점과 설명 방식.</h2>
          <p>온라인 판매를 단기 기술이 아니라 유통·검색·고객 행동·브랜드가 연결된 사업 구조로 설명해 온 관점입니다. 강의는 이 문제의식을 실제 온라인 커머스 사례와 영상 설명으로 확장합니다.</p>
          <p class="njs-proof-source">출처: 2026-09-26 공개 도서 독자평가 · <a href="https://www.yes24.com/product/goods/171660478" target="_blank" rel="noopener noreferrer">YES24 확인</a></p>
        </div>
        <div class="njs-proof-stats" aria-label="도서 독자 평가">
          <div class="njs-proof-stat"><span>YES24 종이책 리뷰</span><strong>9.4 / 10</strong><small>리뷰 20건 · 한줄평 16건</small></div>
          <div class="njs-proof-stat"><span>교보문고 독자 평가</span><strong>9.9 / 10</strong><small>평가 19건</small></div>
        </div>
      </div>`;
    anchor.insertAdjacentElement('afterend', section);
  }

  syncAuthLinks();
  organizeMobileNavigation();
  injectVerifiedSocialProof();

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