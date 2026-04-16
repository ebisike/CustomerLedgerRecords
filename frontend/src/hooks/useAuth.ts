import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const isAdmin = user?.role === 'Admin';

  return { user, isAuthenticated, isAdmin, logout };
}
