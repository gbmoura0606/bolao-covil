import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, AuthState, LoginCredentials } from '@/types';
import { login as authLogin, changePassword as authChangePassword } from '@/services/auth';

const SESSION_KEY = '@bolao:session';

interface SessionData {
  user: User;
  mustChangePassword: boolean;
}

export function useAuth(): AuthState & {
  login: (credentials: LoginCredentials) => Promise<{ mustChangePassword: boolean }>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
} {
  const [user, setUser] = useState<User | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSession(): Promise<void> {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (raw) {
          const session = JSON.parse(raw) as SessionData;
          setUser(session.user);
          setMustChangePassword(session.mustChangePassword);
        }
      } catch {
        // corrupted storage — start unauthenticated
      } finally {
        setIsLoading(false);
      }
    }
    void loadSession();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const result = await authLogin(credentials);
    const session: SessionData = {
      user: result.user,
      mustChangePassword: result.mustChangePassword,
    };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(result.user);
    setMustChangePassword(result.mustChangePassword);
    return { mustChangePassword: result.mustChangePassword };
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setUser(null);
    setMustChangePassword(false);
  }, []);

  const changePassword = useCallback(
    async (newPassword: string): Promise<void> => {
      if (!user) throw new Error('Não autenticado.');
      await authChangePassword(user.nickname, newPassword);
      const session: SessionData = { user, mustChangePassword: false };
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setMustChangePassword(false);
    },
    [user]
  );

  return {
    user,
    isLoading,
    isAuthenticated: user !== null,
    mustChangePassword,
    login,
    logout,
    changePassword,
  };
}
