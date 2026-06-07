import { useEffect, useState, useRef } from 'react';
import client from '../api/client';
import { IconBell } from './Icons';
import { formatDateTime } from '../utils/format';

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);

  const load = async () => {
    try {
      const { data } = await client.get('/notifications');
      setNotifications(data || []);
      // is_read comes back from MySQL as a string ("0"/"1"); coerce before testing.
      setUnreadCount((data || []).filter(n => !Number(n.is_read)).length);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000); // Poll every 30s
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const clickOut = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', clickOut);
    return () => document.removeEventListener('mousedown', clickOut);
  }, []);

  const markAllRead = async () => {
    try {
      await client.post('/notifications/read-all');
      setNotifications(n => n.map(x => ({ ...x, is_read: 1 })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const markRead = async (id) => {
    try {
      await client.post(`/notifications/${id}/read`);
      setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: 1 } : x));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch { /* ignore */ }
  };

  return (
    <div className="notif-container" ref={ref} style={{ position: 'relative' }}>
      <button 
        className="icon-btn" 
        style={{ position: 'relative' }} 
        onClick={() => setOpen(!open)}
      >
        <IconBell />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2, 
            background: 'var(--red)', color: 'white', 
            fontSize: 10, fontWeight: 'bold', 
            padding: '2px 5px', borderRadius: 10, lineHeight: 1
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 8,
          width: 320, background: 'var(--navy2)', borderRadius: 8,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)', zIndex: 100,
          border: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
          maxHeight: 400
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>Notifications</span>
            {unreadCount > 0 && (
              <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 12 }} onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>
          
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>
                No notifications yet.
              </div>
            ) : (
              notifications.map(n => {
                const read = !!Number(n.is_read);
                return (
                <div
                  key={n.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    background: read ? 'transparent' : 'var(--navy3)',
                    cursor: read ? 'default' : 'pointer'
                  }}
                  onClick={() => { if (!read) markRead(n.id); }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, color: read ? 'var(--text)' : 'var(--blue)', marginBottom: 4 }}>
                    {n.title || 'Notification'}
                  </div>
                  {n.message && <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>{n.message}</div>}
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>{formatDateTime(n.created_at)}</div>
                </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
