import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** Unix timestamp (ms) when the access token expires */
  expiresAt: number | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string, expiresAt?: number) => void;
  setTokens: (accessToken: string, refreshToken: string, expiresAt?: number) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken, expiresAt) =>
        set({
          user,
          accessToken,
          refreshToken,
          expiresAt: expiresAt ?? Date.now() + 60 * 60 * 1000, // default 60 min
          isAuthenticated: true,
        }),

      setTokens: (accessToken, refreshToken, expiresAt) =>
        set({
          accessToken,
          refreshToken,
          expiresAt: expiresAt ?? Date.now() + 60 * 60 * 1000,
        }),

      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, expiresAt: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
