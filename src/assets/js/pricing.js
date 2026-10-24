// Pricing page: quote request form. Validates in the browser and shows the
// entered details back; nothing is sent anywhere and no price is produced.

import { createValidator, isEmail, setStatus } from './modules/form-validation.js';
import { formatDate, parseISODate, toISODate } from './modules/dates.js';

function initQuoteForm() {
  const form = document.getElementById('quote-form');
  const confirmation = document.querySelector('[data-quote-confirmation]');
  if (!form || !confirmation) return;
  const status = form.querySelector('[data-form-status]');
  const summary = confirmation.querySelector('[data-quote-summary]');
  const today = toISODate(new Date());

  form.elements.date.min = today;

  const validator = createValidator(form, {
    name: (v) => (v.length < 2 ? 'Enter your name.' : ''),
    email: (v) => (!v ? 'Enter your email address.' : !isEmail(v) ? 'Enter an email address in the format name@example.com.' : ''),
    pickup: (v) => (v.length < 3 ? 'Enter the pickup location.' : ''),
    destination: (v) => (v.length < 3 ? 'Enter the destination.' : ''),
    tripType: (v) => (!v ? 'Choose one-way or round trip.' : ''),
    date: (v) => (!v ? 'Choose a preferred date.' : v < today ? 'Choose today or a later date.' : ''),
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validator.validate()) {
      setStatus(status, 'error', 'Some details are missing or need correcting. Please check the highlighted fields.');
      return;
    }
    setStatus(status, 'info', '');
    const v = validator.values();
    const rows = [
      ['Pickup location', v.pickup],
      ['Destination', v.destination],
      ['Trip type', v.tripType],
      ['Preferred date', formatDate(parseISODate(v.date), 'long')],
      ['Email', v.email],
      ['Additional requirements', form.elements.requirements.value.trim() || 'None given'],
    ];
    summary.replaceChildren(
      ...rows.map(([term, detail]) => {
        const wrap = document.createElement('div');
        const dt = document.createElement('dt');
        const dd = document.createElement('dd');
        dt.className = 'font-bold';
        dd.className = 'mt-1 text-ink-muted';
        dt.textContent = term;
        dd.textContent = detail;
        wrap.append(dt, dd);
        return wrap;
      }),
    );
    confirmation.querySelector('[data-quote-name]').textContent = v.name.split(/\s+/)[0];
    form.hidden = true;
    confirmation.hidden = false;
    confirmation.querySelector('h3').focus();
  });

  confirmation.querySelector('[data-quote-edit]').addEventListener('click', () => {
    confirmation.hidden = true;
    form.hidden = false;
    form.elements.name.focus();
  });

  confirmation.querySelector('[data-quote-reset]').addEventListener('click', () => {
    form.reset();
    validator.reset();
    confirmation.hidden = true;
    form.hidden = false;
    setStatus(status, 'info', 'Form cleared.');
    form.elements.name.focus();
  });
}

initQuoteForm();
