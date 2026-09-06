/* =============================================================================
   Content Manager — a browser-only CMS for this GitHub Pages site.

   How it works: you sign in with a GitHub fine-grained personal access token
   scoped to this repository. Every edit is written back to the repo's
   /data/*.json files through the GitHub Contents API, straight from your
   browser. There is no server in between. GitHub Pages then rebuilds the site
   automatically (usually within a minute).

   The token is kept in this browser only. It is never bundled into the
   published site and never sent anywhere except api.github.com.
   ============================================================================= */
(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /* ----------------------------------------------------------- collections */
  // kind: 'list' -> JSON array of records;  'doc' -> single JSON object.
  // template: the blank record used by "Add new".
  // hints: per-key overrides for the field type.
  const COLLECTIONS = [
    {
      id: 'news', file: 'news', kind: 'list', group: 'Dynamic content',
      label: 'News & updates',
      desc: 'Everything here feeds the scrolling ticker, the News page and the "Latest updates" block on the home page.',
      titleKey: 'title', subtitleKey: 'date',
      sort: (a, b) => (b.date || '').localeCompare(a.date || ''),
      hints: {
        date: 'date', summary: 'textarea', url: 'url', image: 'image',
        type: { type: 'select', options: ['paper', 'award', 'talk', 'position', 'grant', 'media', 'teaching', 'other'] },
      },
      template: {
        id: '', date: '', type: 'paper', title: '', summary: '',
        url: '', linkLabel: 'Read more', image: '', pinned: false,
      },
      autoId: (r) => 'n' + (r.date || new Date().toISOString().slice(0, 10)),
    },
    {
      id: 'publications', file: 'publications', kind: 'list', group: 'Scholarship',
      label: 'Publications',
      desc: 'Journal articles, book chapters and conference papers. The reference tag (J25, Ch10, C17…) is what appears in the badge on the site.',
      titleKey: 'title', subtitleKey: 'venue',
      hints: {
        title: 'textarea', authors: 'textarea', venue: 'textarea', url: 'url',
        year: 'number', image: 'image', tags: 'tags',
        type: { type: 'select', options: ['journal', 'chapter', 'conference'] },
      },
      template: {
        id: '', ref: '', type: 'journal', year: new Date().getFullYear(),
        authors: '', title: '', venue: '', url: '', publisher: '',
        featured: false, image: '', tags: [],
      },
    },
    {
      id: 'research', file: 'research', kind: 'list', group: 'Scholarship',
      label: 'Research highlights',
      desc: 'The long-form entries with figures and abstracts on the Research page. The first few also appear on the home page.',
      titleKey: 'title', subtitleKey: 'pubId',
      hints: { title: 'textarea', authors: 'textarea', abstract: 'textarea', url: 'url', image: 'image', tags: 'tags' },
      template: {
        id: '', title: '', authors: '', abstract: '', image: '',
        url: '', tags: [], featured: false, pubId: '',
      },
    },
    {
      id: 'talks', file: 'talks', kind: 'list', group: 'Scholarship',
      label: 'Talks & presentations',
      desc: 'Invited seminars, conference talks, posters and panels.',
      titleKey: 'title', subtitleKey: 'event',
      sort: (a, b) => (b.date || '').localeCompare(a.date || ''),
      hints: {
        date: 'date', summary: 'textarea', url: 'url', slidesUrl: 'url', image: 'image',
        type: { type: 'select', options: ['Invited talk', 'Conference talk', 'Poster', 'Panel', 'Workshop', 'Seminar'] },
      },
      template: {
        id: '', date: '', type: 'Conference talk', title: '', event: '',
        location: '', summary: '', url: '', slidesUrl: '', image: '',
      },
    },
    {
      id: 'grants', file: 'grants', kind: 'list', group: 'Scholarship',
      label: 'Grants & projects',
      titleKey: 'title', subtitleKey: 'funder',
      hints: { title: 'textarea', funder: 'textarea', summary: 'textarea', url: 'url' },
      template: {
        id: '', title: '', role: 'Principal Investigator', funder: '',
        location: '', period: '', amount: '', url: '', summary: '',
      },
    },
    {
      id: 'awards', file: 'awards', kind: 'list', group: 'Recognition',
      label: 'Awards & honours',
      titleKey: 'title', subtitleKey: 'org',
      hints: { description: 'textarea', url: 'url', image: 'image' },
      template: { id: '', title: '', org: '', year: '', url: '', image: '', featured: false, description: '' },
    },
    {
      id: 'service', file: 'service', kind: 'doc', group: 'Recognition',
      label: 'Editorial & service',
      desc: 'Editorial boards, professional memberships and leadership roles.',
      hints: { url: 'url' },
    },
    {
      id: 'training', file: 'training', kind: 'list', group: 'Recognition',
      label: 'Workshops & training',
      titleKey: 'title', subtitleKey: 'org',
      hints: { url: 'url' },
      template: { id: '', title: '', org: '', location: '', period: '', year: '', url: '' },
    },
    {
      id: 'experience', file: 'experience', kind: 'list', group: 'Profile',
      label: 'Work experience',
      titleKey: 'role', subtitleKey: 'period',
      hints: { summary: 'textarea', orgUrl: 'url', highlights: 'tags' },
      template: {
        id: '', role: '', org: '', org2: '', orgUrl: '', location: '',
        start: '', end: '', period: '', current: false, summary: '', highlights: [],
      },
    },
    {
      id: 'education', file: 'education', kind: 'list', group: 'Profile',
      label: 'Education',
      titleKey: 'institution', subtitleKey: 'degree',
      hints: { institutionUrl: 'url', dissertationUrl: 'url', advisorUrl: 'url', dissertation: 'textarea' },
      template: {
        id: '', institution: '', institutionUrl: '', degree: '', field: '',
        location: '', period: '', start: '', end: '',
        dissertation: '', dissertationUrl: '', advisor: '', advisorUrl: '', current: false,
      },
    },
    {
      id: 'students', file: 'students', kind: 'list', group: 'Profile',
      label: 'Students & mentoring',
      titleKey: 'name', subtitleKey: 'topic',
      hints: { topic: 'textarea', url: 'url',
        level: { type: 'select', options: ['Undergraduate', "Master's", 'PhD', 'Intern', 'Other'] } },
      template: { id: '', name: '', level: 'Undergraduate', year: '', topic: '', institution: '', status: 'Completed', url: '' },
    },
    {
      id: 'teaching', file: 'teaching', kind: 'doc', group: 'Profile',
      label: 'Teaching (courses)',
      desc: 'Course tables for the Teaching page.',
      hints: { intro: 'textarea' },
    },
    {
      id: 'skills', file: 'skills', kind: 'doc', group: 'Profile',
      label: 'Skills & tools',
      hints: { other: 'tags' },
    },
    {
      id: 'gallery', file: 'gallery', kind: 'list', group: 'Media',
      label: 'Photo gallery',
      titleKey: 'caption', subtitleKey: 'category',
      hints: { image: 'image', date: 'text' },
      template: { id: '', image: '', caption: '', category: '', date: '' },
    },
    {
      id: 'site', file: 'site', kind: 'doc', group: 'Settings',
      label: 'Site & profile',
      desc: 'Your name, headline, bio, contact details, social links, navigation and the numbers in the stats strip.',
      hints: {
        description: 'textarea', bio: 'tags-multiline', photo: 'image', cvUrl: 'url',
        quote: 'textarea', note: 'textarea', url: 'url', advisorUrl: 'url',
        mapUrl: 'url', keywords: 'textarea', addressLines: 'tags-multiline',
      },
    },
  ];

  const byId = {};
  COLLECTIONS.forEach((c) => { byId[c.id] = c; });

  /* -------------------------------------------------------------- storage */
  const LS = 'skd-admin-cfg';
  function saveCfg(cfg, persist) {
    try {
      (persist ? localStorage : sessionStorage).setItem(LS, JSON.stringify(cfg));
      (persist ? sessionStorage : localStorage).removeItem(LS);
    } catch (e) { /* private browsing */ }
  }
  function readCfg() {
    try {
      return JSON.parse(localStorage.getItem(LS) || sessionStorage.getItem(LS) || 'null');
    } catch (e) { return null; }
  }
  function clearCfg() {
    try { localStorage.removeItem(LS); sessionStorage.removeItem(LS); } catch (e) {}
  }

  /* ------------------------------------------------------------ GitHub API */
  const state = { cfg: null, files: {}, active: null, raw: false };

  function b64encode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(bin);
  }
  function b64decode(b64) {
    const bin = atob(b64.replace(/\s/g, ''));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }

  async function gh(path, opts) {
    const cfg = state.cfg;
    const res = await fetch('https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo + path,
      Object.assign({
        headers: {
          Authorization: 'Bearer ' + cfg.token,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }, opts || {}));
    if (!res.ok) {
      let msg = res.status + ' ' + res.statusText;
      try { const j = await res.json(); if (j.message) msg = j.message; } catch (e) {}
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }
    return res.status === 204 ? null : res.json();
  }

  const getFile = (p) => gh('/contents/' + p + '?ref=' + encodeURIComponent(state.cfg.branch) +
    '&t=' + Date.now());

  function putFile(path, contentB64, message, sha) {
    return gh('/contents/' + path, {
      method: 'PUT',
      body: JSON.stringify({
        message: message, content: contentB64, branch: state.cfg.branch,
        sha: sha || undefined,
      }),
    });
  }

  /* ---------------------------------------------------------------- toasts */
  function toast(msg, kind, ms) {
    const el = document.createElement('div');
    el.className = 'toast ' + (kind || 'info');
    el.textContent = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => el.remove(), ms || 4200);
  }

  function confirmBox(title, body, okLabel) {
    return new Promise((resolve) => {
      const m = $('#modal');
      $('#modalTitle').textContent = title;
      $('#modalBody').textContent = body;
      $('#modalOk').textContent = okLabel || 'Confirm';
      m.hidden = false;
      const done = (v) => {
        m.hidden = true;
        $('#modalOk').removeEventListener('click', ok);
        $('#modalCancel').removeEventListener('click', cancel);
        resolve(v);
      };
      const ok = () => done(true);
      const cancel = () => done(false);
      $('#modalOk').addEventListener('click', ok);
      $('#modalCancel').addEventListener('click', cancel);
    });
  }

  /* ----------------------------------------------------------------- auth */
  async function connect(cfg) {
    state.cfg = cfg;
    const repo = await gh('');
    if (!repo.permissions || !repo.permissions.push) {
      throw new Error('This token can read ' + cfg.owner + '/' + cfg.repo +
        ' but cannot write to it. Give it "Contents: Read and write".');
    }
    return repo;
  }

  $('#authForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = $('#authBtn'), msg = $('#authMsg');
    btn.disabled = true; btn.textContent = 'Connecting…';
    msg.hidden = true; msg.classList.remove('ok');
    const cfg = {
      owner: $('#ghOwner').value.trim(),
      repo: $('#ghRepo').value.trim(),
      branch: $('#ghBranch').value.trim() || 'main',
      token: $('#ghToken').value.trim(),
    };
    try {
      await connect(cfg);
      saveCfg(cfg, $('#ghRemember').checked);
      startApp();
    } catch (err) {
      msg.textContent = friendlyError(err, cfg);
      msg.hidden = false;
    } finally {
      btn.disabled = false; btn.textContent = 'Connect to GitHub';
    }
  });

  function friendlyError(err, cfg) {
    const m = String(err.message || err);
    if (err.status === 401) return 'GitHub rejected the token. Check that you pasted it fully and that it has not expired.';
    if (err.status === 404) {
      return 'Could not find ' + cfg.owner + '/' + cfg.repo + '. Either the name is wrong, or the ' +
        'token is not scoped to include this repository.';
    }
    if (err.status === 403) return 'GitHub refused the request (403). The token may lack "Contents: Read and write", or you have hit the rate limit.';
    if (err.status === 409) return 'This file changed on GitHub since it was loaded. Press Reload, then re-apply your edit.';
    if (/Failed to fetch|NetworkError/i.test(m)) return 'Could not reach api.github.com. Check your connection.';
    return m;
  }

  /* ------------------------------------------------------------ navigation */
  function renderNav() {
    const nav = $('#adminNav');
    const groups = [];
    COLLECTIONS.forEach((c) => {
      let g = groups.find((x) => x.name === c.group);
      if (!g) { g = { name: c.group, items: [] }; groups.push(g); }
      g.items.push(c);
    });
    nav.innerHTML = groups.map((g) =>
      '<div class="admin-nav__group">' + esc(g.name) + '</div>' +
      g.items.map((c) => {
        const f = state.files[c.id];
        const n = f && Array.isArray(f.json) ? f.json.length : '';
        return '<button type="button" data-coll="' + c.id + '"' +
          (state.active === c.id ? ' class="is-active"' : '') + '>' +
          '<span>' + esc(c.label) + '</span>' +
          '<span style="display:flex;align-items:center;gap:.4rem">' +
          (f && f.dirty ? '<span class="dirty-dot" title="Unsaved changes"></span>' : '') +
          '<span class="count">' + n + '</span></span></button>';
      }).join('')
    ).join('') +
      '<div class="admin-nav__group">Help</div>' +
      '<button type="button" data-coll="__help"' +
      (state.active === '__help' ? ' class="is-active"' : '') + '><span>How this works</span></button>';

    $$('#adminNav button').forEach((b) => b.addEventListener('click', () => open(b.dataset.coll)));
  }

  /* ------------------------------------------------------------ data files */
  async function ensureLoaded(id) {
    if (state.files[id]) return state.files[id];
    const c = byId[id];
    const res = await getFile('data/' + c.file + '.json');
    state.files[id] = {
      json: JSON.parse(b64decode(res.content)),
      sha: res.sha,
      dirty: false,
    };
    return state.files[id];
  }

  function markDirty(id) {
    const f = state.files[id];
    if (!f || f.dirty) { updateSaveUI(); return; }
    f.dirty = true;
    renderNav();
    updateSaveUI();
  }

  function updateSaveUI() {
    const f = state.files[state.active];
    const btn = $('#publishBtn'), lbl = $('#saveState');
    if (!f) { btn.disabled = true; lbl.textContent = ''; lbl.className = 'save-state'; return; }
    btn.disabled = !f.dirty;
    lbl.textContent = f.dirty ? 'Unsaved changes' : 'All changes published';
    lbl.className = 'save-state ' + (f.dirty ? 'dirty' : 'ok');
  }

  /* --------------------------------------------------------- field builder */
  function hintFor(coll, key, value) {
    const h = (coll.hints || {})[key];
    if (h) return typeof h === 'string' ? { type: h } : h;
    if (typeof value === 'boolean') return { type: 'boolean' };
    if (typeof value === 'number') return { type: 'number' };
    if (Array.isArray(value)) {
      return value.every((v) => typeof v === 'string' || typeof v === 'number')
        ? { type: 'tags' } : { type: 'repeater' };
    }
    if (value && typeof value === 'object') return { type: 'object' };
    if (/url$/i.test(key)) return { type: 'url' };
    if (/^date$/i.test(key)) return { type: 'date' };
    if (/(image|photo|thumb)$/i.test(key)) return { type: 'image' };
    if (typeof value === 'string' && value.length > 150) return { type: 'textarea' };
    return { type: 'text' };
  }

  const LABELS = {
    id: 'ID (internal)', url: 'Link URL', linkLabel: 'Link button text',
    org: 'Organisation', org2: 'Organisation (secondary)', orgUrl: 'Organisation website',
    pubId: 'Linked publication ID', ref: 'Reference tag',
  };
  function labelFor(key) {
    if (LABELS[key]) return LABELS[key];
    return key.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/^./, (s) => s.toUpperCase())
      .replace(/\bUrl\b/g, 'URL');
  }

  /**
   * Build an editor for one value.
   * @param {object} ctx  {coll, collId}
   * @param {object} owner  the object that holds the value
   * @param {string} key    the property name on `owner`
   */
  function buildField(ctx, owner, key) {
    const value = owner[key];
    const hint = hintFor(ctx.coll, key, value);
    const row = document.createElement('div');
    row.className = 'form-row';
    const id = 'f_' + Math.random().toString(36).slice(2, 9);
    const touch = () => markDirty(ctx.collId);

    const label = document.createElement('label');
    label.setAttribute('for', id);
    label.textContent = labelFor(key);

    let input;

    switch (hint.type) {
      case 'boolean': {
        row.className = 'form-row form-row--inline';
        input = document.createElement('input');
        input.type = 'checkbox';
        input.id = id;
        input.checked = !!value;
        input.addEventListener('change', () => { owner[key] = input.checked; touch(); });
        row.append(input, label);
        return row;
      }
      case 'number': {
        input = document.createElement('input');
        input.type = 'number'; input.className = 'form-input'; input.id = id;
        input.value = value == null ? '' : value;
        input.addEventListener('input', () => {
          owner[key] = input.value === '' ? '' : Number(input.value); touch();
        });
        break;
      }
      case 'date': {
        input = document.createElement('input');
        input.type = 'date'; input.className = 'form-input'; input.id = id;
        input.value = value || '';
        input.addEventListener('input', () => { owner[key] = input.value; touch(); });
        break;
      }
      case 'select': {
        input = document.createElement('select');
        input.className = 'form-select'; input.id = id;
        const opts = hint.options.slice();
        if (value && opts.indexOf(value) === -1) opts.unshift(value);
        input.innerHTML = opts.map((o) =>
          '<option' + (o === value ? ' selected' : '') + '>' + esc(o) + '</option>').join('');
        input.addEventListener('change', () => { owner[key] = input.value; touch(); });
        break;
      }
      case 'textarea': {
        input = document.createElement('textarea');
        input.className = 'form-textarea'; input.id = id;
        input.rows = Math.min(14, Math.max(3, Math.ceil((value || '').length / 90) + 1));
        input.value = value || '';
        input.addEventListener('input', () => { owner[key] = input.value; touch(); });
        break;
      }
      case 'url': {
        input = document.createElement('input');
        input.type = 'url'; input.className = 'form-input'; input.id = id;
        input.placeholder = 'https://…';
        input.value = value || '';
        input.addEventListener('input', () => { owner[key] = input.value.trim(); touch(); });
        break;
      }
      case 'image': {
        row.append(label, buildImageField(ctx, owner, key, id));
        return row;
      }
      case 'tags':
      case 'tags-multiline': {
        row.append(label, buildTagField(ctx, owner, key, hint.type === 'tags-multiline'));
        return row;
      }
      case 'repeater': {
        row.append(label, buildRepeater(ctx, owner, key));
        return row;
      }
      case 'object': {
        const fs = document.createElement('fieldset');
        fs.className = 'sub';
        const lg = document.createElement('legend');
        lg.textContent = labelFor(key);
        fs.appendChild(lg);
        const grid = document.createElement('div');
        grid.className = 'form-grid';
        Object.keys(value).forEach((k) => grid.appendChild(buildField(ctx, value, k)));
        fs.appendChild(grid);
        return fs;
      }
      default: {
        input = document.createElement('input');
        input.type = 'text'; input.className = 'form-input'; input.id = id;
        input.value = value == null ? '' : value;
        input.addEventListener('input', () => { owner[key] = input.value; touch(); });
      }
    }

    row.append(label, input);
    if (key === 'id') {
      const hintEl = document.createElement('span');
      hintEl.className = 'hint';
      hintEl.textContent = 'Used internally. Keep it unique; letters, numbers and dashes only.';
      row.appendChild(hintEl);
    }
    return row;
  }

  function buildImageField(ctx, owner, key, id) {
    const wrap = document.createElement('div');
    wrap.className = 'img-field';
    const img = document.createElement('img');
    img.className = 'img-field__preview';
    img.alt = '';
    const setPreview = () => {
      const v = owner[key];
      img.src = v ? (/^https?:/.test(v) ? v : '../' + v) : '';
      img.style.visibility = v ? 'visible' : 'hidden';
    };
    const ctrl = document.createElement('div');
    ctrl.className = 'img-field__ctrl';
    const text = document.createElement('input');
    text.type = 'text'; text.className = 'form-input'; text.id = id;
    text.placeholder = 'assets/uploads/my-photo.jpg';
    text.value = owner[key] || '';
    text.addEventListener('input', () => {
      owner[key] = text.value.trim(); setPreview(); markDirty(ctx.collId);
    });

    const file = document.createElement('input');
    file.type = 'file'; file.accept = 'image/*'; file.hidden = true;
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'btn btn--ghost btn--sm';
    btn.textContent = 'Upload an image…';
    btn.addEventListener('click', () => file.click());

    file.addEventListener('change', async () => {
      const f = file.files[0];
      if (!f) return;
      if (f.size > 6 * 1024 * 1024) {
        toast('That image is larger than 6 MB. Please resize it first.', 'bad', 6000);
        file.value = ''; return;
      }
      btn.disabled = true; btn.textContent = 'Uploading…';
      try {
        const path = await uploadImage(f);
        owner[key] = path;
        text.value = path;
        setPreview();
        markDirty(ctx.collId);
        toast('Image uploaded to ' + path, 'ok');
      } catch (err) {
        toast('Upload failed: ' + friendlyError(err, state.cfg), 'bad', 7000);
      } finally {
        btn.disabled = false; btn.textContent = 'Upload an image…'; file.value = '';
      }
    });

    ctrl.append(text, btn, file);
    wrap.append(img, ctrl);
    setPreview();
    return wrap;
  }

  function slugify(s) {
    return String(s).toLowerCase().replace(/\.[a-z0-9]+$/, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'image';
  }

  async function uploadImage(file) {
    const ext = (file.name.match(/\.([a-z0-9]+)$/i) || [, 'jpg'])[1].toLowerCase();
    const name = slugify(file.name) + '-' + Date.now().toString(36) + '.' + ext;
    const path = 'assets/uploads/' + name;
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let bin = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    await putFile(path, btoa(bin), 'Upload image ' + name + ' via Content Manager');
    return path;
  }

  function buildTagField(ctx, owner, key, multiline) {
    const box = document.createElement('div');
    if (!Array.isArray(owner[key])) owner[key] = owner[key] ? [owner[key]] : [];

    if (multiline) {
      // Long paragraphs (bio, address lines) — one entry per blank-line block.
      const ta = document.createElement('textarea');
      ta.className = 'form-textarea';
      ta.rows = 10;
      ta.value = owner[key].join('\n\n');
      const hint = document.createElement('span');
      hint.className = 'hint';
      hint.textContent = 'One paragraph per block; separate blocks with a blank line.';
      ta.addEventListener('input', () => {
        owner[key] = ta.value.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
        markDirty(ctx.collId);
      });
      box.append(ta, hint);
      return box;
    }

    box.className = 'tag-editor';
    const input = document.createElement('input');
    input.placeholder = 'Type and press Enter…';
    function draw() {
      $$('.chip', box).forEach((c) => c.remove());
      owner[key].forEach((v, i) => {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = v;
        const x = document.createElement('button');
        x.type = 'button'; x.innerHTML = '&times;'; x.title = 'Remove';
        x.addEventListener('click', () => {
          owner[key].splice(i, 1); draw(); markDirty(ctx.collId);
        });
        chip.appendChild(x);
        box.insertBefore(chip, input);
      });
    }
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const v = input.value.trim();
        if (v) { owner[key].push(v); input.value = ''; draw(); markDirty(ctx.collId); }
      } else if (e.key === 'Backspace' && !input.value && owner[key].length) {
        owner[key].pop(); draw(); markDirty(ctx.collId);
      }
    });
    box.appendChild(input);
    draw();
    return box;
  }

  function blankLike(sample) {
    if (Array.isArray(sample)) return [];
    if (sample && typeof sample === 'object') {
      const o = {};
      Object.keys(sample).forEach((k) => { o[k] = blankLike(sample[k]); });
      return o;
    }
    if (typeof sample === 'boolean') return false;
    if (typeof sample === 'number') return 0;
    return '';
  }

  function buildRepeater(ctx, owner, key) {
    const wrap = document.createElement('div');
    wrap.className = 'repeater';
    const arr = owner[key];

    function draw() {
      wrap.innerHTML = '';
      arr.forEach((item, i) => {
        const row = document.createElement('div');
        row.className = 'repeater__row';
        const head = document.createElement('div');
        head.className = 'repeater__row-head';
        head.innerHTML = '<span>' + esc(labelFor(key)) + ' ' + (i + 1) + '</span>';
        const tools = document.createElement('div');
        tools.style.display = 'flex'; tools.style.gap = '.2rem';
        tools.append(
          miniBtn('↑', 'Move up', () => { if (i > 0) { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); draw(); markDirty(ctx.collId); } }),
          miniBtn('↓', 'Move down', () => { if (i < arr.length - 1) { arr.splice(i + 1, 0, arr.splice(i, 1)[0]); draw(); markDirty(ctx.collId); } }),
          miniBtn('×', 'Remove', () => { arr.splice(i, 1); draw(); markDirty(ctx.collId); }, true)
        );
        head.appendChild(tools);
        row.appendChild(head);
        const grid = document.createElement('div');
        grid.className = 'form-grid';
        grid.style.paddingTop = '0';
        if (item && typeof item === 'object') {
          Object.keys(item).forEach((k) => grid.appendChild(buildField(ctx, item, k)));
        }
        row.appendChild(grid);
        wrap.appendChild(row);
      });
      const add = document.createElement('button');
      add.type = 'button'; add.className = 'btn btn--ghost btn--sm';
      add.textContent = '+ Add ' + labelFor(key).toLowerCase().replace(/s$/, '');
      add.addEventListener('click', () => {
        arr.push(blankLike(arr[0] || { role: '', org: '', url: '', period: '' }));
        draw(); markDirty(ctx.collId);
      });
      wrap.appendChild(add);
    }
    draw();
    return wrap;
  }

  function miniBtn(txt, title, fn, danger) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mini-btn' + (danger ? ' danger' : '');
    b.title = title;
    b.setAttribute('aria-label', title);
    b.textContent = txt;
    b.addEventListener('click', (e) => { e.stopPropagation(); fn(); });
    return b;
  }

  /* ------------------------------------------------------------ collection */
  async function open(id) {
    state.active = id;
    state.raw = false;
    renderNav();
    const content = $('#adminContent');

    if (id === '__help') {
      $('#collTitle').textContent = 'How this works';
      $('#collDesc').textContent = '';
      $('#publishBtn').disabled = true;
      $('#saveState').textContent = '';
      content.innerHTML = helpHTML();
      return;
    }

    const c = byId[id];
    $('#collTitle').textContent = c.label;
    $('#collDesc').textContent = c.desc || '';
    content.innerHTML = '<div class="loading"><div class="spinner"></div>Loading ' +
      esc(c.file) + '.json…</div>';

    try {
      await ensureLoaded(id);
    } catch (err) {
      content.innerHTML = '<div class="callout">Could not load <code>data/' + esc(c.file) +
        '.json</code>: ' + esc(friendlyError(err, state.cfg)) + '</div>';
      return;
    }
    renderNav();
    render();
  }

  function render() {
    const id = state.active;
    const c = byId[id];
    const f = state.files[id];
    const content = $('#adminContent');
    updateSaveUI();

    if (state.raw) { renderRaw(c, f, content); return; }
    if (c.kind === 'doc') { renderDoc(c, f, content); return; }
    renderList(c, f, content);
  }

  function renderDoc(c, f, content) {
    content.innerHTML = '';
    const ctx = { coll: c, collId: c.id };
    const card = document.createElement('div');
    card.className = 'item is-open';
    const body = document.createElement('div');
    body.className = 'item__body';
    body.style.borderTop = '0';
    const grid = document.createElement('div');
    grid.className = 'form-grid';
    Object.keys(f.json).forEach((k) => grid.appendChild(buildField(ctx, f.json, k)));
    body.appendChild(grid);
    card.appendChild(body);
    content.appendChild(card);
  }

  function renderList(c, f, content) {
    const ctx = { coll: c, collId: c.id };
    if (!Array.isArray(f.json)) f.json = [];
    content.innerHTML = '';

    const bar = document.createElement('div');
    bar.className = 'item-toolbar';
    const add = document.createElement('button');
    add.className = 'btn btn--primary btn--sm';
    add.type = 'button';
    add.textContent = '+ Add new';
    add.addEventListener('click', () => {
      const rec = JSON.parse(JSON.stringify(c.template || {}));
      if (!rec.id) {
        rec.id = (c.id.slice(0, 2) + '-' + Date.now().toString(36));
      }
      if (rec.date === '') rec.date = new Date().toISOString().slice(0, 10);
      f.json.unshift(rec);
      markDirty(c.id);
      render();
      const first = $('.item', content);
      if (first) { first.classList.add('is-open'); first.scrollIntoView({ block: 'center' }); }
    });

    const search = document.createElement('input');
    search.className = 'search-input';
    search.type = 'search';
    search.placeholder = 'Filter ' + c.label.toLowerCase() + '…';
    search.style.maxWidth = '260px';

    const sortBtn = document.createElement('button');
    sortBtn.className = 'btn btn--ghost btn--sm';
    sortBtn.type = 'button';
    sortBtn.textContent = c.sort ? 'Sort newest first' : 'Reverse order';
    sortBtn.addEventListener('click', () => {
      if (c.sort) f.json.sort(c.sort); else f.json.reverse();
      markDirty(c.id); render();
    });

    const count = document.createElement('span');
    count.className = 'muted';
    count.style.fontSize = '.84rem';
    count.textContent = f.json.length + ' items';

    bar.append(add, search, sortBtn, count);
    content.appendChild(bar);

    const list = document.createElement('div');
    list.className = 'item-list';
    content.appendChild(list);

    if (!f.json.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = '<p><b>Nothing here yet.</b><br>Press <b>+ Add new</b> above to create ' +
        'your first entry — it appears on the site as soon as you publish.</p>';
      list.appendChild(empty);
    }

    f.json.forEach((rec, i) => {
      const item = document.createElement('article');
      item.className = 'item';

      const head = document.createElement('div');
      head.className = 'item__head';
      head.setAttribute('role', 'button');
      head.setAttribute('tabindex', '0');

      const grip = document.createElement('span');
      grip.className = 'item__grip';
      grip.textContent = String(i + 1).padStart(2, '0');

      const lab = document.createElement('div');
      lab.className = 'item__label';
      const title = rec[c.titleKey] || rec.title || rec.name || '(untitled)';
      const sub = [rec[c.subtitleKey], rec.year, rec.type].filter(Boolean).join(' · ');
      lab.innerHTML = '<strong>' + esc(String(title).slice(0, 110)) + '</strong>' +
        (sub ? '<small>' + esc(sub) + '</small>' : '');

      const tools = document.createElement('div');
      tools.className = 'item__tools';
      tools.append(
        miniBtn('↑', 'Move up', () => {
          if (i > 0) { f.json.splice(i - 1, 0, f.json.splice(i, 1)[0]); markDirty(c.id); render(); }
        }),
        miniBtn('↓', 'Move down', () => {
          if (i < f.json.length - 1) { f.json.splice(i + 1, 0, f.json.splice(i, 1)[0]); markDirty(c.id); render(); }
        }),
        miniBtn('⧉', 'Duplicate', () => {
          const copy = JSON.parse(JSON.stringify(rec));
          copy.id = (copy.id || 'item') + '-copy';
          f.json.splice(i + 1, 0, copy); markDirty(c.id); render();
        }),
        miniBtn('×', 'Delete', async () => {
          const ok = await confirmBox('Delete this item?',
            '“' + String(title).slice(0, 90) + '” will be removed. ' +
            'Nothing is lost until you press Publish.', 'Delete');
          if (ok) { f.json.splice(i, 1); markDirty(c.id); render(); }
        }, true)
      );

      head.append(grip, lab, tools);
      const toggle = () => item.classList.toggle('is-open');
      head.addEventListener('click', toggle);
      head.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });

      const body = document.createElement('div');
      body.className = 'item__body';
      const grid = document.createElement('div');
      grid.className = 'form-grid';
      Object.keys(rec).forEach((k) => grid.appendChild(buildField(ctx, rec, k)));
      body.appendChild(grid);

      item.append(head, body);
      list.appendChild(item);
    });

    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      $$('.item', list).forEach((el, i) => {
        el.hidden = !!q && JSON.stringify(f.json[i]).toLowerCase().indexOf(q) === -1;
      });
    });
  }

  function renderRaw(c, f, content) {
    content.innerHTML = '';
    const note = document.createElement('div');
    note.className = 'callout';
    note.style.marginBottom = '1rem';
    note.innerHTML = 'Direct JSON editing for <code>data/' + esc(c.file) + '.json</code>. ' +
      'Useful for bulk changes and for anything the forms do not cover. ' +
      'Invalid JSON cannot be published.';
    const ta = document.createElement('textarea');
    ta.className = 'raw-editor';
    ta.spellcheck = false;
    ta.value = JSON.stringify(f.json, null, 2);
    const status = document.createElement('div');
    status.className = 'raw-status';
    ta.addEventListener('input', () => {
      try {
        const parsed = JSON.parse(ta.value);
        f.json = parsed;
        status.textContent = 'Valid JSON';
        status.className = 'raw-status good';
        markDirty(c.id);
      } catch (err) {
        status.textContent = 'Invalid JSON: ' + err.message;
        status.className = 'raw-status bad';
        $('#publishBtn').disabled = true;
      }
    });
    content.append(note, ta, status);
  }

  /* --------------------------------------------------------------- publish */
  async function publish() {
    const id = state.active;
    const c = byId[id];
    const f = state.files[id];
    if (!f || !f.dirty) return;
    const btn = $('#publishBtn');
    btn.disabled = true;
    const old = btn.textContent;
    btn.textContent = 'Publishing…';
    try {
      const body = JSON.stringify(f.json, null, 2) + '\n';
      const res = await putFile('data/' + c.file + '.json', b64encode(body),
        'Update ' + c.label.toLowerCase() + ' via Content Manager', f.sha);
      f.sha = res.content.sha;
      f.dirty = false;
      renderNav();
      updateSaveUI();
      toast('Published. GitHub Pages usually shows the change within a minute.', 'ok', 6000);
    } catch (err) {
      if (err.status === 409 || /does not match/i.test(err.message)) {
        toast('This file changed on GitHub since it was loaded. Press Reload, then redo the edit.',
          'bad', 9000);
      } else {
        toast('Could not publish: ' + friendlyError(err, state.cfg), 'bad', 9000);
      }
      btn.disabled = false;
    } finally {
      btn.textContent = old;
    }
  }

  async function reload() {
    const id = state.active;
    if (!byId[id]) return;
    const f = state.files[id];
    if (f && f.dirty) {
      const ok = await confirmBox('Discard unsaved changes?',
        'Reloading fetches the version currently on GitHub and drops your unpublished edits.',
        'Discard and reload');
      if (!ok) return;
    }
    delete state.files[id];
    open(id);
  }

  async function backup() {
    toast('Preparing backup…', 'info');
    const out = {};
    for (const c of COLLECTIONS) {
      try {
        const f = await ensureLoaded(c.id);
        out[c.file] = f.json;
      } catch (e) { out[c.file] = { error: String(e.message || e) }; }
    }
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'site-content-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Backup downloaded.', 'ok');
  }

  function helpHTML() {
    return '<div class="help-panel">' +
      '<h3>Publishing a change</h3>' +
      '<ol>' +
      '<li>Pick a section on the left — News, Publications, Awards, and so on.</li>' +
      '<li>Click an item to expand it, or press <b>+ Add new</b>.</li>' +
      '<li>Edit the fields. A gold dot marks sections with unpublished edits.</li>' +
      '<li>Press <b>Publish</b>. That writes the change to your repository as a commit; ' +
      'GitHub Pages rebuilds the site, usually within a minute.</li>' +
      '</ol>' +
      '<h3>Adding a news item</h3>' +
      '<p>News drives three things at once: the scrolling ticker at the top of the site, the ' +
      'News page, and the “Latest updates” block on the home page. Set the <b>date</b> ' +
      '(newest sorts first), choose a <b>type</b> so it gets the right badge, and add a ' +
      '<b>link</b> if there is something to read.</p>' +
      '<h3>Adding a publication</h3>' +
      '<p>Set <b>type</b> to journal, chapter or conference — that decides which group it lands ' +
      'in. The <b>ID</b> is the small badge shown on the site (J26, Ch11, C18…). Fill in the ' +
      '<b>URL</b> so readers can reach the published version.</p>' +
      '<h3>Images</h3>' +
      '<p>Any image field has an <b>Upload an image</b> button. The file is committed to ' +
      '<code>assets/uploads/</code> in your repository and the path is filled in for you. ' +
      'Resize large photos before uploading — anything under about 1 MB keeps the site fast.</p>' +
      '<h3>Raw JSON</h3>' +
      '<p>The <b>Raw JSON</b> button opens the underlying file for direct editing. Every ' +
      'section is a plain JSON file under <code>data/</code> in your repository, so you can ' +
      'also edit them on github.com if this panel is ever unavailable. Nothing here is locked in.</p>' +
      '<h3>Backups</h3>' +
      '<p><b>Download backup</b> saves every section into one JSON file. Git history is your ' +
      'real backup — every publish is a commit you can revert — but a local copy does no harm.</p>' +
      '<h3>Your token</h3>' +
      '<p>The token lives only in this browser and talks directly to api.github.com. It is not ' +
      'part of the published site. If you ever suspect it has leaked, revoke it at ' +
      '<a href="https://github.com/settings/tokens" target="_blank" rel="noopener">' +
      'github.com/settings/tokens</a> and create a new one. Use <b>Sign out</b> on shared ' +
      'computers.</p>' +
      '</div>';
  }

  /* ------------------------------------------------------------------ boot */
  function startApp() {
    $('#authScreen').hidden = true;
    $('#adminShell').hidden = false;
    $('#repoLabel').textContent = state.cfg.owner + '/' + state.cfg.repo + ' · ' + state.cfg.branch;
    renderNav();
    open('news');
  }

  $('#publishBtn').addEventListener('click', publish);
  $('#reloadBtn').addEventListener('click', reload);
  $('#backupBtn').addEventListener('click', backup);
  $('#rawBtn').addEventListener('click', () => {
    if (!byId[state.active]) return;
    state.raw = !state.raw;
    $('#rawBtn').textContent = state.raw ? 'Form view' : 'Raw JSON';
    render();
  });
  $('#signOutBtn').addEventListener('click', async () => {
    const dirty = Object.keys(state.files).some((k) => state.files[k].dirty);
    if (dirty) {
      const ok = await confirmBox('Sign out with unsaved changes?',
        'Some sections have edits that have not been published. They will be lost.', 'Sign out');
      if (!ok) return;
    }
    clearCfg();
    location.reload();
  });
  $('#themeToggleAdmin').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const next = (cur || (sysDark ? 'dark' : 'light')) === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('skd-theme', next); } catch (e) {}
  });

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); publish(); }
  });
  window.addEventListener('beforeunload', (e) => {
    if (Object.keys(state.files).some((k) => state.files[k].dirty)) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // Auto sign-in if a saved token still works.
  (async function () {
    const cfg = readCfg();
    if (!cfg || !cfg.token) return;
    $('#ghOwner').value = cfg.owner;
    $('#ghRepo').value = cfg.repo;
    $('#ghBranch').value = cfg.branch;
    try {
      await connect(cfg);
      startApp();
    } catch (err) {
      const msg = $('#authMsg');
      msg.textContent = 'Saved sign-in no longer works: ' + friendlyError(err, cfg);
      msg.hidden = false;
      clearCfg();
    }
  })();
})();
