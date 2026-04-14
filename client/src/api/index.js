const BASE = '/api';

function getToken() {
  return localStorage.getItem('auth_token');
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export const api = {
  register: (data) => request('POST', '/auth/register', data),
  login: (data) => request('POST', '/auth/login', data),
  verifyOtp: (data) => request('POST', '/auth/verify-otp', data),
  me: () => request('GET', '/auth/me'),
  logout: () => request('POST', '/auth/logout'),
  setup2fa: (data) => request('POST', '/auth/setup-2fa', data),

  getPasswords: (params) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request('GET', `/passwords${qs}`);
  },
  getPassword: (id) => request('GET', `/passwords/${id}`),
  createPassword: (data) => request('POST', '/passwords', data),
  updatePassword: (id, data) => request('PATCH', `/passwords/${id}`, data),
  deletePassword: (id) => request('DELETE', `/passwords/${id}`),
  checkBreach: (id) => request('GET', `/passwords/${id}/check-breach`),
  exportPdf: async () => {
    const res = await fetch(`${BASE}/passwords/export/pdf`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error('Export failed');
    return res.blob();
  },

  generate: (data) => request('POST', '/generator/generate', data),
  checkStrength: (data) => request('POST', '/generator/check-strength', data),

  getStats: () => request('GET', '/dashboard/stats'),
  getHealth: () => request('GET', '/dashboard/health'),
};
