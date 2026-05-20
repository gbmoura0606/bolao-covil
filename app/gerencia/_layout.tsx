import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/theme';

export default function GerenciaLayout(): React.JSX.Element {
  const { isAuthenticated, isLoading, mustChangePassword, canAccessGerencia } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login-gerencia');
    } else if (mustChangePassword) {
      router.replace('/change-password');
    } else if (!canAccessGerencia) {
      router.replace('/landing');
    }
  }, [isLoading, isAuthenticated, mustChangePassword, canAccessGerencia, router]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
