import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export const TOKEN_STORAGE_KEY = '@bolao:token';
export const SESSION_STORAGE_KEY = '@bolao:session';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isAxiosError(error)) {
      // Token expirado ou invalidado (ex: JWT_SECRET trocado no servidor):
      // limpa a sessão e volta ao início — exceto no próprio login, onde 401 = senha errada
      const url = error.config?.url ?? '';
      if (error.response?.status === 401 && !url.includes('/api/auth/login')) {
        await AsyncStorage.multiRemove([SESSION_STORAGE_KEY, TOKEN_STORAGE_KEY]);
        router.replace('/landing');
      }
      if (error.response?.data?.error) {
        return Promise.reject(new Error(String(error.response.data.error)));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
