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

/** Volta a senha do usuário para a padrão ('123') e força troca no próximo login. */
export async function resetUserPassword(userId: string): Promise<{ nickname: string }> {
  const response = await api.post<{ success: boolean; nickname: string }>(
    `/api/auth/users/${userId}/reset-password`,
  );
  return { nickname: response.data.nickname };
}
