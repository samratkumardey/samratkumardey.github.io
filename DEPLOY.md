# Going live — exact steps

Your `SKD website` folder now holds the complete new site, but it is not yet a git repository.
Pick whichever route suits you.

---

## Route A — merge into your existing repo (recommended)

This keeps your repository history and archives the old site on a branch first.

```bash
# 1. Clone your existing repo somewhere separate
cd ~/Desktop
git clone https://github.com/samratkumardey/samratkumardey.github.io.git skd-repo
cd skd-repo

# 2. Snapshot the old site on its own branch, so nothing is ever lost
git checkout -b archive/old-site
git push origin archive/old-site
git checkout main          # use `master` here if that is your default branch

# 3. Copy the new site in (Windows PowerShell)
Copy-Item -Path "$HOME\OneDrive - University of Missouri\Desktop\SKD website\*" `
          -Destination . -Recurse -Force

# 4. Review, commit, push
git status
git add -A
git commit -m "Rebuild site: JSON content layer, dark mode, admin panel"
git push origin main
```

Your site updates at <https://samratkumardey.github.io/> — usually within a minute.

### Optional: remove the old files afterwards

They are harmless if left, but if you want a clean repo (they are safe on
`archive/old-site`):

```bash
git rm -r --cached css js scss vendor gallery test analysis_covid19.html visualization.html
Remove-Item -Recurse -Force css, js, scss, vendor, gallery, test, analysis_covid19.html, visualization.html
git commit -m "Remove superseded site files (archived on archive/old-site)"
git push origin main
```

Leave `img/` in place if you want old inbound links to keep resolving; the new site does not
use it.

---

## Route B — publish this folder directly

Simplest, but it replaces the repository's history for this branch.

```bash
cd "$HOME\OneDrive - University of Missouri\Desktop\SKD website"
git init
git add -A
git commit -m "New research portfolio site"
git branch -M main
git remote add origin https://github.com/samratkumardey/samratkumardey.github.io.git
git push -u origin main --force
```

Only do this if you are happy losing the old commit history. **Route A is safer.**

---

## Check it locally before you push

`fetch()` will not work from `file://`, so open the folder through a small local server:

```bash
cd "$HOME\OneDrive - University of Missouri\Desktop\SKD website"
python -m http.server 8000
```

Then visit <http://localhost:8000>. Check the admin panel at
<http://localhost:8000/admin/> too — it talks to GitHub directly, so it works from localhost
exactly as it will from the live site.

---

## After the first push

1. **Settings → Pages** — confirm the source is `main` / `/ (root)`.
2. Visit <https://samratkumardey.github.io/admin/> and create your token
   (steps in `README.md`, section 3).
3. Post one test news item and press **Publish** — it should appear on the live site within a
   minute. That confirms the whole loop works.
4. Fill in the things left blank on purpose:
   - ORCID and ResearchGate URLs (Admin → **Site & profile** → `social`) — those two icons stay
     hidden until you add them
   - Your talks (Admin → **Talks & presentations**)
   - Supervised students (Admin → **Students & mentoring**)
   - A CV PDF: drop the file in the repo, then set `profile.cvUrl` in **Site & profile**
