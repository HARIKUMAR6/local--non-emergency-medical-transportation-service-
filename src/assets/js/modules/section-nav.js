// Single-section dashboard navigation.
// Shows only the selected section, hides all other sections.

const SECTION_IDS = ['overview', 'upcoming', 'schedule', 'recurring', 'history', 'profile'];

export function initSectionNav() {
  const navLinks = [...document.querySelectorAll('[data-section-nav] a[href^="#"]')];
  if (navLinks.length === 0) return;

  const sections = new Map();
  SECTION_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) sections.set(id, el);
  });

  if (sections.size === 0) return;

  function setActive(id, { updateHash = true, focus = false } = {}) {
    const targetId = sections.has(id) ? id : 'overview';

    // Show only the selected section, hide all others
    sections.forEach((section, sectionId) => {
      const isTarget = sectionId === targetId;
      if (isTarget) {
        section.hidden = false;
        section.removeAttribute('hidden');
        section.dataset.activeSection = 'true';
      } else {
        section.hidden = true;
        section.setAttribute('hidden', '');
        delete section.dataset.activeSection;
      }
    });

    // Update active state across all navigation lists (sidebar and drawer)
    navLinks.forEach((a) => {
      const hash = a.getAttribute('href');
      if (hash === `#${targetId}`) {
        a.setAttribute('aria-current', 'true');
      } else {
        a.removeAttribute('aria-current');
      }
    });

    if (updateHash && window.location.hash !== `#${targetId}`) {
      window.history.pushState(null, '', `#${targetId}`);
    }

    // Move focus to the active section heading for accessibility
    const targetSection = sections.get(targetId);
    if (targetSection && focus) {
      const heading = targetSection.querySelector('h1, h2');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      } else {
        targetSection.focus({ preventScroll: true });
      }
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // Intercept clicks on any internal link targeting a dashboard section
  document.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
    if (!link) return;

    const hash = link.hash.slice(1);
    if (sections.has(hash)) {
      event.preventDefault();
      setActive(hash, { updateHash: true, focus: true });

      // If clicked inside the mobile drawer, close the drawer
      const drawer = document.getElementById('dash-drawer');
      if (drawer && drawer.hasAttribute('data-open')) {
        drawer.querySelector('button[data-drawer-close]')?.click();
      }
    }
  });

  // Support browser back/forward buttons
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    if (sections.has(hash)) {
      setActive(hash, { updateHash: false, focus: true });
    } else {
      setActive('overview', { updateHash: false, focus: false });
    }
  });

  // Initial display on load: read hash or default to overview
  const initialHash = window.location.hash.slice(1);
  if (sections.has(initialHash)) {
    setActive(initialHash, { updateHash: false, focus: false });
  } else {
    setActive('overview', { updateHash: false, focus: false });
  }
}
