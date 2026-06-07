// Client-side stats fallback (used when the API /stats endpoint is unavailable).
export function computeStats(tasks, now = new Date()) {
  const isOverdue = (t) => new Date(t.due_date) < stripToday(now) && t.status !== 'completed';
  return {
    urgent: tasks.filter((t) => t.priority === 'urgent' || isOverdue(t)).length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    closed_today: tasks.filter((t) => t.status === 'completed').length,
    total: tasks.length,
    avg_close: '—',
  };
}

function stripToday(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
