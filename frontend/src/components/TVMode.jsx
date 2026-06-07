import { useEffect, useState } from 'react';

export default function TVMode({ open, onClose, tasks, stats, now }) {
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    if (!open) return undefined;
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, [open]);

  // Show pending / in-progress items.
  const rows = tasks
    .filter((t) => t.status_name?.toLowerCase() !== 'completed' && t.status_name?.toLowerCase() !== 'closed' && t.status_name?.toLowerCase() !== 'rejected')
    .slice(0, 8);

  const ticker = rows
    .map((t) => `${t.title} — ${t.assignee_user_name || t.assignee_dept_name || 'Unassigned'} (${t.category_name || 'General'})`)
    .join('   ·   ');

  if (!open) return null;

  return (
    <div className={`tv-overlay ${open ? 'show' : ''}`}>
      <button className="tv-exit" onClick={onClose}>✕ Exit TV Mode</button>
      <div className="tv-topbar">
        <div>
          <div className="tv-brand">TASKOPS — AJAY CHEMICALS</div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 3, letterSpacing: '0.06em' }}>
            LIVE TASK BOARD · PENDING ITEMS
          </div>
        </div>
        <div>
          <div className="tv-clock">{clock.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
          <div className="tv-date">{clock.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      <div className="tv-stats">
        <div className="tv-stat urgent-stat"><div className="tv-stat-val">{stats.urgent ?? 0}</div><div className="tv-stat-lbl">Urgent / Overdue</div></div>
        <div className="tv-stat pending-stat"><div className="tv-stat-val">{stats.pending ?? 0}</div><div className="tv-stat-lbl">Pending</div></div>
        <div className="tv-stat progress-stat"><div className="tv-stat-val">{stats.in_progress ?? 0}</div><div className="tv-stat-lbl">In Progress</div></div>
        <div className="tv-stat done-stat"><div className="tv-stat-val">{stats.closed_today ?? 0}</div><div className="tv-stat-lbl">Closed Today</div></div>
      </div>

      <div className="tv-list">
        <div className="tv-list-header">
          <div>Task</div><div>Category</div><div>Assigned To</div><div>Age</div><div>Status</div>
        </div>
        <div className="tv-rows">
          {rows.map((t, i) => {
            const rowCls = t.priority_name?.toLowerCase() === 'urgent' ? 'tv-urgent' : t.days_open > 7 ? 'tv-overdue' : '';
            return (
              <div className={`tv-row ${rowCls}`} key={t.id} style={{ animationDelay: `${0.05 * (i + 1)}s` }}>
                <div className="tv-title">{t.title}</div>
                <div className="tv-dept">{t.category_name || '—'}</div>
                <div className="tv-assignee">{t.assignee_user_name || t.assignee_dept_name || '—'}</div>
                <div className={`tv-age ${t.days_open > 7 ? 'red' : t.days_open > 3 ? 'amber' : ''}`}>{t.days_open != null ? `${t.days_open}d` : '—'}</div>
                <div>
                  <span 
                    className="status-pill" 
                    style={{ backgroundColor: t.status_color || '#ccc', color: '#fff', border: 'none' }}
                  >
                    {t.status_name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="tv-ticker">
        <div className="ticker-label">● LIVE</div>
        <div className="ticker-scroll">
          <div className="ticker-inner">{ticker || 'No pending tasks · All caught up'}</div>
        </div>
      </div>
    </div>
  );
}
