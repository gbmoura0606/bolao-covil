import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  FlatList,
  TextInput,
  Modal,
  ActivityIndicator,
  ListRenderItemInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import api from '@/services/api';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius, Shadows } from '@/constants/theme';

interface DbMatch {
  id: string;
  externalId: string | null;
  round: string;
  group: string | null;
  homeTeam: { id: string; name: string; flagEmoji: string } | null;
  awayTeam: { id: string; name: string; flagEmoji: string } | null;
  homeScore: number | null;
  awayScore: number | null;
  matchDate: string;
  status: string;
  venue: string | null;
}

function ScoreUpdateModal({
  match,
  onClose,
  onSaved,
}: {
  match: DbMatch;
  onClose: () => void;
  onSaved: () => void;
}): React.JSX.Element {
  const [homeScore, setHomeScore] = useState(match.homeScore?.toString() ?? '');
  const [awayScore, setAwayScore] = useState(match.awayScore?.toString() ?? '');
  const [status, setStatus] = useState<'OPEN' | 'CLOSED' | 'FINISHED'>(
    match.status as 'OPEN' | 'CLOSED' | 'FINISHED',
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(): Promise<void> {
    setError('');
    setIsSaving(true);
    try {
      const body: Record<string, unknown> = { status };
      if (homeScore !== '') body.homeScore = parseInt(homeScore, 10);
      if (awayScore !== '') body.awayScore = parseInt(awayScore, 10);
      await api.patch(`/api/matches/${match.id}/score`, body);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={ms.overlay}>
        <View style={ms.box}>
          <View style={ms.header}>
            <Text style={ms.title}>Atualizar Placar</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={ms.matchInfo}>
            <Text style={ms.teamName}>{match.homeTeam?.flagEmoji ?? ''} {match.homeTeam?.name ?? '?'}</Text>
            <Text style={ms.vs}>×</Text>
            <Text style={ms.teamName}>{match.awayTeam?.flagEmoji ?? ''} {match.awayTeam?.name ?? '?'}</Text>
          </View>

          <View style={ms.scoreRow}>
            <TextInput
              style={ms.scoreInput}
              value={homeScore}
              onChangeText={(v) => setHomeScore(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="–"
              placeholderTextColor={Colors.textSecondary}
            />
            <Text style={ms.scoreSep}>–</Text>
            <TextInput
              style={ms.scoreInput}
              value={awayScore}
              onChangeText={(v) => setAwayScore(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="–"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <Text style={ms.statusLabel}>Status</Text>
          <View style={ms.statusRow}>
            {(['OPEN', 'CLOSED', 'FINISHED'] as const).map((s) => (
              <TouchableOpacity
                key={s}
                style={[ms.statusBtn, status === s && ms.statusBtnActive]}
                onPress={() => setStatus(s)}
                activeOpacity={0.8}
              >
                <Text style={[ms.statusTxt, status === s && ms.statusTxtActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {error !== '' && <Text style={ms.error}>{error}</Text>}

          <TouchableOpacity
            style={[ms.saveBtn, isSaving && ms.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            {isSaving
              ? <ActivityIndicator size="small" color={Colors.background} />
              : <Text style={ms.saveTxt}>Salvar</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  box: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, width: '100%', borderWidth: 1, borderColor: Colors.border, ...Shadows.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  title: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  matchInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md, paddingHorizontal: Spacing.sm },
  teamName: { flex: 1, fontSize: 12, color: Colors.textPrimary, fontWeight: FontWeights.medium, textAlign: 'center' },
  vs: { fontSize: FontSizes.md, color: Colors.textSecondary, paddingHorizontal: Spacing.sm },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  scoreInput: { width: 64, height: 52, backgroundColor: Colors.backgroundAlt, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, fontSize: 24, fontWeight: FontWeights.bold, color: Colors.textPrimary, textAlign: 'center' },
  scoreSep: { fontSize: 22, color: Colors.textSecondary, fontWeight: FontWeights.bold },
  statusLabel: { fontSize: FontSizes.xs, fontWeight: FontWeights.semibold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.xs },
  statusRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.lg },
  statusBtn: { flex: 1, paddingVertical: 8, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  statusBtnActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  statusTxt: { fontSize: 11, fontWeight: FontWeights.semibold, color: Colors.textSecondary },
  statusTxtActive: { color: Colors.textPrimary },
  error: { fontSize: FontSizes.xs, color: Colors.error, marginBottom: Spacing.sm },
  saveBtn: { backgroundColor: '#3B82F6', borderRadius: BorderRadius.md, paddingVertical: Spacing.md, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveTxt: { color: Colors.textPrimary, fontWeight: FontWeights.bold, fontSize: FontSizes.md },
});

export default function GerenciaHomeScreen(): React.JSX.Element {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<DbMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingMatch, setEditingMatch] = useState<DbMatch | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'finished'>('upcoming');

  const loadMatches = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await api.get<DbMatch[]>('/api/matches');
      setMatches(res.data.filter((m) => m.homeTeam && m.awayTeam));
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

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

  const filtered = matches.filter((m) => {
    if (filter === 'upcoming') return m.status === 'OPEN' || m.status === 'CLOSED';
    if (filter === 'finished') return m.status === 'FINISHED';
    return true;
  });

  function renderMatch({ item }: ListRenderItemInfo<DbMatch>): React.JSX.Element {
    const hasScore = item.homeScore !== null && item.awayScore !== null;
    return (
      <TouchableOpacity style={styles.matchCard} onPress={() => setEditingMatch(item)} activeOpacity={0.8}>
        <View style={styles.matchLeft}>
          <View style={styles.matchTeams}>
            <Text style={styles.matchTeam} numberOfLines={1}>{item.homeTeam?.flagEmoji} {item.homeTeam?.name}</Text>
            <Text style={styles.matchSep}>×</Text>
            <Text style={styles.matchTeam} numberOfLines={1}>{item.awayTeam?.flagEmoji} {item.awayTeam?.name}</Text>
          </View>
          <Text style={styles.matchMeta}>{item.matchDate.substring(0, 10)} · {item.group ? `Grupo ${item.group}` : item.round.toUpperCase()}</Text>
        </View>
        <View style={styles.matchRight}>
          {hasScore
            ? <Text style={styles.matchScore}>{item.homeScore}–{item.awayScore}</Text>
            : <Text style={styles.matchNoScore}>–</Text>}
          <View style={[styles.statusDot, item.status === 'FINISHED' && styles.dotFinished, item.status === 'CLOSED' && styles.dotClosed]} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>🏢</Text>
          </View>
          <View>
            <Text style={styles.title}>Gerência do Setor</Text>
            <Text style={styles.subtitle}>Olá, {user?.nickname ?? ''}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterBar}>
        {(['upcoming', 'finished', 'all'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTxt, filter === f && styles.filterTxtActive]}>
              {f === 'upcoming' ? 'Próximos' : f === 'finished' ? 'Finalizados' : 'Todos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderMatch}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyTxt}>Nenhuma partida encontrada.</Text>
            </View>
          }
        />
      )}

      {editingMatch && (
        <ScoreUpdateModal
          match={editingMatch}
          onClose={() => setEditingMatch(null)}
          onSaved={() => void loadMatches()}
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2D4A',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(59,130,246,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#1E3A5F',
  },
  icon: { fontSize: 22 },
  title: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: '#60A5FA' },
  subtitle: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 1 },
  logoutBtn: { padding: Spacing.sm },
  filterBar: {
    flexDirection: 'row',
    gap: Spacing.xs,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2D4A',
  },
  filterBtn: {
    flex: 1, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: '#1E3A5F',
    alignItems: 'center',
  },
  filterBtnActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  filterTxt: { fontSize: FontSizes.xs, fontWeight: FontWeights.semibold, color: Colors.textSecondary },
  filterTxtActive: { color: Colors.textPrimary },
  list: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  emptyTxt: { color: Colors.textSecondary, fontSize: FontSizes.sm },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  matchLeft: { flex: 1 },
  matchTeams: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 3 },
  matchTeam: { flex: 1, fontSize: 13, color: Colors.textPrimary, fontWeight: FontWeights.medium },
  matchSep: { fontSize: 11, color: Colors.textSecondary },
  matchMeta: { fontSize: 11, color: Colors.textSecondary },
  matchRight: { alignItems: 'flex-end', gap: 4 },
  matchScore: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: '#60A5FA' },
  matchNoScore: { fontSize: FontSizes.md, color: Colors.textSecondary },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accentGold },
  dotFinished: { backgroundColor: Colors.success },
  dotClosed: { backgroundColor: Colors.error },
});
