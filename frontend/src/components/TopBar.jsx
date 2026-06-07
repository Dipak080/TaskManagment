import { useState, useRef, useEffect } from 'react';
import { IconLogo, IconSearch } from './Icons';
import { initials } from '../utils/format';
import NotificationsDropdown from './NotificationsDropdown';
import { confirmDialog } from '../utils/confirm';
import { assetUrl } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function TopBar({ search, onSearch, user, onLogout, onOpenSettings, mobileMenuOpen, setMobileMenuOpen }) {
  const { company } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (await confirmDialog("Are you sure you want to logout?")) {
      onLogout();
    }
  };
  return (
    <header className="topbar">
      <div className="brand">
        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
        <div className="brand-icon" style={company?.logo_url ? { background: 'transparent' } : undefined}>
          {company?.logo_url
            ? <img src={assetUrl(company.logo_url)} alt={company?.name || 'Logo'} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 6 }} />
            : <IconLogo />}
        </div>
        <div className="brand-text-wrap">
          <div className="brand-name">TaskOps</div>
          <div className="brand-sub">{(company?.name || user?.company_name)?.toUpperCase() || 'TASK MANAGEMENT'}</div>
        </div>
      </div>
      <div className="topbar-search">
        <IconSearch />
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
        <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', background: 'var(--navy4)', padding: '1px 5px', borderRadius: 3 }}>⌘K</span>
      </div>
      <div className="topbar-actions">
        <NotificationsDropdown />
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <div className="avatar" title={user?.email} onClick={() => setShowDropdown(!showDropdown)}>
            {initials(user?.name || 'User')}
          </div>
          {showDropdown && (
            <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 160, background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              <button 
                className="nav-item" 
                style={{ padding: '10px 16px', borderRadius: 0 }}
                onClick={() => { setShowDropdown(false); onOpenSettings(); }}
              >
                ⚙️ Settings
              </button>
              <div style={{ height: 1, background: 'var(--border)' }} />
              <button 
                className="nav-item" 
                style={{ padding: '10px 16px', borderRadius: 0, color: 'var(--red)' }}
                onClick={() => { setShowDropdown(false); handleLogout(); }}
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
