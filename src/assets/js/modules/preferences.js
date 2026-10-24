// Global theme and text-direction preferences.
//
// Theme and direction are fully independent: each has its own storage key,
// its own <html> attribute, and its own controls.
//
// Controls (any number per page, all kept in sync):
//   [data-theme-toggle]          flips light/dark; aria-pressed = dark
//   [data-theme-option="light"]  sets a theme;   aria-pressed = selected
//   [data-dir-toggle]            flips ltr/rtl
//   [data-dir-option="rtl"]      sets a direction; aria-pressed = selected

const KEYS = { theme: 'hw-theme', dir: 'hw-dir' };
const THEMES = ['light', 'dark'];
const DIRECTIONS = ['ltr', 'rtl'];
const THEME_COLORS = { light: '#f6f2e9', dark: '#0f1512' };

const root = document.documentElement;
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Preference still applies for this page view.
  }
}

/* ---------------------------------------------------------------- Theme */

export const getTheme = () => (root.dataset.theme === 'dark' ? 'dark' : 'light');

export function setTheme(theme, { persist = true } = {}) {
  if (!THEMES.includes(theme)) return;

  // Flip every colour at once instead of staggered per-element transitions.
  root.setAttribute('data-theme-switching', '');
  root.dataset.theme = theme;
  if (persist) write(KEYS.theme, theme);
  syncThemeControls();
  requestAnimationFrame(() => requestAnimationFrame(() => root.removeAttribute('data-theme-switching')));
}

function syncThemeControls() {
  const theme = getTheme();

  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.setAttribute('aria-pressed', String(theme === 'dark'));
  });
  document.querySelectorAll('[data-theme-option]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.themeOption === theme));
  });

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLORS[theme]);
}

/* ------------------------------------------------------------ Direction */

export const getDirection = () => (root.getAttribute('dir') === 'rtl' ? 'rtl' : 'ltr');

export function setDirection(dir, { persist = true } = {}) {
  if (!DIRECTIONS.includes(dir)) return;

  root.setAttribute('dir', dir);
  if (persist) write(KEYS.dir, dir);
  syncDirectionControls();
}

function syncDirectionControls() {
  const dir = getDirection();

  document.querySelectorAll('[data-dir-option]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.dirOption === dir));
  });
}

/* ------------------------------------------------------------------ Init */

let initialized = false;

export function initPreferences() {
  if (initialized) return;
  initialized = true;

  // One delegated listener covers every current and future control.
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    if (target.closest('[data-theme-toggle]')) {
      setTheme(getTheme() === 'dark' ? 'light' : 'dark');
      return;
    }
    const themeOption = target.closest('[data-theme-option]');
    if (themeOption) {
      setTheme(themeOption.dataset.themeOption);
      return;
    }
    if (target.closest('[data-dir-toggle]')) {
      setDirection(getDirection() === 'rtl' ? 'ltr' : 'rtl');
      return;
    }
    const dirOption = target.closest('[data-dir-option]');
    if (dirOption) setDirection(dirOption.dataset.dirOption);
  });

  // Follow the OS only while the visitor has not chosen a theme.
  darkQuery.addEventListener('change', (event) => {
    if (!THEMES.includes(read(KEYS.theme))) setTheme(event.matches ? 'dark' : 'light', { persist: false });
  });

  // Keep other open tabs in step.
  window.addEventListener('storage', (event) => {
    if (event.key === KEYS.theme && THEMES.includes(event.newValue)) setTheme(event.newValue, { persist: false });
    if (event.key === KEYS.dir && DIRECTIONS.includes(event.newValue)) setDirection(event.newValue, { persist: false });
  });

  syncThemeControls();
  syncDirectionControls();
}
