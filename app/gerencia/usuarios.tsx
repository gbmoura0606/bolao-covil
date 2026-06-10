import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  ListRenderItemInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getUsersStatus, UserStatus } from '@/services/users';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius, Shadows } from '@/constants/theme';

function fmtLastLogin(iso: string | null): string {
  if (!iso) return 'nunca entrou';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'agora mesmo';
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ontem';
  if (days < 30) return `há ${days} dias`;
  return d.toLocaleDateString('pt-BR');
}

function UserRow({ user }: { user: UserStatus }): React.JSX.Element {
  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.nameRow}>
          <Text style={styles.nickname}>{user.nickname}</Text>
          {user.canAccessGerencia && (
            <Ionicons name="shield-checkmark-outline" size={13} color="#60A5FA" />
          )}
        </View>
        <Text style={styles.meta}>
          {user.predictionCount} palpite{user.predictionCount !== 1 ? 's' : ''} · último acesso: {fmtLastLogin(user.lastLoginAt)}
        </Text>
      </View>

      {user.passwordChanged ? (
        <View style={[styles.badge, styles.badgeOk]}>
          <Ionicons name="checkmark-circle" size={13} color={Colors.success} />
          <Text style={[styles.badgeTxt, { color: Colors.success }]}>senha redefinida</Text>
        </View>
      ) : (
        <View style={[styles.badge, styles.badgePending]}>
          <Ionicons name="alert-circle-outline" size={13} color={Colors.accentGold} />
          <Text style={[styles.badgeTxt, { color: Colors.accentGold }]}>senha padrão</Text>
        </View>
      )}
    </View>
  );
}

export default function GerenciaUsuariosScreen(): React.JSX.Element {
  const router = useRouter();
  const [users, setUsers] = useState<UserStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (silent = false): Promise<void> => {
    if (!silent) setIsLoading(true);
    setError('');
    try {
      const data = await getUsersStatus();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuários.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const changed = users.filter((u) => u.passwordChanged).length;
  const pending = users.length - changed;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={22} color="#60A5FA" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Usuários</Text>
          <Text style={styles.subtitle}>Situação de senha e acesso</Text>
        </View>
      </View>

      {!isLoading && error === '' && (
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: Colors.success }]}>{changed}</Text>
            <Text style={styles.summaryLabel}>redefiniram a senha</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: Colors.accentGold }]}>{pending}</Text>
            <Text style={styles.summaryLabel}>com senha padrão</Text>
          </View>
        </View>
      )}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : error !== '' ? (
        <View style={styles.center}>
          <Text style={styles.errorTxt}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void load()} activeOpacity={0.8}>
            <Text style={styles.retryTxt}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: ListRenderItemInfo<UserStatus>) => <UserRow user={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                void load(true);
              }}
              tintColor="#3B82F6"
              colors={['#3B82F6']}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2D4A',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: '#60A5FA' },
  subtitle: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 1 },
  summaryBar: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2D4A',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold },
  summaryLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 1 },
  summaryDivider: { width: 1, backgroundColor: '#1A2D4A', marginVertical: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  errorTxt: { fontSize: FontSizes.sm, color: Colors.error, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md, backgroundColor: '#3B82F6',
  },
  retryTxt: { color: Colors.textPrimary, fontWeight: FontWeights.bold, fontSize: FontSizes.sm },
  list: { padding: Spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  cardLeft: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  nickname: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  meta: { fontSize: 11, color: Colors.textSecondary },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  badgeOk: { borderColor: 'rgba(34,197,94,0.35)', backgroundColor: 'rgba(34,197,94,0.08)' },
  badgePending: { borderColor: 'rgba(245,158,11,0.35)', backgroundColor: 'rgba(245,158,11,0.08)' },
  badgeTxt: { fontSize: 11, fontWeight: FontWeights.semibold },
});
