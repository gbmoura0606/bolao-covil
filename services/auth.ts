import AsyncStorage from '@react-native-async-storage/async-storage';
import { ALLOWED_USERS, DEFAULT_PASSWORD } from '@/constants/users';
import type { User, LoginCredentials, UserAuthData } from '@/types';

const AUTH_KEY = (nickname: string) => `@bolao:auth:${nickname}`;

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${password}:bolao`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function login(
  credentials: LoginCredentials
): Promise<{ user: User; mustChangePassword: boolean }> {
  const { nickname, password } = credentials;

  const matched = ALLOWED_USERS.find(
    (u) => u.toLowerCase() === nickname.trim().toLowerCase()
  );

  if (!matched) {
    throw new Error('Usuário não encontrado.');
  }

  const storedRaw = await AsyncStorage.getItem(AUTH_KEY(matched));

  if (!storedRaw) {
    if (password !== DEFAULT_PASSWORD) {
      throw new Error('Senha incorreta.');
    }
    const user: User = {
      id: matched,
      nickname: matched,
      createdAt: new Date().toISOString(),
    };
    return { user, mustChangePassword: true };
  }

  const authData: UserAuthData = JSON.parse(storedRaw) as UserAuthData;
  const hash = await hashPassword(password, authData.salt);

  if (hash !== authData.passwordHash) {
    throw new Error('Senha incorreta.');
  }

  const user: User = {
    id: matched,
    nickname: matched,
    createdAt: new Date().toISOString(),
  };
  return { user, mustChangePassword: authData.mustChangePassword };
}

export async function changePassword(
  nickname: string,
  newPassword: string
): Promise<void> {
  if (newPassword.length < 4) {
    throw new Error('Senha deve ter ao menos 4 caracteres.');
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(newPassword, salt);

  const authData: UserAuthData = {
    passwordHash,
    salt,
    mustChangePassword: false,
  };

  await AsyncStorage.setItem(AUTH_KEY(nickname), JSON.stringify(authData));
}
