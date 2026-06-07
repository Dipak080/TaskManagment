import { useAuth } from './auth/AuthContext';
import Login from './pages/Login';
import PlatformAdmin from './pages/PlatformAdmin';
import App from './App';

/**
 * Top-level gate: routes the user by auth state.
 *   not authenticated      → Login
 *   platform admin         → Platform console
 *   regular company user   → Task dashboard
 */
export default function Root() {
  const { loading, isAuthenticated, isPlatformAdmin } = useAuth();

  if (loading) {
    return <div className="login-wrap"><div className="loading-state">Loading…</div></div>;
  }
  if (!isAuthenticated) return <Login />;
  if (isPlatformAdmin) return <PlatformAdmin />;
  return <App />;
}
