import axios from 'axios';
import { API_URL } from '../utils/constants';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor: attach JWT
apiClient.interceptors.request.use(config => {
  let token = localStorage.getItem('accessToken');
  if (!token) {
    try {
      const stored = localStorage.getItem('auth-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        token = parsed?.state?.accessToken;
      }
    } catch {
      // ignore
    }
  }
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: handle 401
apiClient.interceptors.response.use(
  res => res,
  err => {
    if (
      err.response?.status === 401 &&
      !window.location.pathname.includes('/login') &&
      !err.config?.url?.includes('/auth/login')
    ) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
