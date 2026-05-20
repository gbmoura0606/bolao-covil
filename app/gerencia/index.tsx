import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';

const MODULES = [
  {
    id: 'financeiro',
    icon: '💰',
    label: 'Financeiro',
    description: 'Despesas, divisão e fechamento mensal da república',
    route: '/gerencia/financeiro',
    color: '#22C55E',
    colorBg: 'rgba(34,197,94,0.10)',
  },
  {
    id: 'compras',
    icon: '🛒',
    label: 'Lista de Compras',
    description: 'Itens pendentes e histórico do que foi comprado',
    route: '/gerencia/compras',
    color: '#F59E0B',
    colorBg: 'rgba(245,158,11,0.10)',
  },
  {
    id: 'moradores',
    icon: '👥',
    label: 'Moradores',
    description: 'Gerenciar moradores e pesos de divisão proporcional',
    route: '/gerencia/moradores',
    color: '#60A5FA',
    colorBg: 'rgba(96,165,250,0.10)',
  },
] as const;

export default function GerenciaHomeScreen(): React.JSX.Element {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout(): Promise<void> {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/landing');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconWrap}>
            <Text style={styles.headerIcon}>🏢</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Gerência do Setor</Text>
            <Text style={styles.headerSub}>Olá, {user?.nickname ?? ''}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Módulos</Text>
        {MODULES.map(mod => (
          <TouchableOpacity
            key={mod.id}
            style={styles.moduleCard}
            onPress={() => router.push(mod.route as any)}
            activeOpacity={0.75}
          >
            <View style={[styles.moduleIconWrap, { backgroundColor: mod.colorBg }]}>
              <Text style={styles.moduleIcon}>{mod.icon}</Text>
            </View>
            <View style={styles.moduleText}>
              <Text style={styles.moduleLabel}>{mod.label}</Text>
              <Text style={styles.moduleDesc}>{mod.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={mod.color} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2D4A',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(59,130,246,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E3A5F',
  },
  headerIcon: {
    fontSize: 22,
  },
  headerTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: '#60A5FA',
  },
  headerSub: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  logoutBtn: {
    padding: Spacing.sm,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1A2D4A',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  moduleIconWrap: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleIcon: {
    fontSize: 26,
  },
  moduleText: {
    flex: 1,
  },
  moduleLabel: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  moduleDesc: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
});
