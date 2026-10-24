// Contact page: enquiry form. Validates in the browser and shows the message
// back; nothing is sent anywhere.

import { createValidator, isEmail, setStatus } from './modules/form-validation.js';

function initEnquiryForm() {
  const form = document.getElementById('enquiry-form');
  const confirmation = document.querySelector('[data-enquiry-confirmation]');
  if (!form || !confirmation) return;
  const status = form.querySelector('[data-form-status]');
  const summary = confirmation.querySelector('[data-enquiry-summary]');

  // "Schedule a Ride" links across the site point here; start on that topic.
  if (window.location.hash === '#schedule' && !form.elements.type.value) form.elements.type.value = 'ride';

  const validator = createValidator(form, {
    name: (v) => (v.length < 2 ? 'Enter your name.' : ''),
    email: (v) => (!v ? 'Enter your email address.' : !isEmail(v) ? 'Enter an email address in the format name@example.com.' : ''),
    phone: (v) => (v && v.replace(/\D/g, '').length < 7 ? 'Enter a phone number with at least 7 digits, or leave it blank.' : ''),
    type: (v) => (!v ? 'Choose what your enquiry is about.' : ''),
    message: (v) => (v.length < 10 ? 'Write a short message (at least 10 characters).' : ''),
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validator.validate()) {
      setStatus(status, 'error', 'Some details are missing or need correcting. Please check the highlighted fields.');
      return;
    }
    setStatus(status, 'info', '');
    const v = validator.values();
    const typeLabel = form.elements.type.selectedOptions[0].textContent;
    const rows = [
      ['Enquiry type', typeLabel],
      ['Email', v.email],
      ['Phone', v.phone || 'Not given'],
      ['Message', v.message],
    ];
    summary.replaceChildren(
      ...rows.map(([term, detail]) => {
        const wrap = document.createElement('div');
        if (term === 'Message') wrap.className = 'sm:col-span-2';
        const dt = document.createElement('dt');
        const dd = document.createElement('dd');
        dt.className = 'font-bold';
        dd.className = 'mt-1 whitespace-pre-line text-ink-muted';
        dt.textContent = term;
        dd.textContent = detail;
        wrap.append(dt, dd);
        return wrap;
      }),
    );
    confirmation.querySelector('[data-enquiry-name]').textContent = v.name.split(/\s+/)[0];
    form.hidden = true;
    confirmation.hidden = false;
    confirmation.querySelector('h3').focus();
  });

  confirmation.querySelector('[data-enquiry-edit]').addEventListener('click', () => {
    confirmation.hidden = true;
    form.hidden = false;
    form.elements.message.focus();
  });

  confirmation.querySelector('[data-enquiry-reset]').addEventListener('click', () => {
    form.reset();
    validator.reset();
    confirmation.hidden = true;
    form.hidden = false;
    setStatus(status, 'info', 'Form cleared.');
    form.elements.name.focus();
  });
}

initEnquiryForm();
