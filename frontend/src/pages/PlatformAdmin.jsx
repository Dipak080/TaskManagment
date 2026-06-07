import { useEffect, useState } from 'react';
import { AdminApi } from '../api/auth';
import { useAuth } from '../auth/AuthContext';
import { IconLogo, IconPlus } from '../components/Icons';
import { apiError } from '../utils/apiError';
import DevFillButton from '../components/DevFillButton';

export default function PlatformAdmin() {
  const { user, logout } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [showCompany, setShowCompany] = useState(false);
  const [adminFor, setAdminFor] = useState(null); // company object to add admin user to
  const [viewing, setViewing] = useState(null);    // company detail

  const notify = (m, t = 'success') => { setToast({ m, t }); setTimeout(() => setToast(null), 2600); };

  const load = () => {
    setLoading(true);
    AdminApi.companies().then(setCompanies).catch(() => notify('Failed to load companies', 'error')).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const toggleActive = async (c) => {
    try {
      await AdminApi.updateCompany(c.id, { is_active: c.is_active === '1' || c.is_active === 1 ? 0 : 1 });
      load();
    } catch { notify('Update failed', 'error'); }
  };

  const openCompany = async (c) => {
    try { setViewing(await AdminApi.company(c.id)); } catch { notify('Failed to load company', 'error'); }
  };

  return (
    <div className="admin-shell">
      <div className="admin-top">
        <div className="brand-icon"><IconLogo /></div>
        <div>
          <div className="brand-name">TaskOps</div>
          <div className="brand-sub">PLATFORM CONSOLE</div>
        </div>
        <span className="admin-badge">Platform Admin</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>{user?.name} · {user?.email}</span>
          <button className="icon-btn" onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="admin-body">
        <div className="admin-head">
          <div>
            <div className="page-title">Companies</div>
            <div className="page-sub">{companies.length} tenant{companies.length === 1 ? '' : 's'} · manage organizations and their admins</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCompany(true)}><IconPlus /> New Company</button>
        </div>

        {loading ? (
          <div className="loading-state">Loading companies…</div>
        ) : (
          <div className="admin-grid">
            {companies.map((c) => {
              const active = c.is_active === '1' || c.is_active === 1;
              return (
                <div className="company-card" key={c.id}>
                  <div className="cc-top">
                    <div>
                      <div className="company-name">{c.name}</div>
                      <div className="company-meta">{c.contact || 'no contact'} · {c.user_count} user{c.user_count === '1' ? '' : 's'}</div>
                    </div>
                    <span className={`company-pill ${active ? 'on' : 'off'}`}>{active ? '● Active' : '○ Inactive'}</span>
                  </div>
                  <div className="company-actions">
                    <button className="btn btn-ghost" onClick={() => openCompany(c)}>View</button>
                    <button className="btn btn-ghost" onClick={() => setAdminFor(c)}>+ Admin user</button>
                    <button className="btn btn-ghost" onClick={() => toggleActive(c)}>{active ? 'Deactivate' : 'Activate'}</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCompany && (
        <CompanyModal
          onClose={() => setShowCompany(false)}
          onSaved={() => { setShowCompany(false); load(); notify('Company created'); }}
        />
      )}

      {adminFor && (
        <AdminUserModal
          company={adminFor}
          onClose={() => setAdminFor(null)}
          onSaved={() => { setAdminFor(null); load(); notify('Admin user created'); }}
        />
      )}

      {viewing && <CompanyDetail company={viewing} onClose={() => setViewing(null)} />}

      {toast && <div className={`toast ${toast.t}`}>{toast.m}</div>}
    </div>
  );
}

function CompanyModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', contact: '', logo_url: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.name.trim()) { setErr('Company name is required'); return; }
    setBusy(true); setErr('');
    try { await AdminApi.createCompany(form); onSaved(); }
    catch (e) { setErr(apiError(e, 'Failed to create company')); }
    finally { setBusy(false); }
  };

  return (
    <div className="modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ position: 'relative' }}>
        <DevFillButton onFill={() => setForm({ name: 'Test Company ' + Math.floor(Math.random() * 100), contact: 'test@example.com', logo_url: '' })} />
        <div className="modal-header"><div className="modal-title">New Company</div><button className="close-btn" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          {err && <div className="login-error">{err}</div>}
          <div className="form-group"><label>Company Name *</label><input className="form-input" value={form.name} onChange={set('name')} placeholder="Acme Corp" /></div>
          <div className="form-group"><label>Contact</label><input className="form-input" value={form.contact} onChange={set('contact')} placeholder="email or phone" /></div>
          <div className="form-group"><label>Logo URL</label><input className="form-input" value={form.logo_url} onChange={set('logo_url')} placeholder="https://…" /></div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy} onClick={submit}>{busy ? 'Creating…' : 'Create Company →'}</button>
        </div>
      </div>
    </div>
  );
}

function AdminUserModal({ company, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim() || form.password.length < 6) {
      setErr('Name, email and a password of at least 6 characters are required'); return;
    }
    setBusy(true); setErr('');
    try { await AdminApi.createAdminUser(company.id, form); onSaved(); }
    catch (e) { setErr(apiError(e, 'Failed to create user')); }
    finally { setBusy(false); }
  };

  return (
    <div className="modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ position: 'relative' }}>
        <DevFillButton onFill={() => setForm({ name: 'Admin User ' + Math.floor(Math.random() * 100), email: 'admin' + Math.floor(Math.random() * 100) + '@example.com', phone: '9999999999', password: 'password123' })} />
        <div className="modal-header"><div className="modal-title">First Admin User · {company.name}</div><button className="close-btn" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          {err && <div className="login-error">{err}</div>}
          <div className="form-group"><label>Full Name *</label><input className="form-input" value={form.name} onChange={set('name')} /></div>
          <div className="form-row">
            <div className="form-group"><label>Email *</label><input className="form-input" type="email" value={form.email} onChange={set('email')} /></div>
            <div className="form-group"><label>Phone</label><input className="form-input" value={form.phone} onChange={set('phone')} /></div>
          </div>
          <div className="form-group"><label>Temporary Password *</label><input className="form-input" type="text" value={form.password} onChange={set('password')} placeholder="min 6 characters" /></div>
          <div className="login-hint">Role assignment comes later — this user is created without a role for now.</div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy} onClick={submit}>{busy ? 'Creating…' : 'Create User →'}</button>
        </div>
      </div>
    </div>
  );
}

function CompanyDetail({ company, onClose }) {
  return (
    <div className="modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><div className="modal-title">{company.name}</div><button className="close-btn" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="company-meta">{company.contact || 'no contact'}</div>
          <div className="admin-section-title">Users ({company.users?.length || 0})</div>
          {(company.users || []).length === 0 && <div className="login-hint" style={{ textAlign: 'left' }}>No users yet. Use “+ Admin user” to create the first one.</div>}
          {(company.users || []).map((u) => (
            <div className="user-line" key={u.id}>
              <span>{u.name} <span style={{ color: 'var(--text2)' }}>· {u.email}</span></span>
              <span className={`company-pill ${u.is_active === '1' || u.is_active === 1 ? 'on' : 'off'}`}>
                {u.role_id ? `role #${u.role_id}` : 'no role'}
              </span>
            </div>
          ))}
        </div>
        <div className="modal-footer"><button className="btn btn-ghost" onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
}
