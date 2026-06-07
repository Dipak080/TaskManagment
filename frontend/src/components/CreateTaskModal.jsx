import { useState, useRef } from 'react';
import DevFillButton from './DevFillButton';
import RichTextEditor from './RichTextEditor';

const EMPTY = {
  title: '', detail: '', priority_id: '', category_id: '',
  assign_type: 'user', assigned_to_user: '', assigned_to_department: '', due_date: '',
  log_viewers: []
};

export default function CreateTaskModal({ open, onClose, onCreate, departments, users, priorities, categories }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  
  const isUserValid = form.assign_type === 'user' ? !!form.assigned_to_user : true;
  const isDeptValid = form.assign_type === 'department' ? !!form.assigned_to_department : true;
  const valid = form.title.trim() && form.detail.trim() && isUserValid && isDeptValid;

  const toggleViewer = (id) => {
    setForm(f => ({
      ...f,
      log_viewers: f.log_viewers.includes(id) 
        ? f.log_viewers.filter(v => v !== id)
        : [...f.log_viewers, id]
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      let payload;
      if (files.length > 0) {
        payload = new FormData();
        payload.append('title', form.title);
        payload.append('detail', form.detail);
        if (form.priority_id) payload.append('priority_id', form.priority_id);
        if (form.category_id) payload.append('category_id', form.category_id);
        if (form.assign_type === 'user' && form.assigned_to_user) payload.append('assigned_to_user', form.assigned_to_user);
        if (form.assign_type === 'department' && form.assigned_to_department) payload.append('assigned_to_department', form.assigned_to_department);
        if (form.due_date) payload.append('due_date', form.due_date);
        form.log_viewers.forEach(v => payload.append('log_viewers[]', v));
        
        files.forEach(f => payload.append('attachments[]', f));
      } else {
        payload = {
          title: form.title,
          detail: form.detail,
          priority_id: form.priority_id || null,
          category_id: form.category_id || null,
          assigned_to_user: form.assign_type === 'user' ? form.assigned_to_user : null,
          assigned_to_department: form.assign_type === 'department' ? form.assigned_to_department : null,
          log_viewers: form.log_viewers,
          due_date: form.due_date || null
        };
      }
      await onCreate(payload);
      setForm(EMPTY);
      setFiles([]);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop show" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ position: 'relative' }}>
        <DevFillButton onFill={() => {
          setForm(f => ({
            ...f,
            title: 'Test Task ' + Math.floor(Math.random() * 1000),
            detail: 'This is an auto-filled test task generated in development mode.',
            priority_id: priorities[0]?.id || '',
            category_id: categories[0]?.id || '',
            assign_type: 'user',
            assigned_to_user: users[0]?.id || '',
          }));
        }} />
        <div className="modal-header">
          <div className="modal-title">Create New Task</div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Task Title *</label>
            <input className="form-input" placeholder="Brief, clear description of what needs to be done" value={form.title} onChange={set('title')} />
          </div>
          <div className="form-group">
            <label>Detail *</label>
            <RichTextEditor value={form.detail} onChange={(val) => setForm(f => ({ ...f, detail: val }))} />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Assign To Type</label>
              <div style={{ display: 'flex', gap: '15px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'normal' }}>
                  <input type="radio" name="assign_type" value="user" checked={form.assign_type === 'user'} onChange={set('assign_type')} />
                  User
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'normal' }}>
                  <input type="radio" name="assign_type" value="department" checked={form.assign_type === 'department'} onChange={set('assign_type')} />
                  Department
                </label>
              </div>
            </div>
            <div className="form-group">
              <label>{form.assign_type === 'user' ? 'Assign To User *' : 'Assign To Department *'}</label>
              {form.assign_type === 'user' ? (
                <select className="form-select" value={form.assigned_to_user} onChange={set('assigned_to_user')}>
                  <option value="">Select person</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              ) : (
                <select className="form-select" value={form.assigned_to_department} onChange={set('assigned_to_department')}>
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select className="form-select" value={form.priority_id} onChange={set('priority_id')}>
                <option value="">Select priority</option>
                {priorities.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Category</label>
              <select className="form-select" value={form.category_id} onChange={set('category_id')}>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Due Date (optional)</label>
            <input type="date" className="form-input" value={form.due_date} onChange={set('due_date')} />
          </div>
          <div className="form-group">
            <label>Who Can View Logs (Multiple Selection)</label>
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '6px', 
              maxHeight: '150px', overflowY: 'auto', 
              padding: '8px', border: '1px solid var(--border)', 
              borderRadius: '6px', background: 'var(--bg-body)'
            }}>
              {users.map((u) => (
                <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'normal', cursor: 'pointer', fontSize: '13px' }}>
                  <input 
                    type="checkbox" 
                    checked={form.log_viewers.includes(u.id.toString()) || form.log_viewers.includes(u.id)} 
                    onChange={() => toggleViewer(u.id.toString())} 
                  />
                  {u.name}
                </label>
              ))}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>
              Select all users who should have access to this task's activity log. The creator and assignee always have access.
            </div>
          </div>
          
          <div className="form-group">
            <label>Attachments</label>
            <div 
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragActive ? 'var(--blue)' : 'var(--border)'}`,
                borderRadius: '8px', padding: '20px', textAlign: 'center',
                background: dragActive ? 'var(--blue-dim)' : 'var(--bg-card)',
                transition: 'all 0.2s', cursor: 'pointer'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input type="file" multiple ref={fileInputRef} onChange={handleChange} style={{ display: 'none' }} />
              <div style={{ fontSize: '14px', color: 'var(--text1)' }}>
                Drag and drop files here or <span style={{ color: 'var(--blue)', fontWeight: 600 }}>Browse</span>
              </div>
            </div>
            
            {files.length > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {files.map((file, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-body)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <span style={{ fontSize: 16 }}>📎</span>
                      <span style={{ fontSize: 13, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{file.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>({Math.round(file.size/1024)} KB)</span>
                    </div>
                    <button className="btn btn-ghost" style={{ padding: '4px', color: 'var(--red)', minWidth: 'auto', minHeight: 'auto' }} onClick={() => removeFile(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!valid || saving} onClick={submit}>
            {saving ? 'Creating…' : 'Create Task →'}
          </button>
        </div>
      </div>
    </div>
  );
}
