export default function StatsStrip({ stats }) {
  const s = stats || {};
  return (
    <div className="stats">
      <div className="stat-card urgent">
        <div className="stat-label">Urgent / Overdue</div>
        <div className="stat-value">{s.urgent ?? 0}</div>
        <div className="stat-sub">Needs immediate action</div>
      </div>
      <div className="stat-card pending">
        <div className="stat-label">Pending</div>
        <div className="stat-value">{s.pending ?? 0}</div>
        <div className="stat-sub">Awaiting action</div>
      </div>
      <div className="stat-card progress">
        <div className="stat-label">In Progress</div>
        <div className="stat-value">{s.in_progress ?? 0}</div>
        <div className="stat-sub">Being worked on</div>
      </div>
      <div className="stat-card done">
        <div className="stat-label">Closed Today</div>
        <div className="stat-value">{s.closed_today ?? 0}</div>
        <div className="stat-sub">Out of {s.total ?? 0} total</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Avg Close Time</div>
        <div className="stat-value" style={{ color: 'var(--text)' }}>{s.avg_close ?? '—'}</div>
        <div className="stat-sub">Last 7 days</div>
      </div>
    </div>
  );
}
