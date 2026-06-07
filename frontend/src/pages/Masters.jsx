import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { MastersApi } from '../api/masters';
import { IconPlus } from '../components/Icons';
import DevFillButton from '../components/DevFillButton';
import { confirmDialog } from '../utils/confirm';
import { apiError } from '../utils/apiError';

const CONFIG = {
  'Masters-Departments': { types: [{ key: 'departments', name: 'Departments', fields: [] }] },
  'Masters-TaskStatuses': { types: [{ key: 'task_statuses', name: 'Task Statuses', fields: [{ name: 'color', label: 'Color', type: 'color' }, { name: 'sort_order', label: 'Sort Order', type: 'number' }] }] },
  'Masters-TaskPriorities': { types: [{ key: 'task_priorities', name: 'Task Priorities', fields: [{ name: 'color', label: 'Color', type: 'color' }] }] },
  'Masters-TaskCategories': { types: [{ key: 'task_categories', name: 'Task Categories', fields: [] }] }
};

export default function Masters({ active }) {
  const { can } = useAuth();
  const config = CONFIG[active];
  const pageName = active;

  const canCreate = can(pageName, 'create');
  const canEdit = can(pageName, 'edit');
  const canDelete = can(pageName, 'delete');

  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const typeConfig = config?.types[activeTabIdx] || config?.types[0];

  const [data, setData] = useState([]);
  const [parentData, setParentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = (m, t = 'success') => { setToast({ m, t }); setTimeout(() => setToast(null), 2600); };

  const loadData = async () => {
    if (!typeConfig) return;
    setLoading(true);
    try {
      const records = await MastersApi.list(typeConfig.key);
      setData(records);
      
      const parentField = typeConfig.fields.find(f => f.type === 'select' && f.parent);
      if (parentField) {
        const pData = await MastersApi.list(parentField.parent);
        setParentData(pData);
      } else {
        setParentData([]);
      }
    } catch (e) {
      notify('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (await confirmDialog(`Are you sure you want to delete this ${typeConfig.name.replace(/s$/, '').toLowerCase()}?`)) {
      try {
        await MastersApi.delete(typeConfig.key, id);
        notify('Record deleted successfully');
        loadData();
      } catch (e) {
        notify('Failed to delete record', 'error');
      }
    }
  };

  // Reset tab and data when the page changes
  useEffect(() => {
    setActiveTabIdx(0);
  }, [active]);

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeConfig?.key]);

  if (!config) {
    return <div className="content-pad">Invalid Masters configuration for {active}</div>;
  }

  const getParentName = (id) => {
    if (!id || !parentData.length) return '—';
    return parentData.find(p => p.id === id)?.name || `#${id}`;
  };

  return (
    <div className="content-pad">
      <div className="admin-head">
        <div>
          <div className="page-title">{active.replace('Masters-', '')}</div>
          <div className="page-sub">Manage system master records for {typeConfig.name.toLowerCase()}</div>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            <IconPlus /> New {typeConfig.name.replace(/s$/, '')}
          </button>
        )}
      </div>

      {config.tabs && (
        <div className="status-tabs" style={{ marginBottom: 20 }}>
          {config.types.map((t, i) => (
            <button key={t.key} className={`tab-btn ${activeTabIdx === i ? 'active' : ''}`} onClick={() => setActiveTabIdx(i)}>
              {t.name}
            </button>
          ))}
        </div>
      )}

      {loading ? <div className="loading-state">Loading…</div> : (
        <div className="table-card">
          <div className="urow urow-head">
            <div>Name</div>
            {typeConfig.fields.map(f => <div key={f.name}>{f.label}</div>)}
            <div>Status</div>
            <div></div>
          </div>
          {data.map((r) => (
            <div className="urow" key={r.id}>
              <div>{r.name}</div>
              {typeConfig.fields.map(f => {
                if (f.type === 'color') {
                  return (
                    <div key={f.name}>
                      <span style={{ display: 'inline-block', width: 16, height: 16, backgroundColor: r[f.name], borderRadius: 4, verticalAlign: 'middle', marginRight: 8 }}></span>
                      {r[f.name] || '—'}
                    </div>
                  );
                }
                if (f.type === 'select') {
                  return <div key={f.name} style={{ color: 'var(--text2)' }}>{getParentName(r[f.name])}</div>;
                }
                return <div key={f.name} style={{ color: 'var(--text2)' }}>{r[f.name]}</div>;
              })}
              <div>
                <span className={`company-pill ${r.is_active ? 'on' : 'off'}`}>
                  {r.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                {canEdit && (
                  <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setEditing(r)}>
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11, color: 'var(--red)' }} onClick={() => handleDelete(r.id)}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
          {data.length === 0 && <div className="empty-state">No records found.</div>}
        </div>
      )}

      {creating && (
        <MasterModal
          typeConfig={typeConfig}
          parentData={parentData}
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); loadData(); notify('Record created'); }}
        />
      )}
      {editing && (
        <MasterModal
          typeConfig={typeConfig}
          parentData={parentData}
          record={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); loadData(); notify('Record updated'); }}
        />
      )}

      {toast && <div className={`toast ${toast.t}`}>{toast.m}</div>}
    </div>
  );
}

function MasterModal({ typeConfig, parentData, record, onClose, onSaved }) {
  const editMode = !!record;
  const initialState = { name: record?.name || '', is_active: record ? record.is_active : true };
  typeConfig.fields.forEach(f => {
    initialState[f.name] = record?.[f.name] || (f.type === 'color' ? '#000000' : '');
  });

  const [form, setForm] = useState(initialState);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setErr('');
    if (!form.name.trim()) {
      setErr('Name is required'); return;
    }
    setBusy(true);
    try {
      const payload = { ...form };
      if (editMode) {
        await MastersApi.update(typeConfig.key, record.id, payload);
      } else {
        await MastersApi.create(typeConfig.key, payload);
      }
      onSaved();
    } catch (e) {
      // Extract validation errors from API response if any
      const messages = e.response?.data?.messages;
      if (messages && typeof messages === 'object') {
        setErr(Object.values(messages).join(', '));
      } else {
        setErr(apiError(e, 'Save failed'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ position: 'relative' }}>
        <DevFillButton onFill={() => {
          setForm(f => {
            const next = { ...f, name: 'Test ' + typeConfig.name.replace(/s$/, '') + ' ' + Math.floor(Math.random() * 100) };
            typeConfig.fields.forEach(field => {
              if (field.type === 'color') next[field.name] = '#' + Math.floor(Math.random()*16777215).toString(16);
              if (field.type === 'number') next[field.name] = Math.floor(Math.random() * 100);
              if (field.type === 'text') next[field.name] = 'Test ' + field.label;
              if (field.type === 'select' && parentData.length > 0) next[field.name] = parentData[0].id;
            });
            return next;
          });
        }} />
        <div className="modal-header">
          <div className="modal-title">{editMode ? `Edit · ${record.name}` : `New ${typeConfig.name.replace(/s$/, '')}`}</div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {err && <div className="login-error">{err}</div>}
          <div className="form-group">
            <label>Name *</label>
            <input className="form-input" value={form.name} onChange={set('name')} />
          </div>
          
          {typeConfig.fields.map(f => (
            <div className="form-group" key={f.name}>
              <label>{f.label} {f.type === 'select' && '*'}</label>
              {f.type === 'select' ? (
                <select className="form-select" value={form[f.name]} onChange={set(f.name)}>
                  <option value="">Select {f.label}</option>
                  {parentData.filter(p => p.is_active).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              ) : f.type === 'color' ? (
                <input className="form-input" type="color" style={{ padding: 4, height: 40 }} value={form[f.name]} onChange={set(f.name)} />
              ) : (
                <input className="form-input" type={f.type} value={form[f.name]} onChange={set(f.name)} />
              )}
            </div>
          ))}

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
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy} onClick={submit}>
            {busy ? 'Saving…' : editMode ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
