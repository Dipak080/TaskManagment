import { useEffect, useMemo, useState } from 'react';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import TaskDashboard from './pages/TaskDashboard';
import HomeDashboard from './pages/HomeDashboard';
import Reports from './pages/Reports';
import RoleManagement from './pages/RoleManagement';
import UserManagement from './pages/UserManagement';
import Masters from './pages/Masters';
import Settings from './pages/Settings';
import { useAuth } from './auth/AuthContext';
import { useSettings } from './SettingsContext';
import { resolveGlobalConfirm } from './utils/confirm';

// Pages that render the task workspace (with a scope/createMode variation).
const TASK_PAGES = {
  'Tasks': { scope: 'all' },
  'Create Task': { scope: 'all', create: true },
};

const ACTIVE_PAGE_KEY = 'taskops_active_page';

export default function App() {
  const { user, role, menu, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [active, setActive] = useState(null);
  const [createSignal, setCreateSignal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Restore the last-visited page on load (survives refresh), falling back to
  // the first viewable page. We only trust a stored page the user can still see.
  useEffect(() => {
    if (active) return;
    const names = menu.flatMap((g) => g.items.map((i) => i.name));
    if (!names.length) return;
    const stored = localStorage.getItem(ACTIVE_PAGE_KEY);
    // Settings is reachable but not part of the menu groups.
    const restorable = stored && (names.includes(stored) || stored === 'Settings');
    setActive(restorable ? stored : names[0]);
  }, [menu, active]);

  const onSelect = (page) => {
    setActive(page.name);
    localStorage.setItem(ACTIVE_PAGE_KEY, page.name);
    setMobileMenuOpen(false); // Close mobile menu on select
    if (TASK_PAGES[page.name]?.create) setCreateSignal(true);
  };

  // The header search filters tasks. If the user starts searching from a page
  // that doesn't list tasks, jump to the Tasks workspace so results are visible.
  const onSearch = (value) => {
    setSearch(value);
    if (value && active !== 'Tasks' && active !== 'Dashboard') {
      const hasTasks = menu.some((g) => g.items.some((i) => i.name === 'Tasks'));
      if (hasTasks) {
        setActive('Tasks');
        localStorage.setItem(ACTIVE_PAGE_KEY, 'Tasks');
      }
    }
  };

  const userForBar = useMemo(
    () => ({ ...user, role_name: role?.name }),
    [user, role],
  );

  const { layout } = useSettings();
  const [globalToast, setGlobalToast] = useState(null);
  const [globalConfirm, setGlobalConfirm] = useState(null);

  useEffect(() => {
    const handleToast = (e) => {
      setGlobalToast(e.detail);
      setTimeout(() => setGlobalToast(null), 2600);
    };
    const handleConfirm = (e) => setGlobalConfirm(e.detail);
    
    window.addEventListener('global-toast', handleToast);
    window.addEventListener('global-confirm', handleConfirm);
    return () => {
      window.removeEventListener('global-toast', handleToast);
      window.removeEventListener('global-confirm', handleConfirm);
    };
  }, []);

  return (
    <div className={`app layout-${layout}`}>
      {globalToast && <div className={`toast ${globalToast.type}`}>{globalToast.message}</div>}
      
      {globalConfirm && (
        <div className="modal-backdrop show" style={{ zIndex: 1000 }}>
          <div className="modal" style={{ width: 340, textAlign: 'center' }}>
            <div className="modal-body" style={{ padding: '24px 20px 20px' }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 20 }}>{globalConfirm.message}</div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn btn-ghost" onClick={() => resolveGlobalConfirm(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => resolveGlobalConfirm(true)}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <TopBar
        search={search} onSearch={onSearch}
        onOpenTV={() => {}} user={userForBar} onLogout={logout} 
        onOpenSettings={() => onSelect({ name: 'Settings' })}
        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}
      />
      <Sidebar 
        menu={menu} active={active} onSelect={onSelect} user={userForBar} 
        onOpenSettings={() => onSelect({ name: 'Settings' })} 
        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}
      />

      <main className="main">
        <PageContent
          active={active}
          search={search}
          createSignal={createSignal}
          onConsumeCreate={() => setCreateSignal(false)}
        />
      </main>
    </div>
  );
}

function PageContent({ active, search, createSignal, onConsumeCreate }) {
  if (!active) return <div className="loading-state">Loading…</div>;

  if (active in TASK_PAGES) {
    return (
      <TaskDashboard
        search={search}
        scope={TASK_PAGES[active].scope}
        createMode={createSignal}
        onConsumeCreate={onConsumeCreate}
      />
    );
  }
  if (active === 'Dashboard') return <HomeDashboard search={search} />;
  if (active === 'Reports') return <Reports />;
  if (active === 'Role Management') return <RoleManagement />;
  if (active === 'User Management') return <UserManagement />;
  if (active === 'Settings') return <Settings />;
  if (active?.startsWith('Masters-')) return <Masters active={active} />;

  // Pages that are permission-controlled but not yet built as screens.
  return (
    <div className="content-pad">
      <div className="page-title">{active}</div>
      <div className="page-sub">This screen is permission-enabled and coming soon.</div>
      <div className="empty-state">🛠️ “{active}” is reserved in the menu and access-controlled, but the screen isn’t built yet.</div>
    </div>
  );
}
