export default function Filters({ filters, onChange, departments, users, statuses, priorities }) {
  const set = (patch) => onChange({ ...filters, ...patch });

  return (
    <div className="filters">
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filters.status_id === 'all' ? 'active' : ''}`}
          onClick={() => set({ status_id: 'all' })}
        >
          All
        </button>
        {statuses.map((s) => (
          <button
            key={s.id}
            className={`filter-tab ${filters.status_id === s.id ? 'active' : ''}`}
            onClick={() => set({ status_id: s.id })}
          >
            {s.name}
          </button>
        ))}
      </div>
      <div className="filter-sep" />
      <select className="filter-select" value={filters.assigned_to_department} onChange={(e) => set({ assigned_to_department: e.target.value })}>
        <option value="">All Departments</option>
        {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
      <select className="filter-select" value={filters.priority_id} onChange={(e) => set({ priority_id: e.target.value })}>
        <option value="">All Priority</option>
        {priorities.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <select className="filter-select" value={filters.assigned_to_user} onChange={(e) => set({ assigned_to_user: e.target.value })}>
        <option value="">All Assignees</option>
        {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
      </select>
    </div>
  );
}
