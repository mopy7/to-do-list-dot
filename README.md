# Kanban To-Do List (Dot Matrix Theme)

A portfolio-ready Kanban web app built with HTML, CSS, and vanilla JavaScript.

## Live Demo
https://mopy7.github.io/to-do-list-dot/

## Features
- 3-column board: `Todo`, `In Progress`, `Done`
- Task management:
  - Add tasks to a selected column
  - Edit task title and priority inline
  - Delete tasks
  - Priority tags: `High`, `Medium`, `Low`
- Native drag and drop:
  - Move tasks across columns with HTML Drag and Drop API
  - Drop-safe handling for invalid/outside targets
  - Smooth motion polish (lift, drop-target highlight, settle animation)
- Persistence:
  - Board state stored in `localStorage`
  - Input sanitization on load/save
- Theme system:
  - Dot-matrix background via pure CSS `radial-gradient`
  - Auto system theme with `prefers-color-scheme`
  - Manual light/dark toggle with persisted preference

## Tech Stack
- HTML5
- CSS3 (Grid/Flexbox, CSS variables, media queries)
- Vanilla JavaScript (ES modules, no frameworks/libraries)

## Project Structure
```text
.
├─ index.html
├─ .nojekyll
├─ css/
│  └─ styles.css
└─ js/
   ├─ app.js
   ├─ board.js
   ├─ storage.js
   └─ theme.js
```

## Run Locally
```bash
# Option 1: open directly
open index.html

# Option 2: local static server
python3 -m http.server 5500
```

Then visit `http://localhost:5500`.

## GitHub Pages Deployment
- Static, build-free project: deploy directly from repository.
- Relative asset/module paths are used (`css/styles.css`, `js/app.js`) for repo subpath compatibility.
- `.nojekyll` is included to avoid Jekyll processing side effects.

Deployment steps:
1. Push `main` to GitHub.
2. Go to repository `Settings` -> `Pages`.
3. Set `Source` to `Deploy from a branch`.
4. Select `main` and `/ (root)`.

## Suggested Git Workflow
```bash
git add .
git commit -m "docs: finalize README for production-ready kanban app"
git push origin main
```
