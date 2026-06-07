import { useState, useEffect, useRef } from 'react';
import { dueInfo, formatDateTime } from '../utils/format';
import { IconPlus, IconClock, IconComment } from './Icons';
import client, { TOKEN_KEY } from '../api/client';
import { TasksApi } from '../api/tasks';
import RichTextEditor from './RichTextEditor';
import Checklist from './Checklist';
import { notify } from '../utils/toast';
import { apiError } from '../utils/apiError';
import { confirmDialog } from '../utils/confirm';

export default function DetailPanel({ task, now, activity, statuses = [], canEdit = true, canClose = true, canDelete = false, onClose, onTransition, onTransfer, onSetStatus, onAddComment, onDelete, myId, users = [], departments = [] }) {
  const [comment, setComment] = useState('');
  const [promptAction, setPromptAction] = useState(null); // null, 'close', 'reject', 'rollback', 'transfer'
  const [promptText, setPromptText] = useState('');
  const [transferAssignType, setTransferAssignType] = useState('user');
  const [transferTarget, setTransferTarget] = useState('');
  const [checklists, setChecklists] = useState([]);
  const [pendingStatus, setPendingStatus] = useState(null); // status awaiting a reason before applying
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const open = Boolean(task);

  // Sync checklists/attachments when task changes
  useEffect(() => {
    setChecklists(task?.checklists || []);
    setAttachments(task?.attachments || []);
    setPendingStatus(null);
  }, [task]);

  const submitComment = async () => {
    const text = comment.trim();
    if (!text) return;
    await onAddComment(text);
    setComment('');
  };

  const handleActionClick = (action) => {
    if (['close', 'reject', 'rollback', 'transfer'].includes(action)) {
      setPromptAction(action);
      setPromptText('');
      setTransferAssignType('user');
      setTransferTarget('');
    } else {
      onTransition(action);
    }
  };

  // Direct status change from the dropdown. Closing statuses (Closed/Rejected)
  // require a reason, so we stage them in `pendingStatus` and prompt first.
  const handleStatusSelect = (statusId) => {
    const st = statuses.find((s) => String(s.id) === String(statusId));
    if (!st || String(st.id) === String(task?.status_id)) return;
    const needsReason = ['closed', 'rejected'].includes(st.name?.toLowerCase());
    if (needsReason) {
      setPendingStatus(st);
      setPromptText('');
    } else {
      onSetStatus?.(st.id, '');
    }
  };

  const submitPendingStatus = () => {
    if (!pendingStatus || !promptText.trim()) return;
    onSetStatus?.(pendingStatus.id, promptText.trim());
    setPendingStatus(null);
    setPromptText('');
  };

  const submitPrompt = () => {
    if (promptAction === 'transfer') {
      if (!transferTarget) return;
      onTransfer(transferAssignType, transferTarget, promptText.trim());
      setPromptAction(null);
      return;
    }

    if (!promptText.trim()) return;
    const isComment = promptAction === 'rollback';
    onTransition(promptAction, isComment ? '' : promptText, isComment ? promptText : '');
    setPromptAction(null);
  };

  const downloadAttachment = async (att) => {
    try {
      const res = await client.get(`/attachments/${att.id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', att.file_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      notify('Failed to download attachment');
    }
  };

  const handleUploadAttachments = async (fileList) => {
    if (!task || !fileList || fileList.length === 0) return;
    setUploading(true);
    try {
      const updated = await TasksApi.addAttachments(task.id, fileList);
      setAttachments(updated);
      notify('Attachment uploaded');
    } catch (e) {
      notify(apiError(e, 'Failed to upload attachment'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (att) => {
    if (!task) return;
    if (!(await confirmDialog(`Remove "${att.file_name}"?`))) return;
    try {
      const updated = await TasksApi.deleteAttachment(task.id, att.id);
      setAttachments(updated);
      notify('Attachment removed');
    } catch (e) {
      notify(apiError(e, 'Failed to remove attachment'));
    }
  };

  const handleDelete = async () => {
    if (await confirmDialog("Are you sure you want to delete this task?")) {
      onDelete(task.id);
    }
  };

  const assigneeName = task?.assignee_user_name || task?.assignee_dept_name || 'Unassigned';
  
  const isAssignee = task?.assigned_to_user === myId;
  const isCreator = task?.created_by === myId;
  const allowEdit = isAssignee || canEdit;
  const allowClose = isCreator || canClose;

  const statusLower = task?.status_name?.toLowerCase() || '';
  const isClosed = statusLower === 'closed' || statusLower === 'rejected';

  const viewerIds = task?.log_viewers ? JSON.parse(task.log_viewers) : [];
  const viewerNames = viewerIds.map(id => users.find(u => Number(u.id) === Number(id))?.name).filter(Boolean).join(', ') || 'None';

  return (
    <div className={`detail-panel ${open ? 'open' : ''}`}>
      <div className="detail-header">
        <div>
          <div className="detail-title">{task?.title || 'Task Title'}</div>
          <div className="detail-id">Created by {task?.created_by_name || 'Admin'}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {canDelete && (
            <button className="btn btn-danger" style={{ padding: '0 12px', fontSize: 11, borderRadius: 5, height: 26 }} onClick={handleDelete}>Delete</button>
          )}
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
      </div>

      <div className="detail-body">
        <div className="detail-section">
          <label>Detail</label>
          {task?.detail ? (
            <div className="rich-text-content" style={{ padding: '8px', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-light)' }} dangerouslySetInnerHTML={{ __html: task.detail }} />
          ) : (
            <p>—</p>
          )}
        </div>

        {task && <Checklist task={task} checklists={checklists} setChecklists={setChecklists} canEdit={allowEdit || isCreator} />}

        <div className="detail-grid">
          <Field label="Category" value={task?.category_name} />
          <Field label="Assigned To" value={assigneeName} />
          <Field label="Due Date" value={task ? dueInfo(task.due_date, now).text : '—'} />
          <Field label="Days Open" value={task?.days_open != null ? `${task.days_open}d` : '—'} />
          <Field label="Log Viewers" value={viewerNames} />
          <div className="detail-field">
            <label>Status</label>
            <span>
              {task && (allowEdit || allowClose) && statuses.length > 0 ? (
                <select
                  className="form-select"
                  value={task.status_id || ''}
                  onChange={(e) => handleStatusSelect(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    fontSize: 12,
                    borderRadius: 5,
                    borderColor: task.status_color ? `${task.status_color}55` : 'var(--border)',
                    color: task.status_color || 'inherit',
                    fontWeight: 600,
                  }}
                >
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              ) : task && (
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
              )}
            </span>
          </div>
          <div className="detail-field">
            <label>Priority</label>
            <span style={{ color: task?.priority_color || 'inherit', fontWeight: 500 }}>
              {task?.priority_name || '—'}
            </span>
          </div>
        </div>

        {task && (attachments.length > 0 || allowEdit) && (
          <div className="detail-section">
            <label>Attachments</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {attachments.map(att => (
                <div key={att.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-body)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <span style={{ fontSize: 16 }}>📎</span>
                    <span style={{ fontSize: 13, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{att.file_name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>({Math.round(att.file_size/1024)} KB)</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button className="btn btn-ghost" style={{ padding: '4px 8px', color: 'var(--blue)', minWidth: 'auto', minHeight: 'auto', fontSize: '12px' }} onClick={() => downloadAttachment(att)}>Download</button>
                    {allowEdit && (
                      <button className="btn btn-ghost" style={{ padding: '4px 8px', color: 'var(--red)', minWidth: 'auto', minHeight: 'auto', fontSize: '12px' }} onClick={() => handleDeleteAttachment(att)} title="Remove">✕</button>
                    )}
                  </div>
                </div>
              ))}
              {attachments.length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>No attachments yet.</div>
              )}
            </div>
            {allowEdit && (
              <>
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => handleUploadAttachments(e.target.files)}
                />
                <button
                  className="btn btn-ghost"
                  style={{ marginTop: 8, border: '1px dashed var(--border)', width: '100%', fontSize: 12, color: 'var(--blue)' }}
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? 'Uploading…' : '+ Add Attachment'}
                </button>
              </>
            )}
          </div>
        )}

        {task?.closed_reason && (
          <div className="detail-section" style={{ backgroundColor: 'var(--red-dim)', padding: 10, borderRadius: 6 }}>
            <label style={{ color: 'var(--red)' }}>Closing Note / Reason</label>
            <p style={{ margin: 0, marginTop: 4 }}>{task.closed_reason}</p>
          </div>
        )}

        <div className="detail-section">
          <label>Activity Log</label>
          <div className="timeline">
            {(activity && activity.length ? activity : defaultActivity(task)).map((a, i) => (
              <div className="tl-item" key={i}>
                <div
                  className="tl-dot"
                  style={i === 0 ? { background: 'var(--amber-dim)', borderColor: 'var(--amber)' } : undefined}
                >
                  {i === 0 ? <span style={{ color: 'var(--amber)' }}><IconPlus /></span>
                    : a.type === 'comment' ? <span style={{ color: 'var(--text2)' }}><IconComment /></span>
                      : <span style={{ color: 'var(--text2)' }}><IconClock /></span>}
                </div>
                <div className="tl-content">
                  <div className="tl-action">
                    {a.type === 'comment' ? (
                      <div className="rich-text-content" style={{ fontSize: '13px', padding: '8px', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-light)', marginTop: '4px' }} dangerouslySetInnerHTML={{ __html: a.action }} />
                    ) : (
                      a.action
                    )}
                  </div>
                  <div className="tl-meta">{a.actor} · {formatDateTime(a.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!isClosed && (
        <div className="detail-section">
          <label>Add Comment</label>
          <div className="comment-box" style={{ padding: 0, border: 'none' }}>
            <RichTextEditor value={comment} onChange={setComment} placeholder="Write an update or note..." />
            <div className="comment-actions" style={{ marginTop: '8px', padding: '0', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 11 }} onClick={() => setComment('')}>Cancel</button>
              <button className="btn btn-primary" style={{ padding: '5px 10px', fontSize: 11 }} onClick={submitComment}>Post</button>
            </div>
          </div>
        </div>
        )}
      </div>

      {!isClosed && !promptAction && !pendingStatus && allowEdit && (
        <div className="detail-footer" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" style={{ flex: 1, border: '1px solid var(--border)' }} onClick={() => handleActionClick('transfer')}>Forward</button>
        </div>
      )}

      {pendingStatus && (
        <div className="detail-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text1)' }}>
            Reason for setting status to "{pendingStatus.name}" *
          </label>
          <textarea
            className="form-textarea"
            autoFocus
            rows={2}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Type your reason here..."
            style={{ marginBottom: 4 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setPendingStatus(null); setPromptText(''); }}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 1 }} disabled={!promptText.trim()} onClick={submitPendingStatus}>Confirm</button>
          </div>
        </div>
      )}

      {promptAction && (
        <div className="detail-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {promptAction === 'transfer' ? (
            <>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text1)' }}>Forward To *</label>
              <div style={{ display: 'flex', gap: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: 12 }}>
                  <input type="radio" checked={transferAssignType === 'user'} onChange={() => setTransferAssignType('user')} /> User
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: 12 }}>
                  <input type="radio" checked={transferAssignType === 'department'} onChange={() => setTransferAssignType('department')} /> Department
                </label>
              </div>
              <select className="form-select" value={transferTarget} onChange={(e) => setTransferTarget(e.target.value)} style={{ marginBottom: 4 }}>
                <option value="">Select {transferAssignType === 'user' ? 'person' : 'department'}</option>
                {transferAssignType === 'user' ? (
                  users.filter(u => u.id != myId && u.id != task?.assigned_to_user).length > 0
                    ? users.filter(u => u.id != myId && u.id != task?.assigned_to_user).map(u => <option key={u.id} value={u.id}>{u.name}</option>)
                    : <option disabled value="none">No other users available</option>
                ) : (
                  departments.filter(d => d.id != task?.assigned_to_department).length > 0
                    ? departments.filter(d => d.id != task?.assigned_to_department).map(d => <option key={d.id} value={d.id}>{d.name}</option>)
                    : <option disabled value="none">No other departments available</option>
                )}
              </select>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text1)', marginTop: 4 }}>Reason / Comment *</label>
              <textarea 
                className="form-textarea" 
                rows={2}
                value={promptText} 
                onChange={(e) => setPromptText(e.target.value)} 
                placeholder="Why is this being forwarded?"
                style={{ marginBottom: 4 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setPromptAction(null)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} disabled={!transferTarget || !promptText.trim()} onClick={submitPrompt}>Forward Task</button>
              </div>
            </>
          ) : (
            <>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text1)' }}>
                {promptAction === 'rollback' ? 'Reason for Rollback (Comment) *' : 'Closing Reason *'}
              </label>
              <textarea 
                className="form-textarea" 
                autoFocus
                rows={2}
                value={promptText} 
                onChange={(e) => setPromptText(e.target.value)} 
                placeholder="Type your reason here..."
                style={{ marginBottom: 4 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setPromptAction(null)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} disabled={!promptText.trim()} onClick={submitPrompt}>Confirm</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const Field = ({ label, value }) => (
  <div className="detail-field"><label>{label}</label><span>{value || '—'}</span></div>
);

function defaultActivity(task) {
  if (!task) return [];
  return [
    { action: 'Task created & assigned', actor: task.created_by_name || 'Admin', created_at: task.created_at, type: 'create' },
  ];
}
