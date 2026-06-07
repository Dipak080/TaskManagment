import { useState } from 'react';
import { TasksApi } from '../api/tasks';
import { notify } from '../utils/toast';
import { apiError } from '../utils/apiError';
import { confirmDialog } from '../utils/confirm';

export default function Checklist({ task, checklists, setChecklists, canEdit }) {
  const [newItem, setNewItem] = useState('');
  const [adding, setAdding] = useState(false);

  const completedCount = checklists.filter(c => Number(c.is_completed) === 1).length;
  const totalCount = checklists.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newItem.trim() || !canEdit || adding) return;
    setAdding(true);
    try {
      const added = await TasksApi.addChecklist(task.id, { title: newItem });
      setChecklists([...checklists, added]);
      setNewItem('');
    } catch (e) {
      notify(apiError(e, 'Failed to add item'));
    } finally {
      setAdding(false);
    }
  };

  const toggleComplete = async (item) => {
    if (!canEdit) return;
    const nextState = Number(item.is_completed) === 1 ? 0 : 1;
    // Optimistic UI update
    setChecklists(checklists.map(c => c.id === item.id ? { ...c, is_completed: nextState } : c));
    try {
      await TasksApi.updateChecklist(task.id, item.id, { is_completed: nextState });
    } catch (e) {
      notify(apiError(e, 'Failed to update item'));
      // Revert on fail
      setChecklists(checklists.map(c => c.id === item.id ? { ...c, is_completed: item.is_completed } : c));
    }
  };

  const deleteItem = async (id) => {
    if (!canEdit) return;
    if (!(await confirmDialog('Delete this item?'))) return;
    try {
      await TasksApi.deleteChecklist(task.id, id);
      setChecklists(checklists.filter(c => c.id !== id));
    } catch (e) {
      notify(apiError(e, 'Failed to delete item'));
    }
  };

  return (
    <div className="detail-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <label style={{ margin: 0 }}>Sub-Tasks / Checklist</label>
        {totalCount > 0 && (
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text2)' }}>
            {completedCount} / {totalCount} ({progress}%)
          </span>
        )}
      </div>

      {totalCount > 0 && (
        <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: '3px', marginBottom: '12px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: progress === 100 ? 'var(--green)' : 'var(--blue)', width: `${progress}%`, transition: 'width 0.3s ease' }} />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {checklists.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '4px', background: 'var(--bg-body)' }}>
            <input 
              type="checkbox" 
              checked={Number(c.is_completed) === 1} 
              onChange={() => toggleComplete(c)} 
              disabled={!canEdit}
              style={{ width: '16px', height: '16px', cursor: canEdit ? 'pointer' : 'default' }}
            />
            <span style={{ flex: 1, fontSize: '13px', textDecoration: Number(c.is_completed) === 1 ? 'line-through' : 'none', color: Number(c.is_completed) === 1 ? 'var(--text3)' : 'var(--text1)' }}>
              {c.title}
            </span>
            {canEdit && (
              <button className="btn btn-ghost" style={{ padding: '2px 6px', color: 'var(--red)', fontSize: '12px', minWidth: 0, minHeight: 0 }} onClick={() => deleteItem(c.id)}>✕</button>
            )}
          </div>
        ))}
      </div>

      {canEdit && (
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', marginTop: checklists.length > 0 ? '8px' : '0' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Add an item..." 
            value={newItem} 
            onChange={e => setNewItem(e.target.value)}
            disabled={adding}
            style={{ padding: '6px 8px', fontSize: '13px' }}
          />
          <button type="submit" className="btn btn-primary" disabled={!newItem.trim() || adding} style={{ padding: '6px 12px', fontSize: '13px' }}>Add</button>
        </form>
      )}
    </div>
  );
}
