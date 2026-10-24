// Shared entry point for every page. Loaded as a module (deferred), so the
// DOM is parsed before this runs. Each initialiser is idempotent.

import { initPreferences } from './modules/preferences.js';
import { initDropdowns } from './modules/dropdown.js';
import { initDrawer } from './modules/drawer.js';
import { initActiveNav } from './modules/active-nav.js';
import { initTabs } from './modules/tabs.js';

function initCurrentYear() {
  const year = String(new Date().getFullYear());
  document.querySelectorAll('[data-current-year]').forEach((el) => (el.textContent = year));
}

initPreferences();
initActiveNav();
initDropdowns();
initDrawer();
initTabs();
initCurrentYear();
