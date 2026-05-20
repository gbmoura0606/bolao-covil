import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/theme';

export default function Index(): React.JSX.Element {
  const { isAuthenticated, isLoading, mustChangePassword } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        if (mustChangePassword) {
          router.replace('/change-password');
        } else {
          router.replace('/(tabs)/jogos');
        }
      } else {
        router.replace('/landing');
      }
    }
  }, [isLoading, isAuthenticated, mustChangePassword, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.accentGold} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
