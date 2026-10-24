// Patient dashboard. Every interaction updates this page only: nothing is
// sent to a server or a transportation provider. Shared behaviour (theme,
// direction, drawer) comes from main.js.

import { initSectionNav } from './modules/section-nav.js';
import { initRelativeDates, formatDate, formatTime, parseISODate, toISODate } from './modules/dates.js';
import { createValidator, isEmail, setStatus } from './modules/form-validation.js';

const STATUS_LABELS = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  'driver-assigned': 'Driver assigned',
  'en-route': 'Driver en route',
  'pickup-completed': 'Pickup completed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  active: 'Active',
  paused: 'Paused',
};

const todayISO = () => toISODate(new Date());
const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

function setStatusLabel(el, status) {
  el.dataset.status = status;
  el.textContent = STATUS_LABELS[status];
}

function setRideStatus(rideId, status) {
  qsa(`[data-ride-status="${rideId}"]`).forEach((el) => setStatusLabel(el, status));
}

/** "9:30 AM" → "09:30" for time inputs */
function to24h(label) {
  const match = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(label);
  if (!match) return '';
  let h = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') h += 12;
  return `${String(h).padStart(2, '0')}:${match[2]}`;
}

const notInPast = (value) => (!value ? 'Choose a date.' : value < todayISO() ? 'Choose today or a later date.' : '');

/* ------------------------------------------------------------- Tracker */

const STAGES = ['scheduled', 'driver-assigned', 'en-route', 'pickup-completed'];

function createTracker() {
  const list = document.querySelector('[data-tracker]');
  if (!list) return null;
  const rideId = list.dataset.ride;
  const items = qsa('li', list);
  const next = document.querySelector('[data-tracker-next]');
  const reset = document.querySelector('[data-tracker-reset]');
  const message = document.querySelector('[data-tracker-message]');
  let index = 0;
  let disabled = false;

  function render({ announce = false } = {}) {
    items.forEach((li, i) => {
      const finished = i < index || (i === index && index === STAGES.length - 1);
      const state = finished ? 'done' : i === index ? 'current' : 'upcoming';
      li.dataset.state = state;
      li.querySelector('.tracker-sr').textContent = { done: '(completed)', current: '(current stage)', upcoming: '(not yet)' }[state];
      if (i === index) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
    });
    next.disabled = disabled || index === STAGES.length - 1;
    reset.disabled = disabled || index === 0;
    if (!disabled) setRideStatus(rideId, STAGES[index]);
    if (announce) message.textContent = `Simulated status: ${STATUS_LABELS[STAGES[index]]}.`;
  }

  next.addEventListener('click', () => {
    index = Math.min(index + 1, STAGES.length - 1);
    render({ announce: true });
  });
  reset.addEventListener('click', () => {
    index = 0;
    render({ announce: true });
    next.focus();
  });

  render();
  return {
    rideId,
    reset() {
      disabled = false;
      list.removeAttribute('data-disabled');
      index = 0;
      message.textContent = '';
      render();
    },
    disable() {
      disabled = true;
      list.setAttribute('data-disabled', '');
      message.textContent = 'This ride was cancelled on this page, so there is no status to show.';
      render();
    },
  };
}

/* ---------------------------------------------------------- Ride rows */

function initRides(tracker) {
  const rescheduleDialog = document.getElementById('reschedule-dialog');
  const cancelDialog = document.getElementById('cancel-dialog');
  const rescheduleForm = rescheduleDialog.querySelector('form');
  let activeRide = null;

  const rideName = (id) => document.getElementById(`${id}-title`)?.textContent.trim() ?? 'this ride';
  const note = (id, text) => {
    const el = document.querySelector(`[data-ride-note="${id}"]`);
    if (el) el.textContent = text;
  };
  const button = (id, action) => document.querySelector(`[data-ride-action="${action}"][data-ride="${id}"]`);

  const rescheduleValidator = createValidator(rescheduleForm, {
    date: notInPast,
    time: (v) => (!v ? 'Choose a pickup time.' : ''),
  });

  document.addEventListener('click', (event) => {
    const trigger = event.target instanceof Element ? event.target.closest('[data-ride-action]') : null;
    if (!trigger) return;
    const id = trigger.dataset.ride;
    activeRide = id;

    switch (trigger.dataset.rideAction) {
      case 'details': {
        const panel = document.getElementById(trigger.getAttribute('aria-controls'));
        const open = panel.hidden;
        panel.hidden = !open;
        trigger.setAttribute('aria-expanded', String(open));
        trigger.textContent = open ? 'Hide details' : 'View details';
        break;
      }
      case 'reschedule': {
        const dateEl = document.querySelector(`time[data-ride-date="${id}"]`);
        const timeEl = document.querySelector(`[data-ride-time="${id}"]`);
        rescheduleValidator.reset();
        rescheduleForm.elements.date.min = todayISO();
        rescheduleForm.elements.date.value = dateEl?.dateTime || '';
        rescheduleForm.elements.time.value = to24h(timeEl?.textContent ?? '');
        rescheduleDialog.querySelector('[data-dialog-ride-name]').textContent = rideName(id);
        rescheduleDialog.showModal();
        break;
      }
      case 'cancel': {
        cancelDialog.querySelector('[data-dialog-ride-name]').textContent = rideName(id);
        cancelDialog.returnValue = '';
        cancelDialog.showModal();
        break;
      }
      case 'restore': {
        document.querySelector(`[data-ride-row="${id}"]`).dataset.state = 'scheduled';
        setRideStatus(id, 'scheduled');
        ['reschedule', 'cancel'].forEach((a) => (button(id, a).hidden = false));
        trigger.hidden = true;
        if (tracker?.rideId === id) tracker.reset();
        note(id, 'Ride restored on this page.');
        button(id, 'cancel').focus();
        break;
      }
    }
  });

  rescheduleForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!rescheduleValidator.validate()) return;
    const { date, time } = rescheduleValidator.values();
    const parsed = parseISODate(date);
    qsa(`time[data-ride-date="${activeRide}"]`).forEach((el) => {
      el.dateTime = date;
      el.textContent = formatDate(parsed, el.dataset.dateStyle);
    });
    qsa(`[data-ride-time="${activeRide}"]`).forEach((el) => (el.textContent = formatTime(time)));
    setRideStatus(activeRide, 'scheduled');
    if (tracker?.rideId === activeRide) tracker.reset();
    note(activeRide, `Pickup moved to ${formatDate(parsed, 'long')} at ${formatTime(time)}. Updated on this page only; no transportation provider has been contacted.`);
    rescheduleDialog.close();
  });

  cancelDialog.addEventListener('close', () => {
    if (cancelDialog.returnValue !== 'cancel' || !activeRide) return;
    const id = activeRide;
    document.querySelector(`[data-ride-row="${id}"]`).dataset.state = 'cancelled';
    setRideStatus(id, 'cancelled');
    ['reschedule', 'cancel'].forEach((a) => (button(id, a).hidden = true));
    const restore = button(id, 'restore');
    restore.hidden = false;
    if (tracker?.rideId === id) tracker.disable();
    note(id, 'Ride cancelled on this page only. No transportation provider has been notified.');
    restore.focus();
  });

  qsa('[data-dialog-close]').forEach((btn) => btn.addEventListener('click', () => btn.closest('dialog').close()));
}

/* ------------------------------------------------------ Schedule a ride */

function initScheduleForm() {
  const form = document.getElementById('schedule-form');
  if (!form) return;
  const status = form.querySelector('[data-form-status]');
  const review = document.querySelector('[data-schedule-review]');
  const list = review.querySelector('[data-review-list]');
  const counter = form.querySelector('[data-char-count]');

  form.elements.date.min = todayISO();
  form.elements.notes.addEventListener('input', () => (counter.textContent = form.elements.notes.value.length));

  const validator = createValidator(form, {
    date: notInPast,
    time: (v, f) => {
      if (!v) return 'Choose a pickup time.';
      const date = f.elements.date.value;
      if (date === todayISO()) {
        const now = new Date();
        const current = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (v <= current) return 'For a ride today, choose a time later than now.';
      }
      return '';
    },
    pickup: (v) => (v.length < 3 ? 'Enter where the passenger will be picked up.' : ''),
    destination: (v) => (v.length < 3 ? 'Enter the destination or healthcare facility.' : ''),
    assistance: (v) => (!v ? 'Choose the level of mobility assistance needed.' : ''),
    tripType: (v) => (!v ? 'Choose one way or round trip.' : ''),
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validator.validate()) {
      setStatus(status, 'error', 'Some details are missing or need correcting. Please check the highlighted fields.');
      review.hidden = true;
      return;
    }
    setStatus(status, 'info', '');
    const v = validator.values();
    const rows = [
      ['Pickup date', formatDate(parseISODate(v.date), 'long')],
      ['Pickup time', formatTime(v.time)],
      ['Pickup location', v.pickup],
      ['Destination', v.destination],
      ['Mobility assistance', v.assistance],
      ['Trip type', v.tripType],
      ['Notes for the driver', form.elements.notes.value.trim() || 'None'],
    ];
    list.replaceChildren(
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
    review.hidden = false;
    review.querySelector('h3').focus();
  });

  review.querySelector('[data-review-edit]').addEventListener('click', () => {
    review.hidden = true;
    form.elements.date.focus();
  });
  review.querySelector('[data-review-clear]').addEventListener('click', () => {
    form.reset();
    validator.reset();
    counter.textContent = '0';
    review.hidden = true;
    setStatus(status, 'info', 'Form cleared. You can start a new request.');
    form.elements.date.focus();
  });
}

/* -------------------------------------------------------- Recurring */

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function joinDays(days) {
  const names = days.map((d) => DAY_NAMES[d - 1]);
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0];
}

function initRecurring() {
  const panel = document.querySelector('[data-recurring]');
  if (!panel) return;
  const toggle = panel.querySelector('[data-recurring-toggle]');
  const badge = panel.querySelector('[data-recurring-status]');
  const summary = panel.querySelector('[data-recurring-summary]');
  const note = panel.querySelector('[data-recurring-note]');
  const dialog = document.getElementById('recurring-dialog');
  const form = dialog.querySelector('form');
  const schedule = { days: [1, 3, 5], time: '07:45' };

  const renderDays = () => {
    qsa('[data-day]', panel).forEach((li) => {
      const on = schedule.days.includes(Number(li.dataset.day));
      li.toggleAttribute('data-on', on);
      li.querySelector('[data-weekday-mark]').textContent = on ? 'Ride' : '–';
    });
    summary.textContent = `${joinDays(schedule.days)} · pickup ${formatTime(schedule.time)}`;
  };

  toggle.addEventListener('click', () => {
    const active = toggle.getAttribute('aria-checked') !== 'true';
    toggle.setAttribute('aria-checked', String(active));
    panel.dataset.recurringState = active ? 'active' : 'paused';
    setStatusLabel(badge, active ? 'active' : 'paused');
    note.textContent = active
      ? 'Schedule turned back on, on this page only. Not sent to a provider.'
      : 'Schedule paused on this page only. Not sent to a provider.';
  });

  const validator = createValidator(form, {
    days: (v) => (v.length === 0 ? 'Choose at least one day.' : ''),
    time: (v) => (!v ? 'Choose a pickup time.' : ''),
  });

  panel.querySelector('[data-recurring-edit]').addEventListener('click', () => {
    validator.reset();
    qsa('input[name="days"]', form).forEach((box) => (box.checked = schedule.days.includes(Number(box.value))));
    form.elements.time.value = schedule.time;
    dialog.showModal();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validator.validate()) return;
    const { days, time } = validator.values();
    schedule.days = days.map(Number).sort((a, b) => a - b);
    schedule.time = time;
    renderDays();
    note.textContent = 'Schedule updated on this page only. Not sent to a provider.';
    dialog.close();
  });

  renderDays();
}

/* ---------------------------------------------------------- Profile */

function initProfile() {
  const form = document.getElementById('profile-form');
  if (!form) return;
  const status = form.querySelector('[data-form-status]');

  const validator = createValidator(form, {
    name: (v) => (v.length < 2 ? 'Enter the name you’d like us to use.' : ''),
    email: (v) => (!v ? 'Enter an email address.' : !isEmail(v) ? 'Enter an email address in the format name@example.com.' : ''),
    phone: (v, f) => {
      const method = f.elements.contact.value;
      if (!v) return method === 'email' ? '' : 'Add a phone number to be contacted by call or text.';
      return v.replace(/\D/g, '').length < 7 ? 'Enter a phone number with at least 7 digits.' : '';
    },
    contact: (v) => (!v ? 'Choose how you’d like to be contacted.' : ''),
  });

  // Changing the contact method can make the phone field required (or not).
  form.addEventListener('change', (event) => {
    if (event.target.name === 'contact' && form.elements.phone.hasAttribute('aria-invalid')) validator.validateField('phone');
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validator.validate()) {
      setStatus(status, 'error', 'Please correct the highlighted fields.');
      return;
    }
    const { name } = validator.values();
    qsa('[data-profile-name]').forEach((el) => (el.textContent = name));
    qsa('[data-first-name]').forEach((el) => (el.textContent = name.split(/\s+/)[0]));
    setStatus(status, 'success', 'Changes updated on this page. They haven’t been saved to an account or a server.');
  });
}

/* ----------------------------------------------------------- Sign out */

function initSignOut() {
  qsa('[data-sign-out]').forEach((link) =>
    link.addEventListener('click', () => {
      try {
        sessionStorage.removeItem('hw-test-session');
      } catch {}
    }),
  );
}

initRelativeDates();
initSectionNav();
initRides(createTracker());
initScheduleForm();
initRecurring();
initProfile();
initSignOut();
