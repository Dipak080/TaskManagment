import TaskRow from './TaskRow';
import { IconFilter } from './Icons';

export default function TaskList({ tasks, now, loading, onOpen, overdueThreshold = 3 }) {
  if (loading) return <div className="task-area"><div className="loading-state">Loading tasks…</div></div>;
  if (!tasks.length) return <div className="task-area"><div className="empty-state"><IconFilter /> No tasks match your criteria.</div></div>;

  return (
    <div className="task-area">
      <div className="list-header">
        <div />
        <div>Task Title</div>
        <div>Assigned To</div>
        <div>Created By</div>
        <div>Status</div>
        <div>Priority</div>
        <div>Days Open</div>
        <div />
      </div>

      <div className="task-list">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} now={now} onOpen={onOpen} overdueThreshold={overdueThreshold} />
        ))}
      </div>
    </div>
  );
}
