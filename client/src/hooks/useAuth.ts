import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import * as authService from '../services/auth.service';

export function useAuth() {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authService.login(email, password);
    localStorage.setItem('accessToken', tokens.accessToken);
    const me = await authService.getMe();
    setAuth(me, tokens.accessToken);
    navigate('/');
  }, [setAuth, navigate]);

  const logout = useCallback(async () => {
    await authService.logout().catch(() => {});
    localStorage.removeItem('accessToken');
    clearAuth();
    navigate('/login');
  }, [clearAuth, navigate]);

  return { user, isAuthenticated, login, logout };
}
