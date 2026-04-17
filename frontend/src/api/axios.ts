import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://drinkandfood-api-gateway.runasp.net/api/v1';

// Refresh 60 seconds before the token actually expires
const REFRESH_THRESHOLD_MS = 60 * 1000;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// Shared refresh promise — prevents concurrent refresh calls
let refreshPromise: Promise<string> | null = null;

async function performRefresh(): Promise<string> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState();

  if (!refreshToken) {
    logout();
    return Promise.reject(new Error('No refresh token available'));
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
    const data = response.data.results;
    const newExpiresAt = Date.now() + 60 * 60 * 1000; // 60 min from now
    setTokens(data.accessToken, data.refreshToken, newExpiresAt);
    return data.accessToken;
  } catch (err) {
    logout();
    return Promise.reject(err);
  } finally {
    refreshPromise = null;
  }
}

function getOrStartRefresh(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = performRefresh();
  }
  return refreshPromise;
}

function isTokenExpiredOrExpiringSoon(): boolean {
  const { expiresAt, accessToken } = useAuthStore.getState();
  if (!accessToken) return false;
  if (!expiresAt) return false;
  return Date.now() >= expiresAt - REFRESH_THRESHOLD_MS;
}

// ─── Request interceptor ───────────────────────────────────────────────────
// Proactively refreshes the token if it is expired or within 60 s of expiry
// before the request is even sent. This means users never see a 401.
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const { accessToken, isAuthenticated } = useAuthStore.getState();

    if (isAuthenticated && accessToken && isTokenExpiredOrExpiringSoon()) {
      try {
        const freshToken = await getOrStartRefresh();
        config.headers.Authorization = `Bearer ${freshToken}`;
        return config;
      } catch {
        // performRefresh already called logout(); let the request fail naturally
        return config;
      }
    }

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor ─────────────────────────────────────────────────
// Catches any 401 that slipped through (e.g. clock skew, server-side revocation)
// and attempts one final refresh + retry before giving up.
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const freshToken = await getOrStartRefresh();
        originalRequest.headers.Authorization = `Bearer ${freshToken}`;
        return apiClient(originalRequest);
      } catch {
        // logout already called inside performRefresh
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
