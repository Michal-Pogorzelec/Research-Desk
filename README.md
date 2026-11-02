# Research Desk

Local research planner. Data lives in `db/` (JSON files, PDFs, note copies), served by a small Node.js server.

## Running

Double-click `start.bat`: it repacks `src/` into `Research Desk offline.html` and starts the server at http://localhost:8765 (`node server.js --open`).

## Structure

```
src/                      app sources — edit these
  index.html              page shell and the app template (inside <x-dc>)
  js/app.js               app logic (class Component extends DCLogic)
  css/fonts.css           @font-face rules
  css/design-system.css   design tokens and component classes
  css/app.css             app-specific overrides
  fonts/                  Inter (variable woff2, SIL OFL)
  vendor/                 React 18.3.1, react-dom, dc-runtime (template engine)
build.js                  packs src/ into one file
Research Desk offline.html  generated single-file app — do not edit
server.js                 local server and db/ API
```

## Editing

While the server runs, it builds the page from `src/` on every load, so a page reload shows source edits.
To refresh the single file without starting the server: `node build.js`.
