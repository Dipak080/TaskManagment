import {
  IconDashboard, IconTasks, IconPlus, IconAccounts, IconPurchase,
  IconLogistics, IconProduction, IconPlanning, IconMarketing, IconShield, IconClock, IconTV, IconSettings
} from './Icons';

// Map page name → icon (falls back to a neutral icon).
const ICONS = {
  'Dashboard': IconDashboard,
  'Tasks': IconTasks,
  'Create Task': IconPlus,
  'Masters-Departments': IconPurchase,
  'Masters-TaskStatuses': IconMarketing,
  'Masters-TaskPriorities': IconMarketing,
  'Masters-TaskCategories': IconMarketing,
  'Role Management': IconShield,
  'User Management': IconAccounts,
  'Reports': IconClock,
  'Wall Board': IconTV,
};

const LABELS = {
  'Masters-TaskStatuses': 'Task Statuses',
  'Masters-TaskPriorities': 'Task Priorities',
  'Masters-TaskCategories': 'Task Categories',
  'Masters-Departments': 'Departments'
};

// Strip the "Masters-" prefix for display, or use explicit label.
const label = (name) => LABELS[name] || (name.startsWith('Masters-') ? name.slice(8) : name);

export default function Sidebar({ menu, active, onSelect, user, onOpenSettings, mobileMenuOpen, setMobileMenuOpen }) {
  return (
    <>
      <div className={`mobile-overlay ${mobileMenuOpen ? 'show' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
      {menu.length === 0 && (
        <div className="nav-section" style={{ color: 'var(--muted)' }}>No accessible pages</div>
      )}

      {menu.map(({ group, items }) => (
        <div key={group}>
          <div className="nav-section">{group}</div>
          {items.map((p) => {
            const Icon = ICONS[p.name] || IconTasks;
            return (
              <button
                key={p.name}
                className={`nav-item ${active === p.name ? 'active' : ''}`}
                onClick={() => onSelect(p)}
              >
                <Icon />
                <span>{label(p.name)}</span>
              </button>
            );
          })}
        </div>
      ))}

      <div className="sidebar-bottom" style={{ marginTop: 'auto' }}>
        <div className="user-card">
          <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
            {(user?.name || 'U').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role_name || 'NO ROLE'}</div>
          </div>
          <button 
            className={`btn btn-ghost ${active === 'Settings' ? 'active' : ''}`} 
            style={{ padding: '6px', color: active === 'Settings' ? 'var(--blue)' : 'var(--muted)', marginLeft: 'auto' }} 
            onClick={onOpenSettings} 
            title="Settings"
          >
            <IconSettings />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
