// Mobile navigation drawer (modal dialog pattern).
//
// Markup:
//   <button data-drawer-open aria-controls="site-drawer" aria-expanded="false">
//   <div id="site-drawer" data-drawer>
//     <div data-drawer-close></div>             ← scrim (outside click)
//     <div role="dialog" aria-modal="true">     ← panel
//       <button data-drawer-close>              ← explicit close button
//
// While open: the rest of the page is inert, page scroll is locked, Escape
// closes, a link selection closes, and growing to the desktop breakpoint
// closes it. Focus returns to the trigger.

const DESKTOP_QUERY = '(min-width: 64rem)'; // matches Tailwind's lg breakpoint

let initialized = false;

export function initDrawer() {
  if (initialized) return;
  const drawer = document.querySelector('[data-drawer]');
  if (!drawer) return;
  initialized = true;

  const root = document.documentElement;
  const triggers = [...document.querySelectorAll(`[data-drawer-open][aria-controls="${drawer.id}"]`)];
  const closeButton = drawer.querySelector('button[data-drawer-close]');
  const desktop = window.matchMedia(DESKTOP_QUERY);
  let lastTrigger = null;
  let madeInert = [];

  const isOpen = () => drawer.hasAttribute('data-open');

  // Collapsible groups (e.g. Home): always closed when the drawer opens or closes.
  const accordions = [...drawer.querySelectorAll('[data-drawer-accordion-trigger]')].map((trigger) => {
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    const set = (expanded) => {
      trigger.setAttribute('aria-expanded', String(expanded));
      if (panel) panel.hidden = !expanded;
    };
    trigger.addEventListener('click', () => set(trigger.getAttribute('aria-expanded') !== 'true'));
    return () => set(false);
  });
  const resetAccordions = () => accordions.forEach((reset) => reset());

  function setBackgroundInert(inert) {
    if (inert) {
      madeInert = [...document.body.children].filter(
        (el) => el !== drawer && !el.inert && el.tagName !== 'SCRIPT',
      );
      madeInert.forEach((el) => (el.inert = true));
    } else {
      madeInert.forEach((el) => (el.inert = false));
      madeInert = [];
    }
  }

  function open(trigger) {
    if (isOpen()) return;
    lastTrigger = trigger ?? triggers[0] ?? null;
    resetAccordions();
    drawer.setAttribute('data-open', '');
    triggers.forEach((t) => t.setAttribute('aria-expanded', 'true'));
    root.setAttribute('data-scroll-locked', '');
    setBackgroundInert(true);
    closeButton?.focus();
  }

  function close({ returnFocus = true } = {}) {
    if (!isOpen()) return;
    drawer.removeAttribute('data-open');
    resetAccordions();
    triggers.forEach((t) => t.setAttribute('aria-expanded', 'false'));
    root.removeAttribute('data-scroll-locked');
    setBackgroundInert(false);
    if (returnFocus && lastTrigger && lastTrigger.offsetParent !== null) lastTrigger.focus();
  }

  triggers.forEach((trigger) => trigger.addEventListener('click', () => open(trigger)));

  drawer.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest('[data-drawer-close]')) {
      close();
    } else if (target.closest('a[href]')) {
      // Navigating away: let the browser follow the link, just tidy up.
      close({ returnFocus: false });
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) {
      event.preventDefault();
      close();
    }
  });

  desktop.addEventListener('change', (event) => {
    if (event.matches) close({ returnFocus: false });
  });
}
