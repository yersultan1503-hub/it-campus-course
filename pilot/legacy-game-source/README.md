# Isolated Q3 game source

Copied from the original Q3 source without changing Desktop. App.jsx checks the server-backed legacy access controller before selecting or entering a building and before starting a mode.

Build with the package's Vite binary (`vite build`). publicDir is false: reuse the authored model/texture assets already under pilot/public/legacy-q3/game/assets. Copy dist/client into that folder, retaining those models. Add `<script type="module" src="/game/legacy-access.js"></script>` before `</head>` in the built index. The outer game build supplies that module. Without this hook the guarded game intentionally denies entry.

Server-side lesson/attempt checks remain authoritative. XP is only local practice feedback, never authorization or a teacher grade.
