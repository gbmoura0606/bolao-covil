import type { LoginCredentials, User } from '@/types';

const MOCK_USER: User = {
  id: 'user-001',
  email: 'admin@bolao.com',
  name: 'Admin Bolão',
  createdAt: new Date().toISOString(),
};

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function mockLogin(credentials: LoginCredentials): Promise<User> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const { email, password } = credentials;

  if (!email.trim() || !password.trim()) {
    throw new Error('E-mail e senha são obrigatórios.');
  }

  if (!isValidEmail(email)) {
    throw new Error('Formato de e-mail inválido.');
  }

  if (email === 'admin@bolao.com' && password === '123456') {
    return { ...MOCK_USER, email };
  }

  if (email.trim() && password.trim()) {
    return {
      ...MOCK_USER,
      id: `user-${Date.now()}`,
      email: email.trim(),
      name: email.split('@')[0] ?? 'Usuário',
    };
  }

  throw new Error('Credenciais inválidas.');
}
