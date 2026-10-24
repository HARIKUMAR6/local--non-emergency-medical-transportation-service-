// Inline form validation shared by the login and dashboard forms.
//
// Markup per field:
//   <input id="email" name="email" aria-describedby="email-error">
//   <p class="field-error" id="email-error" data-error-for="email" hidden></p>
// Radio groups put aria-describedby on their <fieldset>.
//
// Rules map a field name to a function returning an error message, or ''
// when the value is valid. After the first submit attempt, fields re-check
// as the user types, so errors clear as soon as they are fixed.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isEmail = (value) => EMAIL_RE.test(value);

const ICONS = {
  error: '<path d="M12 8v5M12 16.5v.01"/><circle cx="12" cy="12" r="9"/>',
  success: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.75 2.75L16 9.75"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5v.01"/>',
};

function controlFor(form, name) {
  return form.elements.namedItem(name);
}

function valueOf(control) {
  if (control instanceof RadioNodeList) {
    // Checkbox groups yield the checked values; radio groups the chosen one.
    if (control[0]?.type === 'checkbox') return [...control].filter((c) => c.checked).map((c) => c.value);
    return control.value;
  }
  if (control.type === 'checkbox') return control.checked;
  return control.value.trim();
}

function invalidTarget(control) {
  return control instanceof RadioNodeList ? control[0].closest('fieldset') : control;
}

export function createValidator(form, rules) {
  let attempted = false;

  function show(name, message) {
    const control = controlFor(form, name);
    const target = invalidTarget(control);
    const error = form.querySelector(`[data-error-for="${name}"]`);
    if (message) target.setAttribute('aria-invalid', 'true');
    else target.removeAttribute('aria-invalid');
    if (error) {
      error.textContent = message;
      error.hidden = !message;
    }
  }

  function check(name) {
    const message = rules[name](valueOf(controlFor(form, name)), form) || '';
    show(name, message);
    return message;
  }

  const recheck = (event) => {
    if (attempted && event.target.name in rules) check(event.target.name);
  };
  form.addEventListener('input', recheck);
  form.addEventListener('change', recheck);

  return {
    /** Validates every field; focuses the first invalid one. */
    validate() {
      attempted = true;
      const invalid = Object.keys(rules).filter((name) => check(name));
      if (invalid.length) {
        const first = controlFor(form, invalid[0]);
        (first instanceof RadioNodeList ? first[0] : first).focus();
      }
      return invalid.length === 0;
    },
    /** Re-checks one field without moving focus. */
    validateField(name) {
      return !check(name);
    },
    reset() {
      attempted = false;
      Object.keys(rules).forEach((name) => show(name, ''));
    },
    values() {
      return Object.fromEntries(Object.keys(rules).map((name) => [name, valueOf(controlFor(form, name))]));
    },
  };
}

/** Writes a message into a [role=status] region with a tone icon. */
export function setStatus(region, tone, message) {
  region.dataset.tone = tone;
  region.replaceChildren();
  if (!message) return;
  region.insertAdjacentHTML(
    'afterbegin',
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[tone] ?? ICONS.info}</svg>`,
  );
  const text = document.createElement('p');
  text.textContent = message;
  region.append(text);
}
