// Extracts a human-friendly message from an Axios/API error.
//
// CodeIgniter responses look like:
//   { status: 401, error: 401, messages: { error: "Invalid email or password" } }
//   { messages: { password: "Too short", email: "..." } }   (validation)
//   { error: "Some message" }                                (a few endpoints)
//
// Note `data.error` is often the numeric HTTP code, so we must NOT show it
// directly — that's how the UI ended up displaying raw codes like "401".

const STATUS_FALLBACK = {
  400: 'Invalid request. Please check your input and try again.',
  401: 'Invalid credentials or your session has expired. Please sign in again.',
  403: 'You don’t have permission to do that.',
  404: 'The requested item was not found.',
  409: 'That already exists.',
  413: 'The file is too large to upload.',
  422: 'Please check the highlighted fields and try again.',
  429: 'Too many attempts. Please wait a moment and try again.',
  500: 'Something went wrong on the server. Please try again shortly.',
  502: 'The server is unavailable right now. Please try again shortly.',
  503: 'The service is temporarily unavailable. Please try again shortly.',
};

export function apiError(err, fallback = 'Something went wrong. Please try again.') {
  // Request was made but no response → network/CORS/timeout.
  if (err && err.response == null) {
    if (err.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
    if (err.request) return 'Cannot reach the server. Check your internet connection and try again.';
  }

  const status = err?.response?.status;

  // Server errors (5xx) often carry raw exception text (e.g. DB connection
  // dumps). Never surface that to users — show a clean message instead.
  if (status >= 500) {
    return STATUS_FALLBACK[status] || 'Something went wrong on the server. Please try again shortly.';
  }

  const data = err?.response?.data;
  if (data && typeof data === 'object') {
    const msgs = data.messages;
    if (typeof msgs === 'string' && msgs.trim()) return msgs.trim();
    if (msgs && typeof msgs === 'object') {
      const first = Object.values(msgs).find((v) => typeof v === 'string' && v.trim());
      if (first) return first.trim();
    }
    // Only use data.error if it's an actual message, not the numeric HTTP code.
    if (typeof data.error === 'string' && data.error.trim() && Number.isNaN(Number(data.error))) {
      return data.error.trim();
    }
    if (typeof data.message === 'string' && data.message.trim()) return data.message.trim();
    if (typeof data.reason === 'string' && data.reason.trim()) return data.reason.trim();
  }

  if (status && STATUS_FALLBACK[status]) return STATUS_FALLBACK[status];

  return fallback;
}
