// ALL CALLS TO THE CAPARTNER BACKEND GO THROUGH THIS FILE
// In development, Vite forwards /api/... to the backend at http://localhost:3000 (see vite.config.js).
const BASE = '/api';
const SESSION_KEY = 'capartner.adminSession';
const EMAIL_KEY = 'capartner.rememberedEmail';

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw Object.assign(new Error('Cannot reach the server. Is the backend running?'), { status: 0 });
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    // Empty or non-JSON answer
  }
  if (!response.ok) {
    throw Object.assign(new Error(data.error || plainError(response.status)), {
      status: response.status,
      data,
    });
  }
  return data;
}

// When the backend did not send its own message, say what most likely happened.
function plainError(status) {
  if (status === 404) {
    return 'The server does not know this page yet. Restart the backend (node index.js) so it runs the latest version.';
  }
  if (status >= 500) {
    return 'Cannot reach the backend. Make sure it is running (node index.js in the backend folder), then try again.';
  }
  return 'Something went wrong. Please try again.';
}

// LOGIN STEP 1: email + password. Returns { pendingToken, codeValidMinutes }.
export function adminLogin(email, password) {
  return request('POST', '/admin/login', { email, password });
}

// LOG OUT: tells the backend, so this login pass stops working everywhere. Never throws.
export async function adminLogout() {
  const session = loadSession();
  if (!session) return;
  try {
    await request('POST', '/admin/logout', null, session.token);
  } catch {
    // Offline or already logged out: the pass is forgotten in this browser anyway.
  }
}

// LOGIN STEP 2: 6-digit code. Returns { token, expiresInMinutes, admin }.
export function adminVerifyCode(pendingToken, code) {
  return request('POST', '/admin/verify-code', { pendingToken, code });
}

// CALLS THAT NEED THE ADMIN TO BE LOGGED IN (A 401 ANSWER MEANS THE LOGIN PASS ENDED)
function adminRequest(method, path, body) {
  const session = loadSession();
  if (!session) {
    return Promise.reject(Object.assign(new Error('Please log in again.'), { status: 401 }));
  }
  return request(method, path, body, session.token);
}

export const listEnforcers = () => adminRequest('GET', '/enforcers');
// data: { fullName, email, sectorId, badgeNo, contactNo, capCode }
export const createEnforcer = (data) => adminRequest('POST', '/enforcers', data);
export const deleteEnforcer = (id) => adminRequest('DELETE', `/enforcers/${id}`);
export const forceLogoutEnforcer = (id) => adminRequest('POST', `/enforcers/${id}/force-logout`);
export const resendEnforcerLogin = (id) => adminRequest('POST', `/enforcers/${id}/resend`);
export const unlockEnforcer = (id) => adminRequest('POST', `/enforcers/${id}/unlock`);
export const listSectors = () => adminRequest('GET', '/sectors');
export const listCaps = () => adminRequest('GET', '/caps');
// Body: { capCode: 'CAP-002' } or { capCode: null } to remove the cap
export const assignCap = (id, capCode) => adminRequest('PATCH', `/enforcers/${id}`, { capCode });
// Latest vitals + heart rate / temperature history between from and to (Date or ISO text)
export const getEnforcerVitals = (id, from, to) =>
  adminRequest('GET', `/enforcers/${id}/telemetry${query({ from: toIso(from), to: toIso(to) })}`);

// ALERTS: filters { status: 'open'|'new'|'acknowledged'|'resolved', type: 'sos'|'health'|..., afterId, limit }
export const listAlerts = (filters = {}) => adminRequest('GET', `/admin/alerts${query(filters)}`);
export const markAlertRead = (id) => adminRequest('POST', `/admin/alerts/${id}/read`);
export const acknowledgeAlert = (id) => adminRequest('POST', `/admin/alerts/${id}/acknowledge`);
export const dispatchAlert = (id) => adminRequest('POST', `/admin/alerts/${id}/dispatch`);
export const resolveAlert = (id) => adminRequest('POST', `/admin/alerts/${id}/resolve`);

export const getOverview = () => adminRequest('GET', '/admin/overview');

// SETTINGS (system limits, same for everyone) and PREFERENCES (this admin's own switches)
export const getSettings = () => adminRequest('GET', '/admin/settings');
export const saveSettings = (changes) => adminRequest('PATCH', '/admin/settings', changes);
export const getPreferences = () => adminRequest('GET', '/admin/preferences');
export const savePreferences = (changes) => adminRequest('PATCH', '/admin/preferences', changes);

// ACTIVITY LOG: { type, page, limit }
export const listAudit = (filters = {}) => adminRequest('GET', `/admin/audit${query(filters)}`);

// LIVE CAMERA: list the cameras, start / stop one, and pass the connection messages (WebRTC)
export const listLive = () => adminRequest('GET', '/admin/live');
export const startLive = (id) => adminRequest('POST', `/admin/live/${id}/start`);
export const stopLive = (id) => adminRequest('POST', `/admin/live/${id}/stop`);
export const sendLiveSignal = (id, signal) => adminRequest('POST', `/admin/live/${id}/signal`, signal);
export const readLiveSignals = (id) => adminRequest('GET', `/admin/live/${id}/signal`);

// CAMERA CLIPS sent from the phones
export const listMedia = () => adminRequest('GET', '/admin/media');
// PERMANENT: removes the clip's record and its video file
export const deleteMedia = (id) => adminRequest('DELETE', `/admin/media/${id}`);

// The clip file needs the admin pass, so it is downloaded and played from a blob URL.
// Call URL.revokeObjectURL(url) when the clip is no longer shown.
export async function fetchMediaUrl(id) {
  const session = loadSession();
  if (!session) throw Object.assign(new Error('Please log in again.'), { status: 401 });
  let response;
  try {
    response = await fetch(`${BASE}/admin/media/${id}/file`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
  } catch {
    throw Object.assign(new Error('Cannot reach the server. Is the backend running?'), { status: 0 });
  }
  if (!response.ok) {
    let message = 'This clip could not be loaded.';
    try {
      message = (await response.json()).error || message;
    } catch {
      // Not JSON
    }
    throw Object.assign(new Error(message), { status: response.status });
  }
  return URL.createObjectURL(await response.blob());
}

function toIso(value) {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}

// { a: 1, b: null } -> '?a=1' (empty values are left out)
function query(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

// THE LOGIN PASS LIVES ONLY WHILE THIS BROWSER TAB IS OPEN, UNTIL LOG OUT
export function saveSession(result) {
  const session = {
    token: result.token,
    admin: result.admin,
    // null = no time limit: the login lasts until Log out (or until this browser tab is closed)
    expiresAt: result.expiresInMinutes ? Date.now() + result.expiresInMinutes * 60 * 1000 : null,
  };
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Storage blocked: the login still works until the page is refreshed
  }
  return session;
}

export function loadSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    if (!session || !session.token) return null;
    return session.expiresAt === null || session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Nothing to clear
  }
}

// "REMEMBER ME" KEEPS ONLY THE EMAIL. NEVER THE PASSWORD OR THE LOGIN PASS.
export function getRememberedEmail() {
  try {
    return localStorage.getItem(EMAIL_KEY) || '';
  } catch {
    return '';
  }
}

export function setRememberedEmail(email) {
  try {
    if (email) localStorage.setItem(EMAIL_KEY, email);
    else localStorage.removeItem(EMAIL_KEY);
  } catch {
    // Storage blocked: just do not remember
  }
}
