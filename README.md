# samratkumardey.github.io

Personal research portfolio for **Samrat Kumar Dey** — PhD researcher in Medical Informatics,
MU Institute for Data Science and Informatics, University of Missouri-Columbia.

Built as a **static site with a JSON content layer and a browser-based content manager**.
No build step, no framework, no server. It runs on GitHub Pages exactly as it sits in this
repository, and it is designed to still work years from now with no maintenance.

---

## 1. What's in here

```
.
├── index.html              Home — hero, news, research, publications, CV summary
├── research.html           Research highlights (filterable) + grants + skills
├── publications.html       Full publication list: search, type + year filters
├── news.html               All news items
├── talks.html              Talks, presentations, workshops & training
├── teaching.html           Courses taught + student supervision
├── awards.html             Awards, editorial roles, memberships
├── gallery.html            Photo gallery with lightbox
├── cv.html                 Full CV on one page (print → PDF)
├── contact.html            Contact details and profiles
├── 404.html                Not-found page
│
├── data/                   ← ALL CONTENT LIVES HERE (plain JSON)
│   ├── site.json           Profile, bio, contact, socials, navigation, stats
│   ├── news.json           News feed → ticker + news page + home page
│   ├── publications.json   52 publications with DOIs
│   ├── research.json       16 research highlights with abstracts + figures
│   ├── experience.json     Appointments
│   ├── education.json      Degrees
│   ├── grants.json         Funded grants and projects
│   ├── awards.json         Awards and honours
│   ├── service.json        Editorial roles, memberships, leadership
│   ├── teaching.json       Course tables
│   ├── students.json       Supervised students (empty — fill via admin)
│   ├── talks.json          Talks and presentations (empty — fill via admin)
│   ├── training.json       Workshops and professional training
│   ├── skills.json         Skills and tools
│   └── gallery.json        Photo gallery entries
│
├── admin/                  ← THE BACKEND (content manager)
│   ├── index.html
│   ├── admin.js
│   └── admin.css
│
├── assets/
│   ├── css/style.css       One stylesheet, light + dark themes
│   ├── js/app.js           Renderers, theme, ticker, filters, lightbox
│   ├── img/                Figures, portrait, gallery photos
│   └── uploads/            Images uploaded through the admin panel land here
│
├── .nojekyll               Tells GitHub Pages to serve files as-is
├── robots.txt, sitemap.xml, site.webmanifest, favicon.ico
└── README.md
```

**The rule that keeps this maintainable:** HTML files never contain content. They contain
`<section data-render="…">` placeholders. `assets/js/app.js` fetches the matching JSON from
`data/` and renders it. To change what the site says, you change JSON — never HTML.

---

## 2. Deploying to GitHub Pages

If this repo is already `samratkumardey/samratkumardey.github.io`, GitHub Pages is likely
already enabled. Push and you're live:

```bash
git add -A
git commit -m "New research portfolio site"
git push origin main
```

For a fresh setup: **Settings → Pages → Source: Deploy from a branch → `main` / `/ (root)`.**

The site appears at `https://samratkumardey.github.io/` — usually within a minute of pushing.

### Replacing the old site

The previous site's files (`css/`, `js/`, `scss/`, `vendor/`, `img/`, `gallery/`, `test/`,
`analysis_covid19.html`, `visualization.html`) are not used by this version. Keep them if you
like — they do no harm — or archive them first and then remove:

```bash
git checkout -b archive/old-site   # snapshot of the old site
git push origin archive/old-site
git checkout main
git rm -r --cached css js scss vendor img gallery test analysis_covid19.html visualization.html
rm -rf css js scss vendor gallery test analysis_covid19.html visualization.html
git commit -m "Archive previous site"
```

Note: `img/` is referenced by nothing in the new site (figures were re-optimised into
`assets/img/`), but old inbound links may point at it, so removing it is optional.

### Using a custom domain

Add a file named `CNAME` at the repo root containing just your domain (e.g. `samratdey.me`),
then set the domain under **Settings → Pages**. Also update `meta.baseUrl` in
`data/site.json`, `robots.txt` and `sitemap.xml`.

---

## 3. Updating content — the admin panel

Open **`https://samratkumardey.github.io/admin/`** (bookmark it).

### One-time setup: create a token

1. Go to <https://github.com/settings/personal-access-tokens/new>
2. **Token name:** `website-content-manager`
3. **Expiration:** 1 year (you'll need to renew it — GitHub will email you)
4. **Repository access:** *Only select repositories* → `samratkumardey.github.io`
5. **Permissions → Repository permissions → Contents: `Read and write`**
6. Generate, copy the token, paste it into the admin sign-in screen.

### Then, to publish anything

1. Pick a section on the left (News, Publications, Awards, …)
2. Click an item to expand, or press **+ Add new**
3. Edit the fields — a gold dot marks sections with unpublished edits
4. Press **Publish**

Publishing writes a commit to this repository through the GitHub API. GitHub Pages rebuilds
automatically. Every change is in your git history, so anything can be reverted.

### What the panel can do

- Add, edit, duplicate, reorder and delete entries in every section
- Upload images (they're committed to `assets/uploads/` and the path filled in for you)
- Edit any file as raw JSON when the forms aren't enough
- Download a full backup of all content as one JSON file
- Dark and light themes, keyboard shortcut `Ctrl/Cmd+S` to publish

### Being straight about the trade-off

This admin panel is **client-side only** — that's what lets it run on GitHub Pages with no
server and no monthly cost. The consequence: your GitHub token is stored in your browser's
`localStorage` and sent directly from your browser to `api.github.com`. It is never bundled
into the published site and never passes through anyone else's server.

What this means in practice:

- Scope the token to **this repository only**, with **Contents** permission only. Then the
  worst case is limited to this one repo.
- Use **Sign out** on shared or public computers. Or leave "keep me signed in" unchecked, and
  the token is forgotten when the tab closes.
- If a token ever leaks, revoke it at <https://github.com/settings/tokens> and make a new one.
- It's single-user by design. If you ever need multiple editors with real logins, the upgrade
  path is Decap CMS with a small OAuth helper — but that adds a service to keep alive.

### The fallback that always works

Every piece of content is a plain JSON file in `data/`. If the admin panel ever breaks, or you
just prefer it, edit those files directly on github.com (open the file → pencil icon → commit).
The site reads whatever is there. You are never locked in.

---

## 4. Running it locally

`fetch()` is blocked on `file://` URLs, so open it through a local server:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

Any static server works (`npx serve`, `php -S localhost:8000`, VS Code Live Server).

---

## 5. Common edits

| I want to… | Do this |
|---|---|
| Post a news item / paper / award announcement | Admin → **News & updates** → + Add new |
| Add a publication | Admin → **Publications** → + Add new (set `type` and `id`, e.g. `J26`) |
| Add a research highlight with a figure | Admin → **Research highlights** (upload the figure in the Image field) |
| Add a talk | Admin → **Talks & presentations** |
| Change my bio, title or contact details | Admin → **Site & profile** |
| Change the nav menu | Admin → **Site & profile** → `nav` |
| Add a photo to the gallery | Admin → **Photo gallery** → + Add new → upload |
| Add a CV PDF | Upload the PDF to the repo, then set `profile.cvUrl` in **Site & profile** |
| Change colours | `assets/css/style.css`, section 1 — the `:root` and `[data-theme="dark"]` blocks |
| Add a whole new page | Copy an existing page, change `<title>`/meta, add `<section data-render="…">`, add a nav entry in `site.json` |

### Adding a new section type

1. Add `data/mything.json`
2. Add a renderer `R.mything = function (el, d) { … }` in `assets/js/app.js`
3. Register its data dependency in the `DEPS` map at the bottom of `app.js`
4. Add `<section class="section" data-render="mything"></section>` to a page
5. Add an entry to `COLLECTIONS` in `admin/admin.js` so it's editable in the panel

---

## 6. Technical notes

- **No dependencies.** No npm, no bundler, no framework. Two external requests: Google Fonts
  (Inter + Newsreader) and nothing else. Remove the fonts link and the system stack takes over.
- **Themes.** Light by default, dark honoured from the OS, explicit choice stored in
  `localStorage`. An inline script in each `<head>` applies it before first paint so there's no
  flash of the wrong colours.
- **Accessibility.** Semantic landmarks, skip link, keyboard-operable gallery and accordions,
  visible focus rings, `prefers-reduced-motion` respected (the ticker stops animating).
- **SEO.** Per-page canonical URLs, Open Graph and Twitter cards, `schema.org/Person` JSON-LD
  injected at runtime, sitemap, robots (admin excluded).
- **Performance.** Images re-encoded and resized (~14 MB → ~2 MB), lazy loading below the fold,
  one CSS file, one JS file, no blocking scripts.
- **Print.** `cv.html` has a dedicated print stylesheet — browser print → Save as PDF gives a
  clean CV with the site chrome stripped out.

---

## 7. Content provenance

All content was migrated from the previous version of this site: 52 publications with their
DOI/publisher links, 16 research highlights with full abstracts, 7 grants, 11 awards, the
teaching record, service roles and training. Nothing was dropped. The News, Talks and Students
sections are new and start mostly empty — fill them from the admin panel.

---

© Samrat Kumar Dey. Site content all rights reserved; the site scaffolding is yours to reuse.
