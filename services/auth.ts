import api from './api';
import type { LoginCredentials, User } from '@/types';

interface LoginResponse {
  token: string;
  user: User;
  mustChangePassword: boolean;
}

export async function login(
  credentials: LoginCredentials
): Promise<{ user: User; token: string; mustChangePassword: boolean }> {
  const response = await api.post<LoginResponse>('/api/auth/login', {
    nickname: credentials.nickname,
    password: credentials.password,
  });
  return response.data;
}

export async function changePassword(newPassword: string): Promise<void> {
  await api.post('/api/auth/change-password', { newPassword });
}
