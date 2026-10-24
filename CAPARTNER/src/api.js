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
    throw Object.assign(new Error(data.error || 'Something went wrong. Please try again.'), {
      status: response.status,
      data,
    });
  }
  return data;
}

// LOGIN STEP 1: email + password. Returns { pendingToken, codeValidMinutes }.
export function adminLogin(email, password) {
  return request('POST', '/admin/login', { email, password });
}

// LOGIN STEP 2: 6-digit code. Returns { token, expiresInMinutes, admin }.
export function adminVerifyCode(pendingToken, code) {
  return request('POST', '/admin/verify-code', { pendingToken, code });
}

// THE LOGIN PASS LIVES ONLY FOR THIS BROWSER TAB AND ENDS AFTER auto_signout_minutes
export function saveSession(result) {
  const session = {
    token: result.token,
    admin: result.admin,
    expiresAt: Date.now() + result.expiresInMinutes * 60 * 1000,
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
    return session && session.expiresAt > Date.now() ? session : null;
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
