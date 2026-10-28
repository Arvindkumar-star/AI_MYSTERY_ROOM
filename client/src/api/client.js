const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (netErr) {
    throw new Error(
      'Cannot connect to backend server. Please verify the server is running at http://localhost:5000'
    );
  }

  const rawText = await response.text();
  let data;
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch (err) {
    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status} ${response.statusText || ''}`);
    }
    throw new Error('Server returned an empty or invalid response.');
  }

  if (!response.ok || !data.ok) {
    const error = new Error(data?.error?.message || `Request failed with HTTP ${response.status}`);
    error.code = data?.error?.code || 'UNKNOWN_ERROR';
    error.status = response.status;
    throw error;
  }

  return data.data;
}

export const api = {
  getHealth: () => apiRequest('/health'),
  createCase: (payload) => apiRequest('/cases', { method: 'POST', body: JSON.stringify(payload) }),
  getCaseStatus: (id) => apiRequest(`/cases/${id}/status`),
  getCase: (id) => apiRequest(`/cases/${id}`),
  getCases: () => apiRequest('/cases'),
  retryGeneration: (id) => apiRequest(`/cases/${id}/retry-generation`, { method: 'POST' }),

  startInvestigation: (caseId) =>
    apiRequest(`/cases/${caseId}/investigations`, { method: 'POST' }),
  getInvestigation: (id) => apiRequest(`/investigations/${id}`),
  updateInvestigation: (id, updates) =>
    apiRequest(`/investigations/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
  getHint: (id) => apiRequest(`/investigations/${id}/hint`, { method: 'POST' }),
  accuse: (id, payload) =>
    apiRequest(`/investigations/${id}/accuse`, { method: 'POST', body: JSON.stringify(payload) }),
  getReveal: (id) => apiRequest(`/investigations/${id}/reveal`),
};
