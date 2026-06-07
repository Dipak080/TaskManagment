import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthApi } from '../api/auth';
import { TOKEN_KEY } from '../api/client';

const AuthContext = createContext(null);

// Sidebar groups hidden for now (pages stay permission-controlled server-side).
const HIDDEN_GROUPS = ['Insights'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]); // array of page perm rows
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((data) => {
    setUser(data.user);
    setRole(data.role ?? null);
    setCompany(data.company ?? null);
    setPermissions(Array.isArray(data.permissions) ? data.permissions : []);
  }, []);

  const clearSession = useCallback(() => {
    setUser(null); setRole(null); setPermissions([]); setCompany(null);
  }, []);

  // Validate an existing token on first load.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setLoading(false); return; }
    AuthApi.me()
      .then(applySession)
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          clearSession();
        }
      })
      .finally(() => setLoading(false));
  }, [applySession, clearSession]);

  // Global 401 handler (fired by the axios interceptor).
  useEffect(() => {
    const onUnauthorized = () => clearSession();
    window.addEventListener('taskops:unauthorized', onUnauthorized);
    return () => window.removeEventListener('taskops:unauthorized', onUnauthorized);
  }, [clearSession]);

  const login = useCallback(async (email, password) => {
    const data = await AuthApi.login(email, password);
    localStorage.setItem(TOKEN_KEY, data.token);
    applySession(data);
    return data.user;
  }, [applySession]);

  // Self-registration returns a session just like login, so we log the new
  // company admin straight in.
  const register = useCallback(async (payload) => {
    const data = await AuthApi.register(payload);
    localStorage.setItem(TOKEN_KEY, data.token);
    applySession(data);
    return data.user;
  }, [applySession]);

  const logout = useCallback(async () => {
    try { await AuthApi.logout(); } catch { /* ignore */ }
    localStorage.removeItem(TOKEN_KEY);
    clearSession();
  }, [clearSession]);

  // Re-fetch permissions (e.g. after an admin edits the current user's role).
  const refreshSession = useCallback(async () => {
    try { applySession(await AuthApi.me()); } catch { /* ignore */ }
  }, [applySession]);

  // Permission map keyed by page name for O(1) checks.
  const permMap = useMemo(() => {
    const m = {};
    permissions.forEach((p) => { m[p.name] = p; });
    return m;
  }, [permissions]);

  // can('Tasks','view'|'create'|'edit'|'close'). Platform admins bypass.
  const can = useCallback((pageName, action) => {
    if (user?.is_platform_admin) return true;
    return !!permMap[pageName]?.[`can_${action}`];
  }, [permMap, user]);

  // Menu: viewable pages grouped by module_group, sorted.
  const menu = useMemo(() => {
    const viewable = permissions.filter((p) => p.can_view && !HIDDEN_GROUPS.includes(p.module_group))
      .sort((a, b) => a.sort_order - b.sort_order);
    const groups = [];
    const index = {};
    viewable.forEach((p) => {
      if (!(p.module_group in index)) {
        index[p.module_group] = groups.length;
        groups.push({ group: p.module_group, items: [] });
      }
      groups[index[p.module_group]].items.push(p);
    });
    // Keep the Masters group at the bottom, below the main navigation.
    const mastersIdx = groups.findIndex((g) => g.group === 'Masters');
    if (mastersIdx !== -1) groups.push(groups.splice(mastersIdx, 1)[0]);
    return groups;
  }, [permissions]);

  const value = {
    user, role, company, permissions, permMap, menu,
    loading,
    isAuthenticated: !!user,
    isPlatformAdmin: !!user?.is_platform_admin,
    companyId: user?.company_id ?? null,
    roleId: user?.role_id ?? null,
    can,
    login, register, logout, refreshSession, setCompany,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
