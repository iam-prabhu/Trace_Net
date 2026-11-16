import { apiClient } from './api';
import { User, AuthTokens } from '../types/user.types';
import { ApiResponse } from '../types/index';

export async function login(email: string, password: string): Promise<AuthTokens> {
  const res = await apiClient.post<ApiResponse<AuthTokens>>('/auth/login', { email, password });
  return res.data.data!;
}

export async function register(data: {
  email: string; password: string; firstName: string; lastName: string;
}): Promise<User> {
  const res = await apiClient.post<ApiResponse<User>>('/auth/register', data);
  return res.data.data!;
}

export async function getMe(): Promise<User> {
  const res = await apiClient.get<ApiResponse<User>>('/auth/me');
  return res.data.data!;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}
