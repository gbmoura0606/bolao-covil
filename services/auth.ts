import api from './api';
import type { LoginCredentials, User } from '@/types';

interface LoginResponse {
  token: string;
  user: User;
  mustChangePassword: boolean;
}

// Ativa quando EXPO_PUBLIC_API_URL não está configurada (previews sem backend)
const DEMO_MODE = !process.env.EXPO_PUBLIC_API_URL;

const DEMO_USERS: Array<{
  nickname: string;
  password: string;
  user: User;
  mustChangePassword: boolean;
}> = [
  {
    nickname: 'admin',
    password: '123456',
    user: {
      id: 'demo-1',
      nickname: 'admin',
      canAccessGerencia: true,
      createdAt: '2026-01-01T00:00:00Z',
    },
    mustChangePassword: false,
  },
  {
    nickname: 'morador',
    password: '123456',
    user: {
      id: 'demo-2',
      nickname: 'morador',
      canAccessGerencia: false,
      createdAt: '2026-01-01T00:00:00Z',
    },
    mustChangePassword: false,
  },
];

export async function login(
  credentials: LoginCredentials
): Promise<{ user: User; token: string; mustChangePassword: boolean }> {
  if (DEMO_MODE) {
    const match = DEMO_USERS.find(
      u => u.nickname === credentials.nickname && u.password === credentials.password
    );
    if (!match) throw new Error('Credenciais inválidas');
    return { token: 'demo-token', user: match.user, mustChangePassword: match.mustChangePassword };
  }

  const response = await api.post<LoginResponse>('/api/auth/login', {
    nickname: credentials.nickname,
    password: credentials.password,
  });
  return response.data;
}

export async function changePassword(newPassword: string): Promise<void> {
  if (DEMO_MODE) return;
  await api.post('/api/auth/change-password', { newPassword });
}
