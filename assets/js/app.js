/* =============================================================================
   Samrat Kumar Dey — research portfolio
   Shared runtime: theme, chrome (header/footer), data loading, renderers.
   Vanilla JS, no dependencies, no build step. Works from file:// via a local
   server and from GitHub Pages directly.
   ============================================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- utils */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const esc = (s) =>
    String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /** Bold the site owner's name wherever it appears in an author string. */
  const NAME_RE = /(Samrat Kumar Dey|Kumar Dey, S\.|Dey, S\.\s?K\.|Dey, S\.K\.|S\. K\. Dey)/g;
  const markName = (s) => esc(s).replace(NAME_RE, '<b>$1</b>');

  const fmtDate = (iso, opts) => {
    if (!iso) return '';
    const d = new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''));
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('en-US', opts || { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const isExternal = (u) => /^https?:\/\//i.test(u || '');
  const linkAttrs = (u) => (isExternal(u) ? ' target="_blank" rel="noopener noreferrer"' : '');

  /* ---------------------------------------------------------------- icons */
  const ICONS = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-1-2.6c3.1-.3 6.4-1.5 6.4-7A5.4 5.4 0 0 0 20 4.8a5 5 0 0 0-.1-3.7s-1.2-.3-4 1.5a13.4 13.4 0 0 0-7 0C6 .8 4.8 1.1 4.8 1.1a5 5 0 0 0-.1 3.7 5.4 5.4 0 0 0-1.5 3.7c0 5.5 3.3 6.7 6.4 7a3.4 3.4 0 0 0-1 2.6V22"/>',
    linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
    twitter: '<path d="M17.5 3h3.2l-7 8 8.2 10h-6.4l-5-6.1L4.7 21H1.5l7.5-8.6L1.2 3h6.6l4.5 5.6zM16.4 19.1h1.8L7.7 4.8H5.8z"/>',
    scholar: '<path d="M12 3 1 9l11 6 9-4.9V17h2V9z"/><path d="M5 12.5V17c0 1.7 3.1 3 7 3s7-1.3 7-3v-4.5"/>',
    orcid: '<circle cx="12" cy="12" r="10"/><path d="M8 8v9M8 6.2v.1M12 9h2.5a4 4 0 0 1 0 8H12z"/>',
    rg: '<circle cx="12" cy="12" r="10"/><path d="M9 8h2.6a2.4 2.4 0 0 1 0 4.8H9zM9 12.8l3.4 4.2"/>',
    facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7L12.2 19"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    arrowUp: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="m8.2 13.9-1.4 7.3 5.2-3 5.2 3-1.4-7.3"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.7-4 3-9 3s-9-1.3-9-3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/>',
    chart: '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
    bot: '<rect x="3" y="8" width="18" height="12" rx="3"/><path d="M12 8V4M8 2h8"/><circle cx="8.5" cy="14" r="1.2" fill="currentColor" stroke="none"/><circle cx="15.5" cy="14" r="1.2" fill="currentColor" stroke="none"/>',
    branch: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="9" r="3"/><path d="M6 9v6M18 12c0 4-6 2-6 6"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z"/>',
    grant: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  };

  function icon(name, cls) {
    const p = ICONS[name];
    if (!p) return '';
    return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  }
  window.SKDIcon = icon;

  /* ---------------------------------------------------------------- theme */
  const THEME_KEY = 'skd-theme';
  function storedTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function applyTheme(t) {
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
    const btn = $('#themeToggle');
    if (btn) {
      const dark = document.documentElement.getAttribute('data-theme') === 'dark' ||
        (!document.documentElement.getAttribute('data-theme') &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);
      btn.innerHTML = icon(dark ? 'sun' : 'moon');
      btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      btn.setAttribute('title', dark ? 'Light mode' : 'Dark mode');
    }
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const effective = cur || (sysDark ? 'dark' : 'light');
    const next = effective === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* private mode */ }
    applyTheme(next);
  }

  /* ---------------------------------------------------------------- data */
  const BASE = (function () {
    // Pages live at repo root; /admin/ pages live one level down.
    const p = location.pathname;
    return /\/admin\/?$|\/admin\/[^/]*$/.test(p) ? '../' : '';
  })();

  const cache = {};
  async function loadJSON(name) {
    if (cache[name]) return cache[name];
    cache[name] = fetch(BASE + 'data/' + name + '.json', { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error(name + ': HTTP ' + r.status);
        return r.json();
      })
      .catch((err) => {
        console.error('[data]', err);
        return Array.isArray(cache[name]) ? [] : null;
      });
    return cache[name];
  }
  window.SKDLoad = loadJSON;

  async function loadAll(names) {
    const vals = await Promise.all(names.map(loadJSON));
    const out = {};
    names.forEach((n, i) => { out[n] = vals[i]; });
    return out;
  }

  /* ------------------------------------------------------------- chrome */
  function renderHeader(site) {
    const el = $('#siteHeader');
    if (!el) return;
    const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const nav = (site.nav || []).map((n) => {
      const cur = n.href.toLowerCase() === page ||
        (page === '' && n.href === 'index.html');
      return '<a href="' + esc(BASE + n.href) + '"' + (cur ? ' aria-current="page"' : '') + '>' +
        esc(n.label) + '</a>';
    }).join('');
    const initials = (site.profile.name || 'SD').split(/\s+/).map((w) => w[0]).slice(0, 2).join('');

    el.innerHTML =
      '<div class="wrap site-header__inner">' +
        '<a class="brand" href="' + BASE + 'index.html">' +
          '<span class="brand__mark">' + esc(initials) + '</span>' +
          '<span>' + esc(site.profile.name) +
            '<span class="brand__sub">' + esc(site.profile.headline || '') + '</span>' +
          '</span>' +
        '</a>' +
        '<nav class="nav" id="mainNav" aria-label="Main">' + nav + '</nav>' +
        '<div class="header-actions">' +
          '<button class="icon-btn" id="themeToggle" type="button"></button>' +
          '<button class="icon-btn nav-toggle" id="navToggle" type="button" ' +
            'aria-label="Open menu" aria-expanded="false" aria-controls="mainNav">' +
            icon('menu') + '</button>' +
        '</div>' +
      '</div>';

    $('#themeToggle').addEventListener('click', toggleTheme);
    const tgl = $('#navToggle');
    tgl.addEventListener('click', function () {
      const nv = $('#mainNav');
      const open = nv.classList.toggle('is-open');
      tgl.setAttribute('aria-expanded', String(open));
      tgl.innerHTML = icon(open ? 'close' : 'menu');
    });
    $$('#mainNav a').forEach((a) => a.addEventListener('click', () => {
      $('#mainNav').classList.remove('is-open');
      tgl.setAttribute('aria-expanded', 'false');
      tgl.innerHTML = icon('menu');
    }));
    applyTheme(storedTheme());
  }

  function renderFooter(site) {
    const el = $('#siteFooter');
    if (!el) return;
    const c = site.contact || {};
    const social = (site.social || []).filter((s) => s.url).map((s) =>
      '<a href="' + esc(s.url) + '"' + linkAttrs(s.url) + ' title="' + esc(s.label) + '" ' +
      'aria-label="' + esc(s.label) + '">' + icon(s.icon) + '</a>').join('');
    const navCols = (site.nav || []);
    const half = Math.ceil(navCols.length / 2);
    const col = (items) => '<ul>' + items.map((n) =>
      '<li><a href="' + esc(BASE + n.href) + '">' + esc(n.label) + '</a></li>').join('') + '</ul>';

    el.innerHTML =
      '<div class="wrap">' +
        '<div class="footer-grid">' +
          '<div>' +
            '<h4>' + esc(site.profile.name) + '</h4>' +
            '<p class="muted" style="font-size:.88rem;max-width:38ch">' +
              esc(site.profile.role) + ', ' + esc(site.profile.department) + ', ' +
              esc(site.profile.institution) + '.</p>' +
            '<div class="social-row" style="margin-top:1rem">' + social + '</div>' +
          '</div>' +
          '<div><h4>Explore</h4>' + col(navCols.slice(0, half)) + '</div>' +
          '<div><h4>More</h4>' + col(navCols.slice(half)) + '</div>' +
          '<div><h4>Contact</h4><ul>' +
            '<li><a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a></li>' +
            (c.phone ? '<li class="muted">' + esc(c.phone) + '</li>' : '') +
            (c.address ? '<li class="muted">' + esc(c.address) + '</li>' : '') +
          '</ul></div>' +
        '</div>' +
        '<div class="footer-bottom">' +
          '<span>&copy; ' + new Date().getFullYear() + ' ' + esc(site.profile.name) +
            '. All rights reserved.</span>' +
          '<span>Built as a static site &middot; hosted on GitHub Pages</span>' +
        '</div>' +
      '</div>';
  }

  /* ------------------------------------------------------------- ticker */
  function renderTicker(news) {
    const el = $('#newsTicker');
    if (!el) return;
    const items = (news || []).slice()
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 10);
    if (!items.length) { el.remove(); return; }

    const one = items.map((n) => {
      const inner =
        '<span class="ticker__kind">' + esc(n.type || 'news') + '</span>' +
        '<span class="ticker__date">' + esc(fmtDate(n.date, { year: 'numeric', month: 'short' })) + '</span>' +
        '<span>' + esc(n.title) + '</span>';
      return n.url
        ? '<a class="ticker__item" href="' + esc(n.url) + '"' + linkAttrs(n.url) + '>' + inner + '</a>'
        : '<span class="ticker__item">' + inner + '</span>';
    }).join('');

    el.innerHTML =
      '<div class="ticker__inner">' +
        '<span class="ticker__label"><span class="dot"></span>Latest</span>' +
        '<div class="ticker__viewport"><div class="ticker__track">' + one + one + '</div></div>' +
      '</div>';
    // Duration proportional to content so speed stays constant.
    const track = $('.ticker__track', el);
    const dur = Math.max(28, Math.round(track.scrollWidth / 55));
    track.style.setProperty('--ticker-duration', dur + 's');
  }

  /* ---------------------------------------------------------- renderers */
  const R = {};

  R.hero = function (el, d) {
    const p = d.site.profile, c = d.site.contact;
    const social = (d.site.social || []).filter((s) => s.url).slice(0, 6).map((s) =>
      '<a href="' + esc(s.url) + '"' + linkAttrs(s.url) + ' aria-label="' + esc(s.label) + '" ' +
      'title="' + esc(s.label) + '">' + icon(s.icon) + '</a>').join('');
    el.innerHTML =
      '<div class="wrap hero__grid">' +
        '<div>' +
          '<span class="eyebrow">' + esc(p.tagline) + '</span>' +
          '<h1>' + esc(p.name) + '</h1>' +
          '<div class="hero__role">' + esc(p.headline) + '</div>' +
          '<p class="hero__affil">' + esc(p.role) + ' &middot; ' + esc(p.lab) + '<br>' +
            '<a href="https://muidsi.missouri.edu/" target="_blank" rel="noopener">' +
              esc(p.department) + '</a>, ' +
            '<a href="https://missouri.edu/" target="_blank" rel="noopener">' +
              esc(p.institution) + '</a><br>' +
            '<span class="muted">Advised by </span>' +
            '<a href="' + esc(p.advisorUrl) + '" target="_blank" rel="noopener">' +
              esc(p.advisor) + '</a>' +
          '</p>' +
          '<div class="hero__actions">' +
            '<a class="btn btn--primary" href="' + BASE + 'publications.html">' +
              icon('book') + 'Publications</a>' +
            '<a class="btn btn--ghost" href="' + BASE + 'research.html">' +
              icon('activity') + 'Research</a>' +
            '<a class="btn btn--ghost" href="' + BASE + 'cv.html">' + icon('file') + 'CV</a>' +
            '<a class="btn btn--ghost" href="mailto:' + esc(c.email) + '">' +
              icon('mail') + 'Email</a>' +
          '</div>' +
          '<div class="social-row">' + social + '</div>' +
        '</div>' +
        '<div class="hero__portrait">' +
          '<img src="' + esc(BASE + p.photo) + '" alt="Portrait of ' + esc(p.name) + '" ' +
            'width="640" height="800" fetchpriority="high">' +
        '</div>' +
      '</div>';
  };

  R.stats = function (el, d) {
    const pubs = d.publications || [];
    const stats = (d.site.stats || []).slice();
    // Keep publication counts honest: derive from the data, not a hard-coded number.
    if (stats[0]) stats[0].value = pubs.length;
    if (stats[1]) stats[1].value = pubs.filter((p) => p.type === 'journal').length;
    if (stats[2]) stats[2].value = (d.grants || []).length;
    el.innerHTML = '<div class="wrap"><div class="stats">' + stats.map((s) =>
      '<div class="stat"><div class="stat__value">' + esc(s.value) + esc(s.suffix || '') +
      '</div><div class="stat__label">' + esc(s.label) + '</div></div>').join('') +
      '</div></div>';
  };

  R.about = function (el, d) {
    const p = d.site.profile;
    el.innerHTML =
      '<div class="wrap">' +
        '<div class="section-head"><span class="eyebrow">About</span>' +
          '<h2>Turning clinical data into decisions</h2></div>' +
        '<div class="grid grid-2" style="gap:2.5rem">' +
          '<div>' + p.bio.map((b) => '<p>' + esc(b) + '</p>').join('') +
            '<blockquote class="quote">&ldquo;' + esc(p.quote) + '&rdquo;' +
              '<cite>&mdash; ' + esc(p.quoteAuthor) + '</cite></blockquote>' +
          '</div>' +
          '<div>' +
            '<h3 style="font-family:var(--font-sans);font-size:1rem;font-weight:650;' +
              'letter-spacing:.02em;margin-bottom:1rem">Research interests</h3>' +
            '<div class="grid" style="gap:.85rem">' +
              (p.interests || []).map((i) =>
                '<div class="card card--hover interest-card">' +
                  '<span class="interest-card__icon">' + icon(i.icon) + '</span>' +
                  '<div><h3>' + esc(i.title) + '</h3><p>' + esc(i.description) + '</p></div>' +
                '</div>').join('') +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  };

  function researchItemHTML(r, opts) {
    opts = opts || {};
    const titleInner = r.url
      ? '<a href="' + esc(r.url) + '"' + linkAttrs(r.url) + '>' + esc(r.title) + '</a>'
      : esc(r.title);
    const tags = (r.tags || []).map((t) => '<span class="chip">' + esc(t) + '</span>').join('');
    const abs = opts.short
      ? '<p class="card__body">' + esc(r.abstract.slice(0, 240).trim()) + '&hellip;</p>'
      : '<div class="research-item__abstract">' + esc(r.abstract) + '</div>' +
        '<button class="read-more" type="button">Read full abstract ' + icon('chevron') + '</button>';
    return '<article class="research-item reveal">' +
        '<div>' +
          '<h3>' + titleInner + '</h3>' +
          '<div class="research-item__authors">' + markName(r.authors) + '</div>' +
          abs +
          (tags ? '<div class="chip-row" style="margin-top:.85rem">' + tags + '</div>' : '') +
        '</div>' +
        '<div class="research-item__media">' +
          (r.image ? '<img src="' + esc(BASE + r.image) + '" alt="Figure from: ' + esc(r.title) +
            '" loading="lazy">' : '') +
        '</div>' +
      '</article>';
  }

  R.researchFeatured = function (el, d) {
    const items = (d.research || []).filter((r) => r.featured).slice(0, 4);
    el.innerHTML =
      '<div class="wrap">' +
        '<div class="section-head section-head--row">' +
          '<div><span class="eyebrow">Research</span><h2>Selected work</h2>' +
            '<p>Peer-reviewed studies on clinical prediction, medical imaging, ' +
            'epidemiological modelling and health data systems.</p></div>' +
          '<a class="btn btn--ghost" href="' + BASE + 'research.html">All research ' +
            icon('arrowRight') + '</a>' +
        '</div>' +
        items.map((r) => researchItemHTML(r)).join('') +
      '</div>';
    wireReadMore(el);
  };

  R.researchAll = function (el, d) {
    const items = d.research || [];
    if (!items.length) { el.innerHTML = emptyState('No research highlights yet.'); return; }
    const topics = Array.from(new Set(items.flatMap((r) => r.tags || []))).sort();
    el.innerHTML =
      '<div class="wrap">' +
        '<div class="filter-bar" id="rhFilter">' +
          '<button class="filter-btn is-active" data-topic="">All (' + items.length + ')</button>' +
          topics.map((t) => '<button class="filter-btn" data-topic="' + esc(t) + '">' +
            esc(t) + '</button>').join('') +
        '</div>' +
        '<div id="rhList">' + items.map((r) => researchItemHTML(r)).join('') + '</div>' +
      '</div>';
    wireReadMore(el);
    const list = $('#rhList', el);
    $$('#rhFilter .filter-btn', el).forEach((b) => b.addEventListener('click', function () {
      $$('#rhFilter .filter-btn', el).forEach((x) => x.classList.remove('is-active'));
      b.classList.add('is-active');
      const t = b.dataset.topic;
      $$('.research-item', list).forEach((node, i) => {
        const ok = !t || (items[i].tags || []).indexOf(t) > -1;
        node.style.display = ok ? '' : 'none';
      });
    }));
  };

  function wireReadMore(root) {
    $$('.read-more', root).forEach((btn) => btn.addEventListener('click', function () {
      const box = btn.previousElementSibling;
      const open = box.classList.toggle('is-open');
      btn.classList.toggle('is-open', open);
      btn.innerHTML = (open ? 'Show less ' : 'Read full abstract ') + icon('chevron');
    }));
  }

  function pubHTML(p) {
    const t = p.url
      ? '<a href="' + esc(p.url) + '"' + linkAttrs(p.url) + '>' + esc(p.title) + '</a>'
      : esc(p.title);
    return '<li class="pub" data-type="' + esc(p.type) + '" data-year="' + esc(p.year) + '">' +
      '<span class="pub__ref">' + esc(p.id) + '</span>' +
      '<div>' +
        '<div class="pub__title">' + t + '</div>' +
        '<div class="pub__authors">' + markName(p.authors) + '</div>' +
        (p.venue ? '<div class="pub__venue">' + esc(p.venue) + '</div>' : '') +
        '<div class="pub__foot">' +
          '<span class="chip pub__year">' + esc(p.year) + '</span>' +
          (p.publisher ? '<span class="chip chip--accent">' + esc(p.publisher) + '</span>' : '') +
          (p.tags || []).map((x) => '<span class="chip">' + esc(x) + '</span>').join('') +
          (p.url ? '<a class="btn btn--sm btn--ghost" href="' + esc(p.url) + '"' +
            linkAttrs(p.url) + '>' + icon('link') + 'View</a>' : '') +
        '</div>' +
      '</div></li>';
  }

  const PUB_GROUPS = [
    { key: 'journal', label: 'Journal Articles' },
    { key: 'chapter', label: 'Book Chapters' },
    { key: 'conference', label: 'Conference Papers' },
  ];

  R.publicationsFeatured = function (el, d) {
    const items = (d.publications || []).slice()
      .sort((a, b) => b.year - a.year).slice(0, 6);
    el.innerHTML =
      '<div class="wrap">' +
        '<div class="section-head section-head--row">' +
          '<div><span class="eyebrow">Publications</span><h2>Recent papers</h2></div>' +
          '<a class="btn btn--ghost" href="' + BASE + 'publications.html">' +
            'All ' + (d.publications || []).length + ' publications ' + icon('arrowRight') + '</a>' +
        '</div>' +
        '<ul class="pub-list">' + items.map(pubHTML).join('') + '</ul>' +
      '</div>';
  };

  R.publicationsAll = function (el, d) {
    const items = d.publications || [];
    const years = Array.from(new Set(items.map((p) => p.year))).sort((a, b) => b - a);
    el.innerHTML =
      '<div class="wrap">' +
        '<div class="filter-bar">' +
          '<div class="search-wrap">' + icon('search') +
            '<input class="search-input" id="pubSearch" type="search" ' +
              'placeholder="Search title, author, venue or topic…" aria-label="Search publications">' +
          '</div>' +
          '<button class="filter-btn is-active" data-f="type" data-v="">All types</button>' +
          PUB_GROUPS.map((g) => '<button class="filter-btn" data-f="type" data-v="' + g.key + '">' +
            g.label + ' (' + items.filter((p) => p.type === g.key).length + ')</button>').join('') +
          '<select class="form-select" id="pubYear" style="width:auto;min-width:120px" ' +
            'aria-label="Filter by year"><option value="">All years</option>' +
            years.map((y) => '<option>' + y + '</option>').join('') + '</select>' +
        '</div>' +
        '<p class="muted" id="pubCount" style="font-size:.86rem;margin-bottom:1.5rem"></p>' +
        '<div class="pub-groups" id="pubGroups">' +
          PUB_GROUPS.map((g) => {
            const rows = items.filter((p) => p.type === g.key);
            return '<section data-group="' + g.key + '">' +
              '<div class="pub-group__head"><h3>' + g.label + '</h3>' +
              '<span class="pub-group__count">' + rows.length + ' items</span></div>' +
              '<ul class="pub-list">' + rows.map(pubHTML).join('') + '</ul></section>';
          }).join('') +
        '</div>' +
        '<div class="pub-empty" id="pubEmpty" hidden>No publications match those filters.</div>' +
      '</div>';

    const state = { type: '', year: '', q: '' };
    function apply() {
      let shown = 0;
      $$('#pubGroups section', el).forEach((sec) => {
        let n = 0;
        $$('.pub', sec).forEach((li) => {
          const txt = li.textContent.toLowerCase();
          const ok = (!state.type || li.dataset.type === state.type) &&
            (!state.year || li.dataset.year === state.year) &&
            (!state.q || txt.indexOf(state.q) > -1);
          li.hidden = !ok;
          if (ok) n++;
        });
        sec.hidden = n === 0;
        $('.pub-group__count', sec).textContent = n + ' items';
        shown += n;
      });
      $('#pubCount', el).textContent = 'Showing ' + shown + ' of ' + items.length + ' publications';
      $('#pubEmpty', el).hidden = shown > 0;
    }
    $$('[data-f="type"]', el).forEach((b) => b.addEventListener('click', function () {
      $$('[data-f="type"]', el).forEach((x) => x.classList.remove('is-active'));
      b.classList.add('is-active');
      state.type = b.dataset.v; apply();
    }));
    $('#pubYear', el).addEventListener('change', function () { state.year = this.value; apply(); });
    let t;
    $('#pubSearch', el).addEventListener('input', function () {
      const v = this.value.trim().toLowerCase();
      clearTimeout(t);
      t = setTimeout(() => { state.q = v; apply(); }, 140);
    });
    apply();
  };

  function newsRowHTML(n) {
    return '<article class="news-row">' +
      '<div class="news-row__date">' + esc(fmtDate(n.date)) + '</div>' +
      '<div>' +
        '<h3>' + esc(n.title) + '</h3>' +
        (n.summary ? '<p>' + esc(n.summary) + '</p>' : '') +
        '<div class="news-row__foot">' +
          '<span class="chip chip--accent">' + esc(n.type || 'news') + '</span>' +
          (n.pinned ? '<span class="chip chip--gold">Pinned</span>' : '') +
          (n.url ? '<a class="btn btn--sm btn--ghost" href="' + esc(n.url) + '"' +
            linkAttrs(n.url) + '>' + icon('link') + esc(n.linkLabel || 'Open') + '</a>' : '') +
        '</div>' +
      '</div></article>';
  }

  function sortNews(news) {
    return (news || []).slice().sort((a, b) => {
      if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
      return (b.date || '').localeCompare(a.date || '');
    });
  }

  R.newsRecent = function (el, d) {
    const items = sortNews(d.news).slice(0, 5);
    if (!items.length) { el.innerHTML = ''; return; }
    el.innerHTML =
      '<div class="wrap">' +
        '<div class="section-head section-head--row">' +
          '<div><span class="eyebrow">News</span><h2>Latest updates</h2></div>' +
          '<a class="btn btn--ghost" href="' + BASE + 'news.html">All news ' +
            icon('arrowRight') + '</a>' +
        '</div>' +
        '<div class="news-list">' + items.map(newsRowHTML).join('') + '</div>' +
      '</div>';
  };

  R.newsAll = function (el, d) {
    const items = sortNews(d.news);
    if (!items.length) { el.innerHTML = '<div class="wrap">' +
      emptyState('No news items yet.') + '</div>'; return; }
    const types = Array.from(new Set(items.map((n) => n.type).filter(Boolean))).sort();
    el.innerHTML =
      '<div class="wrap">' +
        '<div class="filter-bar" id="newsFilter">' +
          '<button class="filter-btn is-active" data-v="">All (' + items.length + ')</button>' +
          types.map((t) => '<button class="filter-btn" data-v="' + esc(t) + '">' + esc(t) +
            ' (' + items.filter((n) => n.type === t).length + ')</button>').join('') +
        '</div>' +
        '<div class="news-list" id="newsList">' + items.map(newsRowHTML).join('') + '</div>' +
      '</div>';
    $$('#newsFilter .filter-btn', el).forEach((b) => b.addEventListener('click', function () {
      $$('#newsFilter .filter-btn', el).forEach((x) => x.classList.remove('is-active'));
      b.classList.add('is-active');
      const v = b.dataset.v;
      $$('#newsList .news-row', el).forEach((row, i) => {
        row.hidden = !!v && items[i].type !== v;
      });
    }));
  };

  R.experience = function (el, d) {
    el.innerHTML =
      '<div class="wrap">' +
        '<div class="section-head"><span class="eyebrow">Experience</span>' +
          '<h2>Appointments</h2></div>' +
        '<div class="timeline">' + (d.experience || []).map((e) =>
          '<div class="tl-item' + (e.current ? ' tl-item--current' : '') + '">' +
            '<div class="tl-head"><div>' +
              '<h3>' + esc(e.role) + '</h3>' +
              '<div class="tl-org">' + esc(e.org) +
                (e.org2 ? '<br>' + (e.orgUrl ? '<a href="' + esc(e.orgUrl) +
                  '" target="_blank" rel="noopener">' + esc(e.org2) + '</a>' : esc(e.org2)) : '') +
              '</div>' +
            '</div><div class="tl-period">' + esc(e.period) + '</div></div>' +
            (e.summary ? '<div class="tl-body">' + esc(e.summary) + '</div>' : '') +
          '</div>').join('') +
        '</div>' +
      '</div>';
  };

  R.education = function (el, d) {
    el.innerHTML =
      '<div class="wrap">' +
        '<div class="section-head"><span class="eyebrow">Education</span><h2>Academic training</h2></div>' +
        '<div class="timeline">' + (d.education || []).map((e) =>
          '<div class="tl-item' + (e.current ? ' tl-item--current' : '') + '">' +
            '<div class="tl-head"><div>' +
              '<h3>' + (e.institutionUrl ? '<a href="' + esc(e.institutionUrl) +
                '" target="_blank" rel="noopener">' + esc(e.institution) + '</a>' :
                esc(e.institution)) + '</h3>' +
              '<div class="tl-org">' + esc(e.degree) + '</div>' +
            '</div><div class="tl-period">' + esc(e.period) + '</div></div>' +
            (e.dissertation ? '<div class="tl-body"><b>Dissertation:</b> ' +
              (e.dissertationUrl ? '<a href="' + esc(e.dissertationUrl) +
                '" target="_blank" rel="noopener">' + esc(e.dissertation) + '</a>' :
                esc(e.dissertation)) + '</div>' : '') +
            (e.advisor ? '<div class="tl-body"><b>Advisor:</b> ' +
              (e.advisorUrl ? '<a href="' + esc(e.advisorUrl) + '" target="_blank" rel="noopener">' +
                esc(e.advisor) + '</a>' : esc(e.advisor)) + '</div>' : '') +
          '</div>').join('') +
        '</div>' +
      '</div>';
  };

  R.grants = function (el, d) {
    const items = d.grants || [];
    el.innerHTML =
      '<div class="wrap">' +
        '<div class="section-head"><span class="eyebrow">Funding</span>' +
          '<h2>Grants &amp; funded projects</h2>' +
          '<p>Competitive research funding from national ministries and university research cells.</p></div>' +
        '<div class="grid grid-2">' + items.map((g) =>
          '<article class="card card--hover reveal">' +
            '<div class="chip-row" style="margin-bottom:.6rem">' +
              '<span class="chip chip--accent">' + esc(g.role) + '</span>' +
              (g.period ? '<span class="chip">' + esc(g.period) + '</span>' : '') +
            '</div>' +
            '<h3 class="card__title">' + (g.url ? '<a href="' + esc(g.url) + '"' +
              linkAttrs(g.url) + '>' + esc(g.title) + '</a>' : esc(g.title)) + '</h3>' +
            '<div class="card__meta">' + esc(g.funder) + '</div>' +
            (g.summary ? '<p class="card__body">' + esc(g.summary) + '</p>' : '') +
            (g.location ? '<div class="card__meta" style="margin:.7rem 0 0">' +
              icon('pin', 'inline-icon') + ' ' + esc(g.location) + '</div>' : '') +
          '</article>').join('') +
        '</div>' +
      '</div>';
  };

  R.awards = function (el, d) {
    const items = d.awards || [];
    el.innerHTML =
      '<div class="wrap">' +
        '<div class="section-head"><span class="eyebrow">Recognition</span>' +
          '<h2>Awards &amp; honours</h2></div>' +
        '<div class="grid grid-2">' + items.map((a) =>
          '<article class="card card--hover award-card reveal">' +
            '<span class="award-card__icon">' + icon('award') + '</span>' +
            '<div>' +
              '<h3>' + (a.url ? '<a href="' + esc(a.url) + '"' + linkAttrs(a.url) + '>' +
                esc(a.title) + '</a>' : esc(a.title)) + '</h3>' +
              '<p>' + esc(a.org) + (a.year ? ' &middot; ' + esc(a.year) : '') + '</p>' +
              (a.description ? '<p style="margin-top:.4rem">' + esc(a.description) + '</p>' : '') +
            '</div>' +
          '</article>').join('') +
        '</div>' +
      '</div>';
  };

  R.service = function (el, d) {
    const s = d.service || {};
    const block = (title, ico, rows) => !rows || !rows.length ? '' :
      '<div><h3 style="font-family:var(--font-sans);font-size:1rem;font-weight:650;' +
        'display:flex;align-items:center;gap:.5rem;margin-bottom:.9rem">' +
        icon(ico) + esc(title) + '</h3>' +
      '<ul class="pill-list">' + rows.map((r) =>
        '<li><span><b>' + esc(r.role) + '</b><br><span class="muted">' +
        (r.url ? '<a href="' + esc(r.url) + '"' + linkAttrs(r.url) + '>' + esc(r.org) + '</a>' :
          esc(r.org)) + '</span></span></li>').join('') + '</ul></div>';
    el.innerHTML =
      '<div class="wrap">' +
        '<div class="section-head"><span class="eyebrow">Service</span>' +
          '<h2>Editorial roles &amp; professional networks</h2></div>' +
        '<div class="grid grid-3" style="gap:2rem;align-items:start">' +
          block('Editorial', 'book', s.editorial) +
          block('Memberships', 'users', s.memberships) +
          block('Leadership & mentoring', 'award', s.leadership) +
        '</div>' +
      '</div>';
  };

  R.training = function (el, d) {
    const items = d.training || [];
    if (!items.length) { el.innerHTML = ''; return; }
    el.innerHTML =
      '<div class="wrap">' +
        '<div class="section-head"><span class="eyebrow">Professional development</span>' +
          '<h2>Workshops &amp; training</h2></div>' +
        '<ul class="pill-list">' + items.map((t) =>
          '<li><span><b>' + (t.url ? '<a href="' + esc(t.url) + '"' + linkAttrs(t.url) + '>' +
            esc(t.title) + '</a>' : esc(t.title)) + '</b><br>' +
            '<span class="muted">' + esc(t.org) +
            (t.location ? ' &middot; ' + esc(t.location) : '') +
            (t.period ? ' &middot; ' + esc(t.period) : '') + '</span></span></li>').join('') +
        '</ul>' +
      '</div>';
  };

  R.teaching = function (el, d) {
    const t = d.teaching || {};
    const table = (rows, cap) => '<div class="table-scroll"><table class="course-table">' +
      '<caption class="sr-only">' + esc(cap) + '</caption>' +
      '<thead><tr><th>Code</th><th>Course</th><th>Level</th><th>Institution</th></tr></thead>' +
      '<tbody>' + rows.map((c) => '<tr><td><code>' + esc(c.code) + '</code></td><td>' +
        esc(c.title) + '</td><td class="muted">' + esc(c.level) + '</td><td class="muted">' +
        esc(c.institution) + '</td></tr>').join('') + '</tbody></table></div>';
    el.innerHTML =
      '<div class="wrap">' +
        '<div class="section-head"><span class="eyebrow">Teaching</span>' +
          '<h2>Courses taught</h2>' + (t.intro ? '<p>' + esc(t.intro) + '</p>' : '') + '</div>' +
        '<h3 style="margin-top:2rem">Theory courses</h3>' + table(t.theory || [], 'Theory courses') +
        '<h3 style="margin-top:2.5rem">Laboratory courses</h3>' + table(t.lab || [], 'Lab courses') +
      '</div>';
  };

  R.students = function (el, d) {
    const items = d.students || [];
    if (!items.length) {
      el.innerHTML = '<div class="wrap"><div class="section-head">' +
        '<span class="eyebrow">Mentoring</span><h2>Students &amp; supervision</h2></div>' +
        emptyState('Supervised theses and student projects will be listed here.') + '</div>';
      return;
    }
    el.innerHTML =
      '<div class="wrap">' +
        '<div class="section-head"><span class="eyebrow">Mentoring</span>' +
          '<h2>Students &amp; supervision</h2></div>' +
        '<div class="grid grid-2">' + items.map((s) =>
          '<article class="card card--hover reveal">' +
            '<div class="chip-row" style="margin-bottom:.55rem">' +
              (s.level ? '<span class="chip chip--accent">' + esc(s.level) + '</span>' : '') +
              (s.year ? '<span class="chip">' + esc(s.year) + '</span>' : '') +
              (s.status ? '<span class="chip">' + esc(s.status) + '</span>' : '') +
            '</div>' +
            '<h3 class="card__title">' + esc(s.name) + '</h3>' +
            (s.topic ? '<div class="card__meta">' + esc(s.topic) + '</div>' : '') +
            (s.institution ? '<p class="card__body">' + esc(s.institution) + '</p>' : '') +
            (s.url ? '<div style="margin-top:.8rem"><a class="btn btn--sm btn--ghost" href="' +
              esc(s.url) + '"' + linkAttrs(s.url) + '>' + icon('link') + 'Details</a></div>' : '') +
          '</article>').join('') +
        '</div>' +
      '</div>';
  };

  R.talks = function (el, d) {
    const items = (d.talks || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (!items.length) {
      el.innerHTML = '<div class="wrap">' +
        emptyState('Talks, invited seminars and conference presentations will appear here.') +
        '</div>';
      return;
    }
    el.innerHTML =
      '<div class="wrap"><div class="grid" style="gap:1rem">' + items.map((t) =>
        '<article class="card card--hover reveal">' +
          '<div class="chip-row" style="margin-bottom:.6rem">' +
            (t.type ? '<span class="chip chip--accent">' + esc(t.type) + '</span>' : '') +
            (t.date ? '<span class="chip">' + esc(fmtDate(t.date)) + '</span>' : '') +
            (t.location ? '<span class="chip">' + esc(t.location) + '</span>' : '') +
          '</div>' +
          '<h3 class="card__title">' + esc(t.title) + '</h3>' +
          (t.event ? '<div class="card__meta">' + esc(t.event) + '</div>' : '') +
          (t.summary ? '<p class="card__body">' + esc(t.summary) + '</p>' : '') +
          (t.image ? '<img src="' + esc(BASE + t.image) + '" alt="" loading="lazy" ' +
            'style="margin-top:1rem;border-radius:10px;border:1px solid var(--border)">' : '') +
          ((t.slidesUrl || t.url) ? '<div class="chip-row" style="margin-top:.9rem">' +
            (t.slidesUrl ? '<a class="btn btn--sm btn--ghost" href="' + esc(t.slidesUrl) + '"' +
              linkAttrs(t.slidesUrl) + '>' + icon('file') + 'Slides</a>' : '') +
            (t.url ? '<a class="btn btn--sm btn--ghost" href="' + esc(t.url) + '"' +
              linkAttrs(t.url) + '>' + icon('link') + 'Event</a>' : '') +
            '</div>' : '') +
        '</article>').join('') + '</div></div>';
  };

  R.skills = function (el, d) {
    const s = d.skills || {};
    el.innerHTML =
      '<div class="wrap">' +
        '<div class="section-head"><span class="eyebrow">Toolkit</span><h2>Skills &amp; tools</h2></div>' +
        (s.groups || []).map((g) =>
          '<h3 style="font-family:var(--font-sans);font-size:1rem;font-weight:650;margin:1.6rem 0 .8rem">' +
            esc(g.name) + '</h3>' +
          '<div class="skill-cloud">' + g.items.map((i) =>
            '<span>' + esc(i.label) + '</span>').join('') + '</div>').join('') +
        (s.other && s.other.length ?
          '<h3 style="font-family:var(--font-sans);font-size:1rem;font-weight:650;margin:1.6rem 0 .8rem">' +
            'Other</h3><div class="skill-cloud">' +
          s.other.map((o) => '<span>' + esc(o) + '</span>').join('') + '</div>' : '') +
      '</div>';
  };

  R.gallery = function (el, d) {
    const items = d.gallery || [];
    if (!items.length) { el.innerHTML = '<div class="wrap">' +
      emptyState('Photos will appear here.') + '</div>'; return; }
    const cats = Array.from(new Set(items.map((g) => g.category).filter(Boolean))).sort();
    el.innerHTML =
      '<div class="wrap">' +
        (cats.length > 1 ? '<div class="filter-bar" id="galFilter">' +
          '<button class="filter-btn is-active" data-v="">All</button>' +
          cats.map((c) => '<button class="filter-btn" data-v="' + esc(c) + '">' +
            esc(c) + '</button>').join('') + '</div>' : '') +
        '<div class="gallery-grid" id="galGrid">' + items.map((g, i) =>
          '<figure class="gallery-item" data-i="' + i + '" tabindex="0" role="button" ' +
            'aria-label="Open image: ' + esc(g.caption) + '">' +
            '<img src="' + esc(BASE + g.image) + '" alt="' + esc(g.caption) + '" loading="lazy">' +
            (g.caption ? '<figcaption class="gallery-item__cap">' + esc(g.caption) +
              '</figcaption>' : '') +
          '</figure>').join('') + '</div>' +
      '</div>' +
      '<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer">' +
        '<button class="lightbox__close" aria-label="Close">' + icon('close') + '</button>' +
        '<button class="lightbox__nav lb-prev" aria-label="Previous">' + icon('left') + '</button>' +
        '<img alt="" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">' +
        '<div class="lightbox__cap"></div>' +
        '<button class="lightbox__nav lb-next" aria-label="Next">' + icon('right') + '</button>' +
      '</div>';

    const lb = $('#lightbox', el), lbImg = $('img', lb), lbCap = $('.lightbox__cap', lb);
    let idx = 0;
    function show(i) {
      const visible = $$('#galGrid .gallery-item', el).filter((f) => !f.hidden);
      if (!visible.length) return;
      const order = visible.map((f) => +f.dataset.i);
      idx = (i + order.length) % order.length;
      const g = items[order[idx]];
      lbImg.src = BASE + g.image;
      lbImg.alt = g.caption || '';
      lbCap.textContent = g.caption || '';
      lb.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
    function close() { lb.classList.remove('is-open'); document.body.style.overflow = ''; }
    $$('#galGrid .gallery-item', el).forEach((f) => {
      const open = () => {
        const visible = $$('#galGrid .gallery-item', el).filter((x) => !x.hidden);
        show(visible.indexOf(f));
      };
      f.addEventListener('click', open);
      f.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    $('.lightbox__close', lb).addEventListener('click', close);
    $('.lb-prev', lb).addEventListener('click', () => show(idx - 1));
    $('.lb-next', lb).addEventListener('click', () => show(idx + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
    $$('#galFilter .filter-btn', el).forEach((b) => b.addEventListener('click', function () {
      $$('#galFilter .filter-btn', el).forEach((x) => x.classList.remove('is-active'));
      b.classList.add('is-active');
      const v = b.dataset.v;
      $$('#galGrid .gallery-item', el).forEach((f) => {
        f.hidden = !!v && items[+f.dataset.i].category !== v;
      });
    }));
  };

  R.contact = function (el, d) {
    const c = d.site.contact, s = d.site.social || [];
    el.innerHTML =
      '<div class="wrap"><div class="grid grid-2" style="gap:2.5rem;align-items:start">' +
        '<div>' +
          (c.note ? '<p class="lead">' + esc(c.note) + '</p>' : '') +
          '<ul class="pill-list" style="margin-top:1.5rem">' +
            '<li><span>' + icon('mail') + '</span><span><b>Email</b><br>' +
              '<a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a>' +
              (c.altEmail ? '<br><a href="mailto:' + esc(c.altEmail) + '">' +
                esc(c.altEmail) + '</a>' : '') + '</span></li>' +
            (c.phone ? '<li><span>' + icon('phone') + '</span><span><b>Phone</b><br>' +
              '<a href="tel:' + esc(c.phone.replace(/[^\d+]/g, '')) + '">' +
              esc(c.phone) + '</a></span></li>' : '') +
            '<li><span>' + icon('pin') + '</span><span><b>Office</b><br>' +
              (c.addressLines || []).map(esc).join('<br>') +
              (c.mapUrl ? '<br><a href="' + esc(c.mapUrl) +
                '" target="_blank" rel="noopener">Open in Maps</a>' : '') + '</span></li>' +
          '</ul>' +
        '</div>' +
        '<div>' +
          '<h3 style="font-family:var(--font-sans);font-size:1rem;font-weight:650">Find me online</h3>' +
          '<ul class="pill-list">' + s.filter((x) => x.url).map((x) =>
            '<li><span>' + icon(x.icon) + '</span><a href="' + esc(x.url) + '"' +
            linkAttrs(x.url) + '>' + esc(x.label) + '</a></li>').join('') + '</ul>' +
          '<div class="callout" style="margin-top:1.5rem">' +
            '<b>For prospective students &amp; collaborators:</b> please include a short summary ' +
            'of your background and the problem you want to work on. It helps me reply usefully.' +
          '</div>' +
        '</div>' +
      '</div></div>';
  };

  function emptyState(msg) {
    return '<div class="empty-state">' + icon('inbox') + '<p>' + esc(msg) + '</p></div>';
  }

  /* --------------------------------------------------------- page setup */
  const DEPS = {
    hero: ['site'], stats: ['site', 'publications', 'grants'], about: ['site'],
    researchFeatured: ['research'], researchAll: ['research'],
    publicationsFeatured: ['publications'], publicationsAll: ['publications'],
    newsRecent: ['news'], newsAll: ['news'], experience: ['experience'],
    education: ['education'], grants: ['grants'], awards: ['awards'],
    service: ['service'], training: ['training'], teaching: ['teaching'],
    students: ['students'], talks: ['talks'], skills: ['skills'],
    gallery: ['gallery'], contact: ['site'],
  };

  function reveal() {
    const nodes = $$('.reveal');
    if (!nodes.length) return;
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((n) => n.classList.add('is-visible')); return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .06 });
    nodes.forEach((n) => io.observe(n));
  }

  function toTop() {
    const btn = document.createElement('button');
    btn.className = 'to-top';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = icon('arrowUp');
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    document.body.appendChild(btn);
    const onScroll = () => btn.classList.toggle('is-visible', window.scrollY > 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function jsonLD(site, pubs) {
    const p = site.profile, c = site.contact;
    const data = {
      '@context': 'https://schema.org', '@type': 'Person',
      name: p.name, jobTitle: p.role, email: 'mailto:' + c.email,
      telephone: c.phone, url: site.meta.baseUrl,
      image: site.meta.baseUrl + '/' + p.photo,
      description: site.meta.description,
      affiliation: { '@type': 'CollegeOrUniversity', name: p.institution, url: 'https://missouri.edu/' },
      alumniOf: ['Military Institute of Science and Technology (MIST)',
        'Patuakhali Science and Technology University'],
      knowsAbout: (p.interests || []).map((i) => i.title),
      sameAs: (site.social || []).map((s) => s.url).filter((u) => /^https/.test(u)),
    };
    if (pubs && pubs.length) {
      data.publishingPrinciples = undefined;
      data['@type'] = 'Person';
    }
    const tag = document.createElement('script');
    tag.type = 'application/ld+json';
    tag.textContent = JSON.stringify(data);
    document.head.appendChild(tag);
  }

  async function boot() {
    // Apply the stored theme as early as possible (an inline script in <head>
    // already does this; this call keeps the toggle icon in sync).
    applyTheme(storedTheme());

    const blocks = $$('[data-render]');
    const needed = new Set(['site']);
    blocks.forEach((b) => (DEPS[b.dataset.render] || []).forEach((n) => needed.add(n)));
    if ($('#newsTicker')) needed.add('news');

    const data = await loadAll(Array.from(needed));
    if (!data.site) {
      document.body.insertAdjacentHTML('afterbegin',
        '<div class="wrap" style="padding:3rem 0"><div class="callout">' +
        'Site data could not be loaded. If you are opening these files directly from disk, ' +
        'run a local server instead (for example <code>python3 -m http.server</code>) — ' +
        'browsers block <code>fetch()</code> on <code>file://</code> URLs.</div></div>');
      return;
    }

    renderHeader(data.site);
    renderFooter(data.site);
    renderTicker(data.news);

    blocks.forEach((b) => {
      const fn = R[b.dataset.render];
      if (!fn) { console.warn('No renderer for', b.dataset.render); return; }
      try { fn(b, data); } catch (err) {
        console.error('render ' + b.dataset.render, err);
        b.innerHTML = '<div class="wrap"><div class="callout">This section failed to render.</div></div>';
      }
    });

    // Fill any element marked with data-bind="path.in.site.json"
    $$('[data-bind]').forEach((n) => {
      const v = n.dataset.bind.split('.').reduce((o, k) => (o == null ? o : o[k]), data.site);
      if (v != null) n.textContent = v;
    });

    document.title = document.title.replace('{{name}}', data.site.profile.name);
    jsonLD(data.site, data.publications);
    reveal();
    toTop();
    document.body.dataset.ready = 'true';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
