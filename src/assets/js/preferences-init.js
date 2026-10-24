/*
 * Runs synchronously in <head>, before first paint, so the saved theme and
 * direction are applied without a flash. Keep this file tiny and ES5-safe.
 * Storage keys must match assets/js/modules/preferences.js.
 */
(function () {
  var root = document.documentElement;
  var theme = null;
  var dir = null;

  try {
    theme = localStorage.getItem('hw-theme');
    dir = localStorage.getItem('hw-dir');
  } catch (e) {
    /* Storage unavailable (private mode, blocked cookies) — fall through. */
  }

  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  root.setAttribute('data-theme', theme);
  root.setAttribute('dir', dir === 'rtl' ? 'rtl' : 'ltr');
})();
