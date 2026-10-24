// Accessible tabs (WAI-ARIA tabs pattern, automatic activation).
//
// Markup:
//   <div data-tabs>
//     <div role="tablist" aria-label="…" [aria-orientation="vertical"]>
//       <button role="tab" id="t1" aria-controls="p1" aria-selected="true">…</button>
//       <button role="tab" id="t2" aria-controls="p2" aria-selected="false">…</button>
//     </div>
//     <div role="tabpanel" id="p1" aria-labelledby="t1">…</div>
//     <div role="tabpanel" id="p2" aria-labelledby="t2" hidden>…</div>
//   </div>
//
// Keyboard: arrows move between tabs (Left/Right follow reading direction,
// so they swap in RTL), Home/End jump. The root gets data-active-index so
// CSS can react to the selected tab.

function setup(root) {
  const tablist = root.querySelector('[role="tablist"]');
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  if (!tablist || tabs.length === 0) return;

  const panelFor = (tab) => document.getElementById(tab.getAttribute('aria-controls'));

  function select(tab, { focus = false } = {}) {
    tabs.forEach((t) => {
      const selected = t === tab;
      t.setAttribute('aria-selected', String(selected));
      t.tabIndex = selected ? 0 : -1;
      const panel = panelFor(t);
      if (panel) panel.hidden = !selected;
    });
    root.dataset.activeIndex = String(tabs.indexOf(tab));
    if (focus) tab.focus();
  }

  tabs.forEach((tab) => tab.addEventListener('click', () => select(tab)));

  tablist.addEventListener('keydown', (event) => {
    const index = tabs.indexOf(document.activeElement);
    if (index < 0) return;

    const vertical = tablist.getAttribute('aria-orientation') === 'vertical';
    const rtl = getComputedStyle(root).direction === 'rtl';
    const next = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
    const prev = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';

    const target = {
      [next]: (index + 1) % tabs.length,
      [prev]: (index - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }[event.key];

    if (target === undefined) return;
    event.preventDefault();
    select(tabs[target], { focus: true });
  });

  select(tabs.find((t) => t.getAttribute('aria-selected') === 'true') ?? tabs[0]);
}

export function initTabs() {
  document.querySelectorAll('[data-tabs]').forEach((root) => {
    if (root.hasAttribute('data-tabs-ready')) return;
    root.setAttribute('data-tabs-ready', '');
    setup(root);
  });
}
