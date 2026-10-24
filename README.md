# Hearthway Medical Transport — static site

Frontend-only website for a non-emergency medical transportation (NEMT) service.
HTML5 + Tailwind CSS v4 + vanilla ES modules. No framework, no backend.

> "Hearthway" is a working brand name. Contact details in the footer are
> bracketed placeholders and must be replaced with real, verified information.

## Commands

Requires Node 18.17+.

```bash
npm install          # once
npm run dev          # build, watch src/, serve http://localhost:3000/foundation.html
npm run build        # production build → dist/
npm run preview      # serve the existing dist/ (PORT=4000 npm run preview to change port)
```

`npm run build` runs two steps:

1. `build:html`: `scripts/build.mjs` resolves `<!-- @include … -->` partials in
   `src/pages/*.html`, writes the pages to `dist/`, and copies `src/assets/`.
2. `build:css`: the Tailwind CLI compiles `src/css/input.css` →
   `dist/assets/css/styles.css` (minified).

ES modules don't load over `file://`. Use `dev` or `preview` instead of
opening files directly.

## Deploying to Vercel

`vercel.json` sets the build command (`npm run build`), the output directory
(`dist`) and `cleanUrls`. Import the project and deploy; no other settings needed.

## Structure

```
src/
  pages/            one file per page → dist/<name>.html
    foundation.html   TEMPORARY design-system test page (remove before launch)
  partials/         head, header (+ mobile drawer), footer, brand
  css/input.css     design tokens, base styles, components (Tailwind entry)
  assets/
    js/preferences-init.js   blocking <head> script: applies theme + dir before paint
    js/main.js               module entry, imports everything below
    js/modules/preferences.js theme + direction state, storage, controls
    js/modules/dropdown.js    header dropdown
    js/modules/drawer.js      mobile navigation drawer
    js/modules/active-nav.js  current-page highlighting
    images/
scripts/            build.mjs, dev.mjs, serve.mjs (no extra dependencies)
```

## Adding a page

```html
<!doctype html>
<html lang="en" dir="ltr" data-theme="light">
<head>
  <!-- @include head title="Services" description="…" robots="index, follow" -->
</head>
<body>
  <!-- @include header -->
  <main id="main">…</main>
  <!-- @include footer -->
</body>
</html>
```

Save it as `src/pages/services.html`. Active navigation is detected from the
URL. Pages whose filename doesn't match a nav key can set `<body data-page="…">`.
Planned keys: `index`, `home-2`, `services`, `pricing`, `about`, `contact`,
`login`, `dashboard`.

## Conventions

- **Colours:** use only semantic utilities (`bg-canvas`, `bg-surface`,
  `text-ink`, `text-ink-muted`, `border-line`, `bg-brand`, …). The default
  Tailwind palette is disabled on purpose. Every token is redefined for dark
  mode, so components don't need `dark:` overrides.
- **Buttons:** `.btn` + one of `.btn-primary | .btn-secondary | .btn-ghost`,
  optionally `.btn-lg`, `.btn-block`, `.btn-icon`. Don't create one-off buttons.
- **Forms:** `.field`, `.field-label`, `.input`, `.select`, `.textarea`,
  `.check`, `.field-hint`, `.field-error` (pair with `aria-invalid` / `aria-describedby`).
- **Direction:** use logical utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`,
  `start-*`, `end-*`, `border-s`, `text-start`). Add `.icon-directional` to
  arrows that point "forward".
- **Headings** are always left-aligned (or `text-center`), including in RTL.
- **Theme / direction controls:** any element with `data-theme-toggle`,
  `data-theme-option`, `data-dir-toggle` or `data-dir-option` works automatically.
  Stored in `localStorage` as `hw-theme` / `hw-dir`.
