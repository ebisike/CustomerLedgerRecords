import { useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Fire the background refresh this many ms before actual expiry
const REFRESH_BEFORE_EXPIRY_MS = 60 * 1000; // 60 seconds

/**
 * Mounts a background timer that silently refreshes the JWT access token
 * ~60 seconds before it expires — keeping the session alive indefinitely
 * as long as the user has a valid refresh token.
 *
 * Mount this once at the app root (inside the authenticated shell).
 */
export function useTokenRefresh() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const schedule = () => {
      const { expiresAt, refreshToken, isAuthenticated, setTokens, logout } =
        useAuthStore.getState();

      if (!isAuthenticated || !refreshToken || !expiresAt) return;

      const msUntilRefresh = expiresAt - Date.now() - REFRESH_BEFORE_EXPIRY_MS;

      if (timerRef.current) clearTimeout(timerRef.current);

      // If already past the threshold, refresh immediately
      const delay = Math.max(0, msUntilRefresh);

      timerRef.current = setTimeout(async () => {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });
          const data = response.data.results;
          const newExpiresAt = Date.now() + 60 * 60 * 1000;
          setTokens(data.accessToken, data.refreshToken, newExpiresAt);
          // Re-schedule for the new token's lifetime
          schedule();
        } catch {
          logout();
        }
      }, delay);
    };

    schedule();

    // Re-schedule whenever auth state changes (e.g. after login or manual refresh)
    const unsubscribe = useAuthStore.subscribe(
      (state) => state.expiresAt,
      () => schedule()
    );

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      unsubscribe();
    };
  }, []); // runs once on mount
}
