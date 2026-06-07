import { useState, useEffect, useMemo } from 'react';
import { MetaApi, TasksApi } from '../api/tasks';
import { MastersApi } from '../api/masters';
import { useAuth } from '../auth/AuthContext';
import StatsStrip from '../components/StatsStrip';
import TaskList from '../components/TaskList';
import DetailPanel from '../components/DetailPanel';
import { notify } from '../utils/toast';
import { apiError } from '../utils/apiError';

export default function HomeDashboard({ search }) {
  const { company, user, can } = useAuth();
  const [stats, setStats] = useState({});
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [activity, setActivity] = useState([]);
  const now = new Date();

  // Filters
  const [deptFilter, setDeptFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');

  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      // Load one at a time (not Promise.all): the shared host rejects bursts of
      // simultaneous DB connections with "Operation not permitted".
      setTasks(await TasksApi.list());
      setStats(await TasksApi.stats());
      setDepartments(await MetaApi.departments());
      setUsers(await MetaApi.users());
      const _statuses = await MastersApi.list('task_statuses').catch(() => []);
      const statusArr = Array.isArray(_statuses) ? _statuses : (_statuses?.data || []);
      setStatuses(statusArr.filter((s) => s.is_active));
    } catch (e) {
      notify(apiError(e, 'Could not load the dashboard. Please refresh.'));
    }
    setLoading(false);
  };

  const openTask = async (task) => {
    setSelected(task); // Optimistic initial render with partial data
    setActivity([]);
    try {
      // Fetch full task data (including checklists and attachments)
      const fullTask = await TasksApi.get(task.id);
      setSelected(fullTask);
      setActivity(await TasksApi.activity(task.id));
    } catch (e) {
      console.error('Failed to load full task details', e);
    }
  };

  const handleTransition = async (action, reason = '', comment = '') => {
    if (!selected) return;
    try {
      await TasksApi.transition(selected.id, { action, reason, comment });
      await loadDashboard();
      const nextTask = await TasksApi.get(selected.id);
      setSelected(nextTask);
      setActivity(await TasksApi.activity(selected.id));
    } catch (e) {
      notify(apiError(e, 'Update failed'));
    }
  };

  const handleSetStatus = async (statusId, reason = '') => {
    if (!selected) return;
    try {
      await TasksApi.setStatus(selected.id, statusId, reason);
      await loadDashboard();
      const nextTask = await TasksApi.get(selected.id);
      setSelected(nextTask);
      setActivity(await TasksApi.activity(selected.id));
    } catch (e) {
      notify(apiError(e, 'Status update failed'));
    }
  };

  const handleTransfer = async (type, targetId, comment) => {
    if (!selected) return;
    try {
      await TasksApi.transfer(selected.id, {
        assign_type: type,
        assigned_to_user: type === 'user' ? targetId : null,
        assigned_to_department: type === 'department' ? targetId : null,
        reason: comment
      });
      await loadDashboard();
      const nextTask = await TasksApi.get(selected.id);
      setSelected(nextTask);
      setActivity(await TasksApi.activity(selected.id));
      notify('Task forwarded successfully');
    } catch (e) {
      notify(apiError(e, 'Failed to forward task'));
    }
  };

  const handleDelete = async (id) => {
    try {
      await TasksApi.delete(id);
      setSelected(null);
      await loadDashboard();
      notify('Task deleted successfully');
    } catch (e) {
      notify(apiError(e, 'Failed to delete task'));
    }
  };

  const isOpen = (t) => !['completed', 'closed', 'rejected'].includes(t.status_name?.toLowerCase());
  const isOverdue = (t) => t.due_date && new Date(t.due_date) < now && isOpen(t);

  // Department-wise breakdown: open / overdue / total task counts per department.
  const deptBreakdown = useMemo(() => {
    const map = new Map();
    tasks.forEach((t) => {
      const name = t.assignee_dept_name || 'Unassigned';
      const row = map.get(name) || { name, open: 0, overdue: 0, total: 0 };
      row.total += 1;
      if (isOpen(t)) row.open += 1;
      if (isOverdue(t)) row.overdue += 1;
      map.set(name, row);
    });
    return [...map.values()].sort((a, b) => b.open - a.open || b.total - a.total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  // People-wise breakdown: open / overdue / total task counts per assignee.
  const peopleBreakdown = useMemo(() => {
    const map = new Map();
    tasks.forEach((t) => {
      const name = t.assignee_user_name || 'Unassigned';
      const row = map.get(name) || { name, open: 0, overdue: 0, total: 0 };
      row.total += 1;
      if (isOpen(t)) row.open += 1;
      if (isOverdue(t)) row.overdue += 1;
      map.set(name, row);
    });
    return [...map.values()].sort((a, b) => b.open - a.open || b.total - a.total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    // Only OPEN tasks: not completed, closed, rejected
    let list = tasks.filter(t => !['completed', 'closed', 'rejected'].includes(t.status_name?.toLowerCase()));

    if (deptFilter !== 'all') list = list.filter(t => String(t.assigned_to_department) === String(deptFilter));
    if (userFilter !== 'all') list = list.filter(t => String(t.assigned_to_user) === String(userFilter));

    if (search) {
      const q = search.trim().toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(q));
    }

    // Sort by days_open desc
    return list.sort((a, b) => (b.days_open || 0) - (a.days_open || 0));
  }, [tasks, deptFilter, userFilter, search]);

  const overdueThreshold = company?.overdue_threshold_days || 3;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">Overview of your open tasks and performance</div>
        </div>
      </div>

      <StatsStrip stats={stats} />

      <div className="breakdown-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, padding: '0 20px', marginBottom: 16 }}>
        <BreakdownCard title="Department-wise" subtitle="Open tasks by department" rows={deptBreakdown} loading={loading} />
        <BreakdownCard title="People-wise" subtitle="Open tasks by assignee" rows={peopleBreakdown} loading={loading} />
      </div>

      <div className="filters-strip">
        <select className="filter-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
          <option value="all">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="filter-select" value={userFilter} onChange={e => setUserFilter(e.target.value)}>
          <option value="all">All People</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      <TaskList 
        tasks={visibleTasks} 
        now={now} 
        loading={loading} 
        onOpen={openTask} 
        overdueThreshold={overdueThreshold}
      />

      <DetailPanel
        task={selected}
        now={now}
        activity={activity}
        statuses={statuses}
        canEdit={can('Tasks', 'edit')}
        canClose={can('Tasks', 'close')}
        canDelete={can('Tasks', 'delete')}
        onClose={() => setSelected(null)}
        onTransition={handleTransition}
        onTransfer={handleTransfer}
        onSetStatus={handleSetStatus}
        onDelete={handleDelete}
        onAddComment={async (body) => {
          await TasksApi.addComment(selected.id, body);
          setActivity(await TasksApi.activity(selected.id));
        }}
        myId={user.id}
        users={users}
        departments={departments}
      />
    </>
  );
}

function BreakdownCard({ title, subtitle, rows, loading }) {
  const maxOpen = Math.max(1, ...rows.map((r) => r.open));
  return (
    <div className="table-card" style={{ padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <div className="page-title" style={{ fontSize: 15 }}>{title}</div>
        <div className="page-sub" style={{ fontSize: 12 }}>{subtitle}</div>
      </div>
      {loading ? (
        <div className="loading-state" style={{ padding: 20 }}>Loading…</div>
      ) : rows.length === 0 ? (
        <div className="empty-state" style={{ padding: 20 }}>No data yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((r) => (
            <div key={r.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: 'var(--text)' }}>{r.name}</span>
                <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {r.overdue > 0 && (
                    <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600 }}>{r.overdue} overdue</span>
                  )}
                  <span style={{ fontFamily: 'var(--mono)', color: 'var(--text2)' }}>{r.open}/{r.total}</span>
                </span>
              </div>
              <div style={{ height: 6, background: 'var(--navy4)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(r.open / maxOpen) * 100}%`, background: r.overdue > 0 ? 'var(--red)' : 'var(--blue)', borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
