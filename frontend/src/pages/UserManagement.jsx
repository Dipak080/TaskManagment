import { useEffect, useState } from 'react';
import { UsersApi, RolesApi } from '../api/auth';
import { MetaApi } from '../api/tasks';
import { useAuth } from '../auth/AuthContext';
import { IconPlus } from '../components/Icons';
import DevFillButton from '../components/DevFillButton';
import { confirmDialog } from '../utils/confirm';
import { apiError } from '../utils/apiError';

export default function UserManagement() {
  const { can } = useAuth();
  const canCreate = can('User Management', 'create');
  const canEdit = can('User Management', 'edit');
  const canDelete = can('User Management', 'delete');

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = (m, t = 'success') => { setToast({ m, t }); setTimeout(() => setToast(null), 2600); };
  const load = async () => {
    setLoading(true);
    try {
      // Sequential (not Promise.all) to avoid a burst of parallel DB
      // connections, which the shared host rejects.
      setUsers(await UsersApi.list());
      setRoles(await RolesApi.list().catch(() => []));
      const d = await MetaApi.departments().catch(() => []);
      setDepartments(Array.isArray(d) ? d : []);
    } catch (e) {
      notify(apiError(e, 'Failed to load users'), 'error');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (await confirmDialog("Are you sure you want to delete this user?")) {
      try {
        await UsersApi.delete(id);
        notify('User deleted successfully');
        load();
      } catch (e) {
        notify(apiError(e, 'Failed to delete user'), 'error');
      }
    }
  };

  const toggleBlock = async (u) => {
    const block = !!u.is_active; // currently active → we are about to block
    if (await confirmDialog(`${block ? 'Block' : 'Unblock'} ${u.name}?`)) {
      try {
        await UsersApi.update(u.id, { is_active: !u.is_active });
        notify(block ? 'User blocked' : 'User unblocked');
        load();
      } catch (e) {
        notify(apiError(e, 'Failed to update user'), 'error');
      }
    }
  };

  const roleName = (id) => roles.find((r) => r.id === id)?.name || (id ? `#${id}` : 'No role');

  return (
    <div className="content-pad">
      <div className="admin-head">
        <div>
          <div className="page-title">User Management</div>
          <div className="page-sub">{users.length} user{users.length === 1 ? '' : 's'} · each user has exactly one role</div>
        </div>
        {canCreate && <button className="btn btn-primary" onClick={() => setCreating(true)}><IconPlus /> New User</button>}
      </div>

      {loading ? <div className="loading-state">Loading users…</div> : (
        <div className="table-card">
          <div className="urow urow-head">
            <div>Name</div><div>Email</div><div>Phone</div><div>Department</div><div>Role</div><div>Status</div><div></div>
          </div>
          {users.map((u) => (
            <div className="urow" key={u.id}>
              <div>{u.name}</div>
              <div style={{ color: 'var(--text2)' }}>{u.email}</div>
              <div style={{ color: 'var(--text2)' }}>{u.phone || '—'}</div>
              <div style={{ color: 'var(--text2)' }}>{u.department_name || '—'}</div>
              <div><span className="role-chip">{u.role_name || roleName(u.role_id)}</span></div>
              <div><span className={`company-pill ${u.is_active ? 'on' : 'off'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></div>
              <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                {canEdit && <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setEditing(u)}>Edit</button>}
                {canEdit && <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11, color: u.is_active ? 'var(--amber, #d29922)' : 'var(--green, #3fb950)' }} onClick={() => toggleBlock(u)}>{u.is_active ? 'Block' : 'Unblock'}</button>}
                {canDelete && <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11, color: 'var(--red)' }} onClick={() => handleDelete(u.id)}>Delete</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <UserModal roles={roles} departments={departments} onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); load(); notify('User created'); }} />
      )}
      {editing && (
        <UserModal roles={roles} departments={departments} user={editing} onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); notify('User updated'); }} />
      )}

      {toast && <div className={`toast ${toast.t}`}>{toast.m}</div>}
    </div>
  );
}

function UserModal({ roles, departments = [], user, onClose, onSaved }) {
  const editMode = !!user;
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '', phone: user?.phone || '',
    password: '', role_id: user?.role_id || '', department_id: user?.department_id || '',
    is_active: user ? user.is_active : true,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setErr('');
    if (!form.name.trim() || (!editMode && (!form.email.trim() || form.password.length < 6))) {
      setErr('Name, email and a password of at least 6 characters are required'); return;
    }
    setBusy(true);
    try {
      if (editMode) {
        if (form.password && form.password.length < 6) {
          setErr('New password must be at least 6 characters'); setBusy(false); return;
        }
        await UsersApi.update(user.id, {
          name: form.name, phone: form.phone,
          role_id: form.role_id || null, department_id: form.department_id || null,
          is_active: form.is_active,
          ...(form.password ? { password: form.password } : {}),
        });
      } else {
        await UsersApi.create({
          name: form.name, email: form.email, phone: form.phone,
          password: form.password, role_id: form.role_id || null,
          department_id: form.department_id || null,
        });
      }
      onSaved();
    } catch (e) {
      setErr(apiError(e, 'Save failed'));
    }
    finally { setBusy(false); }
  };

  return (
    <div className="modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ position: 'relative' }}>
        {!editMode && (
          <DevFillButton onFill={() => {
            setForm(f => ({
              ...f,
              name: 'Test User ' + Math.floor(Math.random() * 100),
              email: 'test' + Math.floor(Math.random() * 1000) + '@example.com',
              phone: '9999999999',
              password: 'password123',
              role_id: roles[0]?.id || ''
            }));
          }} />
        )}
        <div className="modal-header"><div className="modal-title">{editMode ? `Edit · ${user.name}` : 'New User'}</div><button className="close-btn" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          {err && <div className="login-error">{err}</div>}
          <div className="form-group"><label>Full Name *</label><input className="form-input" value={form.name} onChange={set('name')} /></div>
          <div className="form-row">
            <div className="form-group"><label>Email *</label><input className="form-input" type="email" value={form.email} onChange={set('email')} disabled={editMode} /></div>
            <div className="form-group"><label>Phone</label><input className="form-input" value={form.phone} onChange={set('phone')} /></div>
          </div>
          {!editMode && (
            <div className="form-group"><label>Temporary Password *</label><input className="form-input" type="text" value={form.password} onChange={set('password')} placeholder="min 6 characters" /></div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label>Role *</label>
              <select className="form-select" value={form.role_id} onChange={set('role_id')}>
                <option value="">No role</option>
                {roles.filter((r) => r.is_active).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Department</label>
              <select className="form-select" value={form.department_id} onChange={set('department_id')}>
                <option value="">No department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            {editMode && (
              <div className="form-group">
                <label>Status</label>
                <select className="form-select" value={form.is_active ? '1' : '0'} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value === '1' }))}>
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>
            )}
          </div>
          {editMode && (
            <div className="form-group">
              <label>Reset Password</label>
              <input className="form-input" type="text" value={form.password} onChange={set('password')} placeholder="Leave blank to keep current password" />
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy} onClick={submit}>{busy ? 'Saving…' : editMode ? 'Save' : 'Create User →'}</button>
        </div>
      </div>
    </div>
  );
}
