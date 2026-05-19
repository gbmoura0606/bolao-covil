import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius, Shadows } from '@/constants/theme';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginScreen(): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/(tabs)/jogos');
    }
  }, [isLoading, isAuthenticated, router]);

  async function handleLogin(): Promise<void> {
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('E-mail e senha são obrigatórios.');
      return;
    }

    if (!isValidEmail(email.trim())) {
      setErrorMsg('Formato de e-mail inválido.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password: password.trim() });
      router.replace('/(tabs)/jogos');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login.';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accentGold} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/landing')}>
          <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
          <Text style={styles.backText}>Início</Text>
        </TouchableOpacity>
      </SafeAreaView>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Text style={styles.logo}>⚽</Text>
          </View>
          <Text style={styles.appName}>Bolão Covil</Text>
          <Text style={styles.tagline}>Copa do Mundo 2026</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Entrar</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor={Colors.textSecondary}
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setErrorMsg('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••"
              placeholderTextColor={Colors.textSecondary}
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setErrorMsg('');
              }}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
          </View>

          {errorMsg !== '' && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.loginBtn, isSubmitting && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Colors.background} />
            ) : (
              <Text style={styles.loginBtnText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.hint}>
            Demo: admin@bolao.com / 123456{'\n'}
            Ou qualquer e-mail válido + senha não vazia
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    backgroundColor: Colors.background,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  backText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(5,150,105,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.darkGreen,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    fontSize: 56,
    marginBottom: Spacing.sm,
  },
  appName: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.accentGold,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.lg,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  loginBtn: {
    backgroundColor: Colors.accentGold,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
    ...Shadows.sm,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: Colors.background,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.5,
  },
  hint: {
    marginTop: Spacing.md,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
