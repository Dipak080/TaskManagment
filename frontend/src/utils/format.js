// Presentation helpers shared across components.

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

export const priorityClass = (p) =>
  ({ urgent: 'p-urgent', high: 'p-high', medium: 'p-medium', low: 'p-low' }[p] || 'p-medium');

export const statusMeta = {
  pending: { cls: 's-pending', label: '● Pending' },
  in_progress: { cls: 's-progress', label: '▶ In Progress' },
  completed: { cls: 's-done', label: '✓ Completed' },
  rejected: { cls: 's-rejected', label: '✕ Rejected' },
};

const DAY = 86400000;

// Local YYYY-MM-DD (unlike toISOString(), which shifts to UTC and can land on
// the wrong calendar day for browsers behind/ahead of UTC).
export function localDateStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

// Returns { text, cls } describing how far the due date is from today.
export function dueInfo(dueDate, now = new Date()) {
  const due = parseDate(dueDate);
  if (!due) return { text: '—', cls: 'due-normal' };
  const text = due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const diffDays = Math.floor((stripTime(due) - stripTime(now)) / DAY);
  if (diffDays < 0) return { text, cls: 'due-overdue' };
  if (diffDays === 0) return { text, cls: 'due-today' };
  return { text, cls: 'due-normal' };
}

// Age = days relative to due date. Negative => overdue.
export function ageInfo(dueDate, now = new Date()) {
  const due = parseDate(dueDate);
  if (!due) return { text: '—', cls: '' };
  const diffDays = Math.floor((stripTime(due) - stripTime(now)) / DAY);
  if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, cls: 'critical' };
  if (diffDays === 0) return { text: '0d', cls: 'aging' };
  return { text: `${diffDays}d`, cls: '' };
}

function stripTime(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export const formatDateTime = (d) => {
  const dt = parseDate(d);
  if (!dt) return '—';
  return dt.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};
