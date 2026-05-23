import { API_URL } from '../config/api';

let authToken = null;

export function setApiToken(token) {
  authToken = token;
}

export function clearApiToken() {
  authToken = null;
}

async function request(path, options = {}) {
  if (!API_URL) {
    throw new Error('API URL is not configured. Set EXPO_PUBLIC_API_URL in .env');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 404 && !data.message) {
      throw new Error(
        'This feature is not available on the server yet. Wait a few minutes after an app update, or check your internet.'
      );
    }
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  register: (body) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/api/auth/me'),
  verifyPinRecovery: (body) =>
    request('/api/auth/verify-pin-recovery', { method: 'POST', body: JSON.stringify(body) }),
  updatePhone: (body) =>
    request('/api/auth/phone', { method: 'PUT', body: JSON.stringify(body) }),
  sync: () => request('/api/sync'),
  updateSettings: (body) =>
    request('/api/sync/settings', { method: 'PUT', body: JSON.stringify(body) }),
  importData: (body) =>
    request('/api/sync/import', { method: 'POST', body: JSON.stringify(body) }),
  createContact: (body) =>
    request('/api/contacts', { method: 'POST', body: JSON.stringify(body) }),
  updateContact: (id, body) =>
    request(`/api/contacts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteContact: (id) => request(`/api/contacts/${id}`, { method: 'DELETE' }),
  createTransaction: (body) =>
    request('/api/transactions', { method: 'POST', body: JSON.stringify(body) }),
  deleteTransaction: (id) =>
    request(`/api/transactions/${id}`, { method: 'DELETE' }),
};
