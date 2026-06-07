import { initials } from '../utils/format';

export default function TaskRow({ task, now, onOpen, overdueThreshold = 3 }) {
  const isOverdue = (task.due_date && new Date(task.due_date) < now && task.status_name?.toLowerCase() !== 'completed') 
                    || (task.days_open > overdueThreshold);
  const rowClass = isOverdue ? 'urgent-row' : '';

  const assigneeName = task.assignee_user_name || task.assignee_dept_name || 'Unassigned';

  return (
    <div className={`task-row ${rowClass}`} onClick={() => onOpen(task)}>
      <div 
        className="priority-dot" 
        style={{ backgroundColor: task.priority_color || '#ccc', width: 10, height: 10, borderRadius: '50%', margin: '0 auto' }} 
      />
      <div className="task-title-cell">
        <div className="task-title">{task.title}</div>
      </div>
      <div className="task-assignee">
        <div className="assignee-av" style={{ backgroundColor: task.assigned_to_department ? '#8b5cf6' : undefined }}>
          {initials(assigneeName)}
        </div>
        {assigneeName}
      </div>
      <div className="task-assignee" style={{ color: 'var(--text2)' }}>
        {task.created_by_name || 'Admin'}
      </div>
      <div>
        <span 
          className="status-pill" 
          style={{ 
            backgroundColor: task.status_color ? `${task.status_color}15` : '#f1f5f9', 
            color: task.status_color || '#64748b',
            border: `1px solid ${task.status_color ? `${task.status_color}30` : '#cbd5e1'}`
          }}
        >
          {task.status_name || 'Unknown'}
        </span>
      </div>
      <div>
        <span style={{ color: task.priority_color || 'inherit', fontWeight: 500 }}>
          {task.priority_name || '—'}
        </span>
      </div>
      <div className={`task-age ${task.days_open > overdueThreshold ? 'critical' : ''}`}>
        {task.days_open != null ? `${task.days_open}d` : '—'}
      </div>
      <div className="task-menu" onClick={(e) => e.stopPropagation()}>⋯</div>
    </div>
  );
}
