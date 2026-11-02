import { resolveAssetUrl } from './asset-url.js';

const configuredApi = (import.meta.env.VITE_API_URL || '/api').trim().replace(/\/+$/, '');
export const API = configuredApi.endsWith('/api') ? configuredApi : `${configuredApi}/api`;

export const assetUrl = (value) => resolveAssetUrl(value, API.replace(/\/api$/, ''));

export async function request(endpoint, options) {
  let response;
  try {
    response = await fetch(`${API}${endpoint}`, { credentials: "include", ...options });
  } catch {
    const failure = new Error(`The backend is unavailable at ${API}. Start it with "npm run server" and verify that MongoDB Atlas allows your IP address.`);
    failure.status = 0;
    throw failure;
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const failure = new Error(error.message || 'Unable to load café data. Please try again.');
    failure.status = response.status;
    if (response.status === 401 && !endpoint.startsWith('/auth/')) window.dispatchEvent(new Event('admin-session-expired'));
    throw failure;
  }
  return response.status === 204 ? null : response.json();
}

export async function adminFetch(url, options) {
  const response = await fetch(url, { credentials: 'include', ...options });
  if (response.status === 401) window.dispatchEvent(new Event('admin-session-expired'));
  return response;
}
