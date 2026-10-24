// Date helpers for fictional account data. Example rides are stored as day
// offsets from today, so "upcoming" rides never drift into the past.
//
//   <time data-day-offset="3" data-date-style="short"></time>

const STYLES = {
  long: { weekday: 'long', month: 'long', day: 'numeric' },
  short: { weekday: 'short', month: 'short', day: 'numeric' },
  full: { month: 'short', day: 'numeric', year: 'numeric' },
};

export function dateFromOffset(offset) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
}

/** Parses "YYYY-MM-DD" as a local date (no timezone shift). */
export function parseISODate(value) {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function toISODate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatDate(date, style = 'long') {
  return new Intl.DateTimeFormat('en-US', STYLES[style] ?? STYLES.long).format(date);
}

/** "14:05" → "2:05 PM" */
export function formatTime(value) {
  const [h, m] = value.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function initRelativeDates(root = document) {
  root.querySelectorAll('[data-day-offset]').forEach((el) => {
    const date = dateFromOffset(Number(el.dataset.dayOffset));
    el.textContent = formatDate(date, el.dataset.dateStyle);
    if (el instanceof HTMLTimeElement) el.dateTime = toISODate(date);
  });
}
