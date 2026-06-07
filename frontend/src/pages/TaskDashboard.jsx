import { useCallback, useEffect, useMemo, useState } from 'react';
import StatsStrip from '../components/StatsStrip';
import Filters from '../components/Filters';
import TaskList from '../components/TaskList';
import DetailPanel from '../components/DetailPanel';
import CreateTaskModal from '../components/CreateTaskModal';
import TVMode from '../components/TVMode';
import { IconTV, IconPlus } from '../components/Icons';
import { TasksApi } from '../api/tasks';
import { MastersApi } from '../api/masters';
import { UsersApi } from '../api/auth';
import { computeStats } from '../utils/stats';
import { apiError } from '../utils/apiError';
import { useAuth } from '../auth/AuthContext';

const DEFAULT_FILTERS = { status_id: 'all', assigned_to_department: '', priority_id: '', assigned_to_user: '' };

/**
 * The Tasks/Dashboard workspace. Action buttons are gated by permissions;
 * the backend enforces the same checks independently.
 */
export default function TaskDashboard({ search, scope, createMode, onConsumeCreate }) {
  const { user, can, company } = useAuth();
  const [tasks, setTasks] = useState([]);
  
  // Metadata for dropdowns
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [serverStats, setServerStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selected, setSelected] = useState(null);
  const [activity, setActivity] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showTV, setShowTV] = useState(false);
  const [toast, setToast] = useState(null);

  const now = new Date();
  // Create can be granted on the dedicated "Create Task" page or directly on "Tasks".
  const canCreate = can('Create Task', 'create') || can('Tasks', 'create');
  const canEdit = can('Tasks', 'edit');
  const canClose = can('Tasks', 'close');
  const canDelete = can('Tasks', 'delete');

  const notify = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2600);
  };

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await TasksApi.list(filters);
      setTasks(Array.isArray(data) ? data : data.data || []);
    } catch (e) {
      setTasks([]);
      notify(apiError(e, 'Could not load tasks. Please refresh.'), 'error');
    }
    finally { setLoading(false); }
  }, [filters]);

  const loadMeta = useCallback(async () => {
    const safeFilter = (arr) => {
      if (Array.isArray(arr)) return arr.filter(x => x.is_active);
      if (arr && Array.isArray(arr.data)) return arr.data.filter(x => x.is_active);
      if (arr && typeof arr === 'object') {
        const vals = Object.values(arr);
        if (vals.length > 0 && typeof vals[0] === 'object') return vals.filter(x => x.is_active);
      }
      return [];
    };
    // Load one at a time (not Promise.all): the shared host blocks bursts of
    // simultaneous DB connections with "Operation not permitted".
    try { setDepartments(safeFilter(await MastersApi.list('departments'))); } catch { /* ignore */ }
    try { setUsers(safeFilter(await UsersApi.list())); } catch { /* ignore */ }
    try { setPriorities(safeFilter(await MastersApi.list('task_priorities'))); } catch { /* ignore */ }
    try { setCategories(safeFilter(await MastersApi.list('task_categories'))); } catch { /* ignore */ }
    try { setStatuses(safeFilter(await MastersApi.list('task_statuses'))); } catch { /* ignore */ }
  }, []);

  const loadStats = useCallback(async () => {
    try { setServerStats(await TasksApi.stats()); } catch { setServerStats(null); }
  }, []);

  // Run the initial loads sequentially to avoid a burst of parallel DB
  // connections (which the shared host rejects). Tasks first so they appear
  // quickly, then stats, then the dropdown metadata.
  useEffect(() => {
    (async () => {
      await loadTasks();
      await loadStats();
      await loadMeta();
    })();
  }, [loadTasks, loadMeta, loadStats]);

  // Sidebar "Create Task" click opens the modal (if permitted).
  useEffect(() => {
    if (createMode && canCreate) setShowCreate(true);
    if (createMode) onConsumeCreate?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createMode, canCreate]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setSelected(null); setShowTV(false); setShowCreate(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const stats = serverStats || computeStats(tasks, now);
  const myId = user?.id;

  const visibleTasks = useMemo(() => {
    let list = [...tasks];
    if (scope === 'overdue') list = list.filter((t) => new Date(t.due_date) < now && t.status_name?.toLowerCase() !== 'completed');
    else if (scope === 'mine') list = list.filter((t) => t.assigned_to_user === myId);

    // Filtering handled mostly by backend now, but we can double filter locally if needed
    const q = (search || '').trim().toLowerCase();
    if (q) list = list.filter((t) => `${t.title} ${t.code || ''} ${t.assignee_user_name || ''} ${t.assignee_dept_name || ''}`.toLowerCase().includes(q));
    
    // Default sort is handled by the backend (days_open desc)
    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, scope, search, myId]);

  const openTask = async (task) => {
    setSelected(task);
    setActivity([]);
    try {
      const fullTask = await TasksApi.get(task.id);
      const act = await TasksApi.activity(task.id);
      setSelected(fullTask);
      setActivity(act);
    } catch { /* default timeline */ }
  };

  const handleCreate = async (form) => {
    try {
      const created = await TasksApi.create(form);
      await loadTasks(); await loadStats();
      notify(`Task created${created?.code ? ` · ${created.code}` : ''}`);
    } catch (e) {
      notify(apiError(e, 'Create failed'), 'error');
    }
  };

  const handleTransition = async (action, reason = '', comment = '') => {
    if (!selected) return;
    try {
      await TasksApi.transition(selected.id, { action, reason, comment });
      await loadTasks(); await loadStats();
      const nextTask = await TasksApi.get(selected.id);
      setSelected(nextTask);
      setActivity(await TasksApi.activity(selected.id));
      notify('Task updated');
    } catch (e) {
      notify(apiError(e, 'Update failed'), 'error');
    }
  };

  const handleSetStatus = async (statusId, reason = '') => {
    if (!selected) return;
    try {
      await TasksApi.setStatus(selected.id, statusId, reason);
      await loadTasks(); await loadStats();
      const nextTask = await TasksApi.get(selected.id);
      setSelected(nextTask);
      setActivity(await TasksApi.activity(selected.id));
      notify('Status updated');
    } catch (e) {
      notify(apiError(e, 'Status update failed'), 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await TasksApi.delete(id);
      setSelected(null);
      await loadTasks(); await loadStats();
      notify('Task deleted successfully');
    } catch (e) {
      notify(apiError(e, 'Failed to delete task'), 'error');
    }
  };

  const handleTransfer = async (assignType, targetId, reason = '') => {
    if (!selected) return;
    try {
      await TasksApi.transfer(selected.id, {
        assign_type: assignType,
        assigned_to_user: assignType === 'user' ? targetId : null,
        assigned_to_department: assignType === 'department' ? targetId : null,
        reason
      });
      await loadTasks(); await loadStats();
      const nextTask = await TasksApi.get(selected.id);
      setSelected(nextTask);
      setActivity(await TasksApi.activity(selected.id));
      notify('Task transferred successfully');
    } catch (e) {
      notify(apiError(e, 'Transfer failed'), 'error');
    }
  };

  const handleAddComment = async (body) => {
    if (!selected) return;
    try {
      await TasksApi.addComment(selected.id, body);
      setActivity(await TasksApi.activity(selected.id));
      notify('Comment posted');
    } catch (e) {
      notify(apiError(e, 'Failed to post comment'), 'error');
    }
  };

  const title = scope === 'mine' ? 'My Tasks' : scope === 'overdue' ? 'Overdue Tasks' : 'Task Dashboard';
  const pageSub = `${now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ${visibleTasks.length} task${visibleTasks.length === 1 ? '' : 's'}`;

  const overdueThreshold = company?.overdue_threshold_days || 3;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">{title}</div>
          <div className="page-sub">{pageSub}</div>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost" onClick={() => setShowTV(true)}><IconTV /> TV Mode</button>
          {canCreate && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}><IconPlus /> New Task</button>
          )}
        </div>
      </div>

      <StatsStrip stats={stats} />
      <Filters filters={filters} onChange={setFilters} departments={departments} users={users} statuses={statuses} priorities={priorities} />
      <TaskList tasks={visibleTasks} now={now} loading={loading} onOpen={openTask} overdueThreshold={overdueThreshold} />

      <DetailPanel
        task={selected}
        now={now}
        activity={activity}
        statuses={statuses}
        canEdit={canEdit}
        canClose={canClose}
        canDelete={canDelete}
        onClose={() => setSelected(null)}
        onTransition={handleTransition}
        onTransfer={handleTransfer}
        onSetStatus={handleSetStatus}
        onAddComment={handleAddComment}
        onDelete={handleDelete}
        myId={myId}
        users={users}
        departments={departments}
      />

      <CreateTaskModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
        departments={departments}
        users={users}
        priorities={priorities}
        categories={categories}
      />

      <TVMode open={showTV} onClose={() => setShowTV(false)} tasks={tasks} stats={stats} now={now} />

      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </>
  );
}
