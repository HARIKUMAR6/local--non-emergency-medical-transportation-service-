// Marks the current page in every navigation (header, dropdown, drawer, footer).
//
//   <a data-nav="services" href="services.html">     → aria-current="page"
//   <button data-nav-group="index home-2">           → data-active (parent of a match)
//
// The page key comes from <body data-page="…"> when present, otherwise from
// the URL. Handles "/", "/index.html", "/services" and "/services.html"
// (Vercel cleanUrls).

export function getCurrentPage() {
  const explicit = document.body.dataset.page;
  if (explicit) return explicit;

  const segment = window.location.pathname.split('/').filter(Boolean).pop() ?? '';
  return segment.replace(/\.html$/i, '') || 'index';
}

export function initActiveNav() {
  const page = getCurrentPage();

  document.querySelectorAll('[data-nav]').forEach((link) => {
    if (link.dataset.nav === page) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  document.querySelectorAll('[data-nav-group]').forEach((group) => {
    group.toggleAttribute('data-active', group.dataset.navGroup.split(/\s+/).includes(page));
  });
}
