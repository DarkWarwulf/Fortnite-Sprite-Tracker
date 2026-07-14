# ⚡ Sprite Tracker — Fortnite Collection Log

A polished, Fortnite-styled web app for tracking the **Sprites** you've collected and the **level** you've raised each one to.

- **66 released sprites** (16 creatures × their variants) with the real in-game artwork, plus a **Show Unreleased** toggle for the other 80.
- Set each sprite's level **1–5** — Level 5 is **Mastered** 👑. Click a sprite's picture to quickly mark it owned/not-owned.
- Live **Owned** and **Mastered** completion rings (out of 66).
- Filter by **status** (All / Owned / Missing / Mastered) and **rarity**, plus instant **search**.
- **Everything saves automatically** in your browser. Close the tab, come back later — your collection is still there.
- Each visitor to the link gets their **own private tracker** (data lives in their own browser, never on a server).
- **Export / Import** a backup code to move your collection to another device or browser.

Every player who opens the link starts their own personal collection — nothing is shared between visitors.

---

## 🚀 Put it online (GitHub Pages) — ~3 minutes

You'll upload this folder to a new GitHub repository and switch on GitHub Pages. You get a public link like:

```
https://YOUR-USERNAME.github.io/sprite-tracker/
```

### Step 1 — Create the repository
1. Go to **https://github.com/new** (sign in first).
2. **Repository name:** `sprite-tracker`
3. Set it to **Public**.
4. Leave "Add a README" **unchecked** (this project already has everything).
5. Click **Create repository**.

### Step 2 — Upload the files
1. On the new empty repo page, click the **“uploading an existing file”** link (or **Add file → Upload files**).
2. Open this folder on your PC: `C:\Claude\Fortnite-Sprite-Tracker`
3. Select **everything inside it** — `index.html`, `styles.css`, `app.js`, `data.js`, the `assets` folder, and the hidden `.nojekyll` file — and **drag them onto the GitHub upload page**.
   - Tip: it's easiest to select all items *inside* the folder (Ctrl+A) and drag them in, so the files land at the repo root (not inside a sub-folder).
   - The `assets/sprites` folder has 146 images — let the upload finish (a progress bar appears).
4. Scroll down and click **Commit changes**.

### Step 3 — Turn on GitHub Pages
1. In the repo, go to **Settings** (top menu) → **Pages** (left sidebar).
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. **Branch:** `main`, **Folder:** `/ (root)` → click **Save**.
4. Wait ~1 minute, then refresh the page. GitHub shows:
   **“Your site is live at https://YOUR-USERNAME.github.io/sprite-tracker/”**

That URL is your shareable tracker link. 🎉 Send it to anyone — each person gets their own saved collection.

---

## 🔎 Verify it locally first (optional)
Because the app loads images, open it through a tiny local server rather than double-clicking the file:

```powershell
cd "C:\Claude\Fortnite-Sprite-Tracker"
python -m http.server 8931
# then open http://localhost:8931 in your browser
```

## 🗂 Project structure
```
index.html      – page shell
styles.css      – Fortnite-style theme
app.js          – tracker logic (levels, filters, stats, save/backup)
data.js         – the 146 sprites (embedded so it works anywhere)
assets/
  sprites/      – 146 sprite icons (1.webp … 147.webp, by sprite id)
  img/          – favicon
  data/         – sprites.raw.json (source data, for reference)
.nojekyll       – tells GitHub Pages to serve files as-is
```

## 🔒 How saving works
Your collection is stored with the browser's **localStorage** under the key `fnSpriteTracker:v1`. It stays on your device and reloads every visit. It is **per-browser**: a different device or browser starts fresh — use **⋯ Data → Export backup** to carry it across.

---

*Fan-made tracker. Sprite names and artwork are the property of Epic Games. Not affiliated with or endorsed by Epic Games. Sprite data referenced from fortnite.gg.*
