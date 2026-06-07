import { useState } from 'react';
import { useSettings } from '../SettingsContext';
import client, { assetUrl } from '../api/client';
import { CompanyApi } from '../api/auth';
import { useAuth } from '../auth/AuthContext';
import { apiError } from '../utils/apiError';

export default function Settings() {
  const { theme, setTheme, layout, setLayout } = useSettings();
  const { can } = useAuth();
  const canManageCompany = can('User Management', 'edit');
  const [tab, setTab] = useState('appearance');

  const [pwState, setPwState] = useState({ current: '', newPw: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (pwState.newPw !== pwState.confirm) {
      return setPwError('New passwords do not match');
    }
    if (pwState.newPw.length < 6) {
      return setPwError('New password must be at least 6 characters');
    }

    try {
      await client.put('/auth/change-password', {
        current_password: pwState.current,
        new_password: pwState.newPw
      });
      setPwSuccess('Password changed successfully.');
      setPwState({ current: '', newPw: '', confirm: '' });
    } catch (err) {
      setPwError(apiError(err, 'Failed to change password'));
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <div className="page-sub">Manage your application preferences and account security.</div>
        </div>
      </div>

      <div className="filters" style={{ marginTop: 16 }}>
        <div className="filter-tabs">
          <button className={`filter-tab ${tab === 'appearance' ? 'active' : ''}`} onClick={() => setTab('appearance')}>Appearance</button>
          <button className={`filter-tab ${tab === 'account' ? 'active' : ''}`} onClick={() => setTab('account')}>Account</button>
          <button className={`filter-tab ${tab === 'system' ? 'active' : ''}`} onClick={() => setTab('system')}>System Configuration</button>
        </div>
      </div>

      <div className="task-area" style={{ overflowY: 'auto' }}>
        <div style={{ maxWidth: 600 }}>
          {tab === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: '10px 0' }}>
              
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 4 }}>Dashboard Layout</label>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8 }}>Choose the sidebar and navigation style for your dashboard</div>
                
                <div className="layout-grid">
                  
                  {/* Icon Sidebar */}
                  <div className={`layout-card ${layout === 'icon' ? 'active' : ''}`} onClick={() => setLayout('icon')}>
                    <div className="layout-mockup">
                      <div className="mockup-app">
                        <div className="mockup-sidebar" style={{ width: '15%', alignItems: 'center' }}>
                          <div className="mockup-item brand" style={{ width: '12px', height: '12px', borderRadius: '50%' }}></div>
                          <div className="mockup-item" style={{ width: '12px', height: '12px', borderRadius: '50%', marginTop: 8 }}></div>
                          <div className="mockup-item" style={{ width: '12px', height: '12px', borderRadius: '50%' }}></div>
                          <div className="mockup-item" style={{ width: '12px', height: '12px', borderRadius: '50%' }}></div>
                        </div>
                        <div className="mockup-main">
                          <div className="mockup-topbar"><div className="mockup-item" style={{ width: 24 }}></div></div>
                          <div className="mockup-content">
                            <div className="mockup-panel"></div>
                            <div className="mockup-panel"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="layout-meta">
                      <div>
                        <div className="layout-title">Icon Sidebar</div>
                        <div className="layout-desc">Compact dark icon-only sidebar</div>
                      </div>
                      {layout === 'icon' && <div className="layout-check">✓</div>}
                    </div>
                  </div>

                  {/* Full Sidebar */}
                  <div className={`layout-card ${layout === 'full' ? 'active' : ''}`} onClick={() => setLayout('full')}>
                    <div className="layout-mockup">
                      <div className="mockup-app">
                        <div className="mockup-sidebar" style={{ width: '30%' }}>
                          <div className="mockup-item brand" style={{ marginBottom: 8, height: 12 }}></div>
                          <div className="mockup-item" style={{ width: '80%' }}></div>
                          <div className="mockup-item" style={{ width: '70%' }}></div>
                          <div className="mockup-item" style={{ width: '90%' }}></div>
                          <div className="mockup-item" style={{ width: '60%' }}></div>
                        </div>
                        <div className="mockup-main">
                          <div className="mockup-topbar"><div className="mockup-item" style={{ width: 24 }}></div></div>
                          <div className="mockup-content">
                            <div className="mockup-panel"></div>
                            <div className="mockup-panel"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="layout-meta">
                      <div>
                        <div className="layout-title">Full Sidebar</div>
                        <div className="layout-desc">Wide dark sidebar with labels</div>
                      </div>
                      {layout === 'full' && <div className="layout-check">✓</div>}
                    </div>
                  </div>



                  {/* Slim Sidebar */}
                  <div className={`layout-card ${layout === 'slim' ? 'active' : ''}`} onClick={() => setLayout('slim')}>
                    <div className="layout-mockup">
                      <div className="mockup-app">
                        <div className="mockup-sidebar" style={{ width: '10%', alignItems: 'center' }}>
                          <div className="mockup-item brand" style={{ width: '8px', height: '8px', borderRadius: '50%' }}></div>
                          <div className="mockup-item" style={{ width: '8px', height: '8px', borderRadius: '50%', marginTop: 8 }}></div>
                          <div className="mockup-item" style={{ width: '8px', height: '8px', borderRadius: '50%' }}></div>
                          <div className="mockup-item" style={{ width: '8px', height: '8px', borderRadius: '50%' }}></div>
                        </div>
                        <div className="mockup-main">
                          <div className="mockup-topbar"><div className="mockup-item" style={{ width: 24 }}></div></div>
                          <div className="mockup-content">
                            <div className="mockup-panel"></div>
                            <div className="mockup-panel"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="layout-meta">
                      <div>
                        <div className="layout-title">Slim Sidebar</div>
                        <div className="layout-desc">Ultra-thin compact icon sidebar</div>
                      </div>
                      {layout === 'slim' && <div className="layout-check">✓</div>}
                    </div>
                  </div>



                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 4 }}>Color Theme</label>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8 }}>Choose the global color scheme for the application</div>
                <select className="form-select" value={theme} onChange={e => setTheme(e.target.value)} style={{ maxWidth: 300 }}>
                  <option value="navy">Navy (Default)</option>
                  <option value="light">Light</option>
                  <option value="midnight">Midnight Dark</option>
                </select>
              </div>
            </div>
          )}

          {tab === 'account' && (
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '10px 0', maxWidth: 400 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Change Password</div>
              
              {pwError && <div className="login-error">{pwError}</div>}
              {pwSuccess && <div style={{ background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(16,185,129,0.3)', padding: '9px 12px', borderRadius: 7, fontSize: 12 }}>{pwSuccess}</div>}

              <div className="form-group">
                <label>Current Password</label>
                <input type="password" required className="form-input" value={pwState.current} onChange={e => setPwState({...pwState, current: e.target.value})} />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" required className="form-input" value={pwState.newPw} onChange={e => setPwState({...pwState, newPw: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" required className="form-input" value={pwState.confirm} onChange={e => setPwState({...pwState, confirm: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: 8, alignSelf: 'flex-start' }}>Update Password</button>
            </form>
          )}

          {tab === 'system' && (
            <div style={{ padding: '10px 0' }}>
              {canManageCompany ? (
                <CompanyProfile />
              ) : (
                <div className="empty-state" style={{ padding: '40px 20px', border: '1px dashed var(--border)', borderRadius: 8 }}>
                  🔒 Company settings are managed by your administrator.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CompanyProfile() {
  const { company, setCompany } = useAuth();
  const [form, setForm] = useState({
    name: company?.name || '',
    contact: company?.contact || '',
    overdue_threshold_days: company?.overdue_threshold_days || 3,
  });
  const [logoUrl, setLogoUrl] = useState(company?.logo_url || null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState(null); // { type, text }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Merge fresh company fields into the global auth context so every screen
  // (top bar logo, dashboards) reflects the change immediately.
  const applyToContext = (c) => setCompany((prev) => ({ ...prev, ...c }));

  const saveDetails = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!form.name.trim()) { setMsg({ type: 'error', text: 'Company name is required' }); return; }
    setBusy(true);
    try {
      const updated = await CompanyApi.update({
        name: form.name.trim(),
        contact: form.contact,
        overdue_threshold_days: Number(form.overdue_threshold_days) || 3,
      });
      applyToContext(updated);
      setMsg({ type: 'success', text: 'Company details saved.' });
    } catch (err) {
      setMsg({ type: 'error', text: apiError(err, 'Failed to save company details') });
    } finally { setBusy(false); }
  };

  const onLogoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    setMsg(null);
    setUploading(true);
    try {
      const updated = await CompanyApi.uploadLogo(file);
      setLogoUrl(updated.logo_url);
      applyToContext(updated);
      setMsg({ type: 'success', text: 'Logo updated. It now appears across the app for everyone in your company.' });
    } catch (err) {
      setMsg({ type: 'error', text: apiError(err, 'Failed to upload logo') });
    } finally { setUploading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 520 }}>
      <div style={{ fontSize: 14, fontWeight: 600 }}>Company Profile</div>

      {msg && (
        msg.type === 'success'
          ? <div style={{ background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(16,185,129,0.3)', padding: '9px 12px', borderRadius: 7, fontSize: 12 }}>{msg.text}</div>
          : <div className="login-error">{msg.text}</div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: 10, background: 'var(--navy4)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
          {logoUrl
            ? <img src={assetUrl(logoUrl)} alt="Company logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            : <span style={{ fontSize: 11, color: 'var(--text2)' }}>No logo</span>}
        </div>
        <div>
          <label className="btn btn-ghost" style={{ border: '1px solid var(--border)', cursor: 'pointer' }}>
            {uploading ? 'Uploading…' : 'Upload Logo'}
            <input type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml" style={{ display: 'none' }} onChange={onLogoChange} disabled={uploading} />
          </label>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 6 }}>PNG, JPG, GIF, WEBP or SVG · up to 2MB</div>
        </div>
      </div>

      <form onSubmit={saveDetails} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="form-group">
          <label>Company Name *</label>
          <input className="form-input" value={form.name} onChange={set('name')} />
        </div>
        <div className="form-group">
          <label>Contact (email / phone)</label>
          <input className="form-input" value={form.contact} onChange={set('contact')} />
        </div>
        <div className="form-group">
          <label>Overdue Threshold (days)</label>
          <input className="form-input" type="number" min="1" value={form.overdue_threshold_days} onChange={set('overdue_threshold_days')} style={{ maxWidth: 160 }} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={busy} style={{ alignSelf: 'flex-start' }}>
          {busy ? 'Saving…' : 'Save Company Details'}
        </button>
      </form>
    </div>
  );
}
