import { Fragment, useEffect, useState } from 'react';
import { RolesApi } from '../api/auth';
import { useAuth } from '../auth/AuthContext';
import { IconPlus } from '../components/Icons';
import DevFillButton from '../components/DevFillButton';
import { confirmDialog } from '../utils/confirm';
import { apiError } from '../utils/apiError';

const ACTIONS = [
  { key: 'can_view', label: 'View' },
  { key: 'can_create', label: 'Create' },
  { key: 'can_edit', label: 'Edit' },
  { key: 'can_close', label: 'Close' },
  { key: 'can_delete', label: 'Delete' },
];

export default function RoleManagement() {
  const { can, refreshSession, roleId } = useAuth();
  const canCreate = can('Role Management', 'create');
  const canEdit = can('Role Management', 'edit');
  const canDelete = can('Role Management', 'delete');

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState(null); // role for matrix
  const [toast, setToast] = useState(null);

  const notify = (m, t = 'success') => { setToast({ m, t }); setTimeout(() => setToast(null), 2600); };
  const load = () => { setLoading(true); RolesApi.list().then(setRoles).catch(() => notify('Failed to load roles', 'error')).finally(() => setLoading(false)); };
  useEffect(load, []);

  const toggleActive = async (r) => {
    try { await RolesApi.update(r.id, { is_active: !r.is_active }); load(); }
    catch { notify('Update failed', 'error'); }
  };

  const handleDelete = async (id) => {
    if (await confirmDialog("Are you sure you want to delete this role?")) {
      try {
        await RolesApi.delete(id);
        notify('Role deleted successfully');
        load();
      } catch (e) {
        notify(apiError(e, 'Failed to delete role'), 'error');
      }
    }
  };

  return (
    <div className="content-pad">
      <div className="admin-head">
        <div>
          <div className="page-title">Role Management</div>
          <div className="page-sub">{roles.length} role{roles.length === 1 ? '' : 's'} · define what each role can see and do</div>
        </div>
        {canCreate && <button className="btn btn-primary" onClick={() => setShowNew(true)}><IconPlus /> New Role</button>}
      </div>

      {loading ? <div className="loading-state">Loading roles…</div> : (
        <div className="admin-grid">
          {roles.map((r) => (
            <div className="company-card" key={r.id}>
              <div className="cc-top">
                <div>
                  <div className="company-name">{r.name}</div>
                  <div className="company-meta">{r.user_count} user{r.user_count === 1 ? '' : 's'}{r.is_system ? ' · system role' : ''}</div>
                </div>
                <span className={`company-pill ${r.is_active ? 'on' : 'off'}`}>{r.is_active ? '● Active' : '○ Inactive'}</span>
              </div>
              <div className="company-actions">
                <button className="btn btn-ghost" onClick={() => setEditing(r)}>{canEdit ? 'Edit permissions' : 'View permissions'}</button>
                {canEdit && !r.is_system && (
                  <button className="btn btn-ghost" onClick={() => toggleActive(r)}>{r.is_active ? 'Deactivate' : 'Activate'}</button>
                )}
                {canDelete && !r.is_system && (
                  <button className="btn btn-ghost" style={{ color: 'var(--red)' }} onClick={() => handleDelete(r.id)}>Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <NewRoleModal
          onClose={() => setShowNew(false)}
          onSaved={() => { setShowNew(false); load(); notify('Role created'); }}
        />
      )}

      {editing && (
        <MatrixModal
          role={editing}
          editable={canEdit}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null); load(); notify('Permissions saved');
            // If we edited our own role, refresh our menu/permissions live.
            if (editing.id === roleId) await refreshSession();
          }}
        />
      )}

      {toast && <div className={`toast ${toast.t}`}>{toast.m}</div>}
    </div>
  );
}

function NewRoleModal({ onClose, onSaved }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    if (!name.trim()) { setErr('Role name is required'); return; }
    setBusy(true); setErr('');
    try { await RolesApi.create({ name: name.trim() }); onSaved(); }
    catch (e) { setErr(apiError(e, 'Failed to create role')); }
    finally { setBusy(false); }
  };

  return (
    <div className="modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ position: 'relative' }}>
        <DevFillButton onFill={() => setName('Test Role ' + Math.floor(Math.random() * 100))} />
        <div className="modal-header"><div className="modal-title">New Role</div><button className="close-btn" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          {err && <div className="login-error">{err}</div>}
          <div className="form-group"><label>Role Name *</label><input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Supervisor" autoFocus /></div>
          <div className="login-hint" style={{ textAlign: 'left' }}>After creating, open the role to set its page permissions.</div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy} onClick={submit}>{busy ? 'Creating…' : 'Create Role →'}</button>
        </div>
      </div>
    </div>
  );
}

function MatrixModal({ role, editable, onClose, onSaved }) {
  const [matrix, setMatrix] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    RolesApi.permissions(role.id).then((d) => setMatrix(d.matrix)).catch(() => setMatrix([]));
  }, [role.id]);

  const toggle = (pageId, key) => {
    if (!editable) return;
    setMatrix((m) => m.map((p) => {
      if (p.page_id !== pageId) return p;
      const next = { ...p, [key]: !p[key] };
      // View is required for any other permission to be meaningful.
      if (key === 'can_view' && !next.can_view) {
        next.can_create = next.can_edit = next.can_close = next.can_delete = false;
      }
      if (key !== 'can_view' && next[key]) next.can_view = true;
      return next;
    }));
  };

  const setGroupAll = (val) => {
    if (!editable) return;
    setMatrix((m) => m.map((p) => ({ ...p, can_view: val, can_create: val, can_edit: val, can_close: val, can_delete: val })));
  };

  const save = async () => {
    setBusy(true);
    try { 
      await RolesApi.savePermissions(role.id, matrix); 
      onSaved(); 
    } catch (e) {
      alert(apiError(e, 'Failed to save permissions'));
    } finally { 
      setBusy(false); 
    }
  };

  // Group rows by module_group for display.
  const groups = [];
  const idx = {};
  (matrix || []).forEach((p) => {
    if (!(p.module_group in idx)) { idx[p.module_group] = groups.length; groups.push({ group: p.module_group, rows: [] }); }
    groups[idx[p.module_group]].rows.push(p);
  });

  return (
    <div className="modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-wide">
        <div className="modal-header">
          <div className="modal-title">Permissions · {role.name}{role.is_system ? ' (system)' : ''}</div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {matrix === null ? <div className="loading-state">Loading matrix…</div> : (
            <>
              {editable && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <button className="btn btn-ghost" onClick={() => setGroupAll(true)}>Select all</button>
                  <button className="btn btn-ghost" onClick={() => setGroupAll(false)}>Clear all</button>
                </div>
              )}
              <table className="matrix">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Page</th>
                    {ACTIONS.map((a) => <th key={a.key}>{a.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => (
                    <Fragment key={g.group}>
                      <tr className="matrix-group"><td colSpan={5}>{g.group}</td></tr>
                      {g.rows.map((p) => (
                        <tr key={p.page_id}>
                          <td style={{ textAlign: 'left' }}>{p.name.startsWith('Masters-') ? p.name.slice(8) : p.name}</td>
                          {ACTIONS.map((a) => (
                            <td key={a.key}>
                              <input type="checkbox" checked={!!p[a.key]} disabled={!editable} onChange={() => toggle(p.page_id, a.key)} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          {editable && <button className="btn btn-primary" disabled={busy || matrix === null} onClick={save}>{busy ? 'Saving…' : 'Save Permissions'}</button>}
        </div>
      </div>
    </div>
  );
}
