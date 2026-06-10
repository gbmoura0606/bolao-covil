import api from './api';

export interface UserStatus {
  id: string;
  nickname: string;
  passwordChanged: boolean;
  canAccessGerencia: boolean;
  lastLoginAt: string | null;
  predictionCount: number;
  createdAt: string;
}

export async function getUsersStatus(): Promise<UserStatus[]> {
  const response = await api.get<UserStatus[]>('/api/auth/users-status');
  return response.data;
}
