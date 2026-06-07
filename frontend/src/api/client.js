import axios from 'axios';

// Resolve the API base URL. Priority:
//   1. VITE_API_BASE from the active .env file (.env.development / .env.production)
//   2. Hostname auto-detect: localhost → local WAMP, anything else → live domain.
// The fallback means a single build still works in both places.
const isLocalHost =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);

const baseURL =
  import.meta.env.VITE_API_BASE ||
  (isLocalHost
    ? 'http://localhost/taskops/public/api'
    : 'https://codesksoftwares.com/taskdatabase/public/api');

export const TOKEN_KEY = 'taskops_token';

// Origin that serves static assets (strip the trailing "/api" from the API base).
export const API_ORIGIN = baseURL.replace(/\/api\/?$/, '');

// Resolve a stored asset path (e.g. "/uploads/company/x.png") to an absolute URL.
export const assetUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}/${String(path).replace(/^\//, '')}`;
};

const client = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 12000,
});

// Attach the JWT to every request.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, drop the token and notify the app to return to login.
client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('taskops:unauthorized'));
    }
    return Promise.reject(error);
  },
);

export default client;
