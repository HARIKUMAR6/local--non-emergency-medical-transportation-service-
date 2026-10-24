// Disclosure-style navigation dropdowns.
//
// Markup:
//   <div data-dropdown>
//     <button data-dropdown-trigger aria-expanded="false" aria-controls="id">…</button>
//     <ul id="id" data-dropdown-panel>…links…</ul>
//   </div>
//
// Keyboard: Enter/Space toggle · ArrowDown/ArrowUp open and move · Home/End ·
// Escape closes and returns focus · Tab away or click outside closes.

const instances = [];

function setup(dropdown) {
  const trigger = dropdown.querySelector('[data-dropdown-trigger]');
  const panel = dropdown.querySelector('[data-dropdown-panel]');
  if (!trigger || !panel) return;

  const links = () => [...panel.querySelectorAll('a[href]')];
  const isOpen = () => trigger.getAttribute('aria-expanded') === 'true';

  const open = (focusIndex) => {
    instances.forEach((other) => other !== instance && other.close());
    trigger.setAttribute('aria-expanded', 'true');
    panel.setAttribute('data-open', '');
    if (focusIndex !== undefined) links().at(focusIndex)?.focus();
  };

  const close = ({ returnFocus = false } = {}) => {
    if (!isOpen()) return;
    trigger.setAttribute('aria-expanded', 'false');
    panel.removeAttribute('data-open');
    if (returnFocus) trigger.focus();
  };

  const instance = { dropdown, close };
  instances.push(instance);

  trigger.addEventListener('click', () => (isOpen() ? close() : open()));

  trigger.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      open(0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      open(-1);
    }
  });

  panel.addEventListener('keydown', (event) => {
    const items = links();
    const index = items.indexOf(document.activeElement);
    const keyMap = {
      ArrowDown: (index + 1) % items.length,
      ArrowUp: (index - 1 + items.length) % items.length,
      Home: 0,
      End: items.length - 1,
    };
    if (event.key in keyMap) {
      event.preventDefault();
      items[keyMap[event.key]]?.focus();
    }
  });

  dropdown.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) {
      event.stopPropagation();
      close({ returnFocus: true });
    }
  });

  dropdown.addEventListener('focusout', (event) => {
    if (!dropdown.contains(event.relatedTarget)) close();
  });
}

let initialized = false;

export function initDropdowns() {
  document.querySelectorAll('[data-dropdown]').forEach((dropdown) => {
    if (dropdown.hasAttribute('data-dropdown-ready')) return;
    dropdown.setAttribute('data-dropdown-ready', '');
    setup(dropdown);
  });

  if (initialized) return;
  initialized = true;

  // A single outside-click listener shared by every dropdown.
  document.addEventListener('pointerdown', (event) => {
    instances.forEach(({ dropdown, close }) => {
      if (!dropdown.contains(event.target)) close();
    });
  });
}
