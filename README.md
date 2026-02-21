# Kanban To-Do List (Dot Matrix Theme)

A portfolio-focused Kanban-style to-do app built with plain HTML, CSS, and vanilla JavaScript.

## Current Status
- Responsive 3-column board: `Todo`, `In Progress`, `Done`
- Task workflow:
  - Add new task to any column
  - Delete existing task
  - Edit existing task titles inline
  - Priority tags (`High`, `Medium`, `Low`) with inline editing support
  - Task counts update per column
- Drag and drop:
  - Native HTML Drag and Drop API
  - Move tasks between columns
  - Drop outside a column is ignored safely
- Persistence:
  - Board state stored in `localStorage`
  - Data is sanitized on load to avoid invalid entries
- Dot-matrix background using pure CSS `radial-gradient`
- Theme system:
  - Auto-detects OS theme with `prefers-color-scheme`
  - Manual light/dark toggle
  - Theme preference persisted in `localStorage`

## Tech Stack
- HTML5
- CSS3 (Grid/Flexbox)
- Vanilla JavaScript (ES modules)

## Project Structure
```text
.
├─ index.html
├─ css/
│  └─ styles.css
└─ js/
   ├─ app.js
   ├─ board.js
   ├─ storage.js
   └─ theme.js
```

## Run Locally
Open `index.html` directly in your browser, or use a local static server:

```bash
# Python 3
python3 -m http.server 5500
```

Then visit `http://localhost:5500`.

## GitHub Pages
- This project is static and build-free, so it deploys directly from the repository.
- Asset paths are relative (`css/styles.css`, `js/app.js`) to support repository subpaths.
- `.nojekyll` is included to avoid Jekyll processing side effects.

Deployment steps:
1. Push `main` to GitHub.
2. In repository settings, open `Pages`.
3. Set source to `Deploy from a branch`.
4. Select `main` and `/ (root)`.

## Roadmap
- Smooth drag transitions

## Git Workflow
Use focused commits with clear messages, for example:

```bash
git add .
git commit -m "docs: add project README with setup and roadmap"
git push origin main
```
