import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator,
  TouchableOpacity, RefreshControl, ListRenderItemInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getBracketAdminStatus, type BracketAdminStatus } from '@/services/bracketPredictions';
import { BRACKET_LOCK_LABEL } from '@/constants/bracket';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius, Shadows } from '@/constants/theme';

function fmtUpdated(iso: string | null): string {
  if (!iso) return 'nunca';
  const d = new Date(iso);
  const mins = Math.floor((Date.now() - d.getTime()) / 60_000);
  if (mins < 1) return 'agora mesmo';
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'ontem' : `há ${days} dias`;
}

function UserRow({ u }: { u: BracketAdminStatus }): React.JSX.Element {
  const pct = Math.round((u.done / u.total) * 100);
  const started = u.done > 0;
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.nick} numberOfLines={1}>{u.nickname}</Text>
        {u.complete ? (
          <View style={[styles.badge, styles.badgeOk]}>
            <Ionicons name="checkmark-circle" size={13} color={Colors.success} />
            <Text style={[styles.badgeTxt, { color: Colors.success }]}>completa</Text>
          </View>
        ) : started ? (
          <View style={[styles.badge, styles.badgePartial]}>
            <Ionicons name="time-outline" size={13} color={Colors.accentGold} />
            <Text style={[styles.badgeTxt, { color: Colors.accentGold }]}>{u.done}/{u.total}</Text>
          </View>
        ) : (
          <View style={[styles.badge, styles.badgeNone]}>
            <Ionicons name="alert-circle-outline" size={13} color={Colors.error} />
            <Text style={[styles.badgeTxt, { color: Colors.error }]}>não iniciou</Text>
          </View>
        )}
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: u.complete ? Colors.success : Colors.accentGold }]} />
      </View>
      <Text style={styles.meta}>{u.done} de {u.total} escolhas · atualizado {fmtUpdated(u.updatedAt)}</Text>
    </View>
  );
}

export default function GerenciaPrevisoesScreen(): React.JSX.Element {
  const router = useRouter();
  const [users, setUsers] = useState<BracketAdminStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError('');
    try {
      setUsers(await getBracketAdminStatus());
    } catch {
      setError('Erro ao carregar a situação das previsões.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Incompletos primeiro (não iniciou → parcial → completo), depois alfabético.
  const sorted = [...users].sort((a, b) => {
    const rank = (u: BracketAdminStatus) => (u.complete ? 2 : u.done > 0 ? 1 : 0);
    return rank(a) - rank(b) || a.nickname.localeCompare(b.nickname);
  });
  const completos = users.filter(u => u.complete).length;
  const iniciaram = users.filter(u => u.done > 0 && !u.complete).length;
  const naoIniciaram = users.filter(u => u.done === 0).length;

  function renderItem({ item }: ListRenderItemInfo<BracketAdminStatus>): React.JSX.Element {
    return <UserRow u={item} />;
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#60A5FA" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Previsões do Bolão</Text>
          <Text style={styles.subtitle}>Quem já preencheu o chaveamento</Text>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => void load()} activeOpacity={0.7}>
          <Ionicons name="refresh" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {!isLoading && (
        <View style={styles.summary}>
          <View style={styles.sumItem}><Text style={[styles.sumVal, { color: Colors.success }]}>{completos}</Text><Text style={styles.sumLbl}>completas</Text></View>
          <View style={styles.sumDiv} />
          <View style={styles.sumItem}><Text style={[styles.sumVal, { color: Colors.accentGold }]}>{iniciaram}</Text><Text style={styles.sumLbl}>parciais</Text></View>
          <View style={styles.sumDiv} />
          <View style={styles.sumItem}><Text style={[styles.sumVal, { color: Colors.error }]}>{naoIniciaram}</Text><Text style={styles.sumLbl}>não iniciaram</Text></View>
        </View>
      )}

      <View style={styles.notice}>
        <Ionicons name="information-circle-outline" size={13} color={Colors.textSecondary} />
        <Text style={styles.noticeTxt}>A previsão fecha em {BRACKET_LOCK_LABEL}. Use isto para lembrar quem ainda não preencheu.</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#3B82F6" /></View>
      ) : error !== '' ? (
        <View style={styles.center}>
          <Text style={styles.errorTxt}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void load()}><Text style={styles.retryTxt}>Tentar novamente</Text></TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(u) => u.userId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); void load(true); }} tintColor="#3B82F6" colors={['#3B82F6']} />
          }
          ListEmptyComponent={<View style={styles.center}><Text style={styles.meta}>Nenhum usuário encontrado.</Text></View>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: '#1A2D4A',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: '#60A5FA' },
  subtitle: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 1 },
  summary: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: '#1A2D4A',
  },
  sumItem: { flex: 1, alignItems: 'center' },
  sumVal: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold },
  sumLbl: { fontSize: 10, color: Colors.textSecondary, marginTop: 1 },
  sumDiv: { width: 1, height: 28, backgroundColor: '#1A2D4A' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  noticeTxt: { flex: 1, fontSize: 11, color: Colors.textSecondary, lineHeight: 15 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, gap: Spacing.md },
  errorTxt: { color: Colors.error, fontSize: FontSizes.sm, textAlign: 'center' },
  retryBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: '#3B82F6' },
  retryTxt: { color: Colors.textPrimary, fontWeight: FontWeights.bold, fontSize: FontSizes.sm },
  list: { padding: Spacing.md, gap: Spacing.sm },
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadows.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  nick: { flex: 1, fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.sm, borderWidth: 1 },
  badgeOk: { borderColor: Colors.success, backgroundColor: 'rgba(34,197,94,0.10)' },
  badgePartial: { borderColor: Colors.accentGold, backgroundColor: 'rgba(245,158,11,0.10)' },
  badgeNone: { borderColor: Colors.error, backgroundColor: 'rgba(239,68,68,0.10)' },
  badgeTxt: { fontSize: 10, fontWeight: FontWeights.bold },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: Colors.backgroundAlt, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  meta: { fontSize: 11, color: Colors.textSecondary, marginTop: 5 },
});
