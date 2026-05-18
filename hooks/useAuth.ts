import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, AuthState, LoginCredentials } from '@/types';
import { mockLogin } from '@/services/auth';

const USER_STORAGE_KEY = '@bolao:user';

export function useAuth(): AuthState & {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
} {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  async function loadStoredUser(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as User;
        setUser(parsed);
      }
    } catch {
      // Storage error — start unauthenticated
    } finally {
      setIsLoading(false);
    }
  }

  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    const loggedUser = await mockLogin(credentials);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedUser));
    setUser(loggedUser);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    logout,
  };
}
