import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { getLeagueById, updateLeagueScoring } from '@/services/leagues';
import { getLeagueRanking } from '@/services/ranking';
import type { League, Player } from '@/types';

// ─── Position Badge ───────────────────────────────────────────────────────────

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

function PositionBadge({ pos }: { pos: number }): React.JSX.Element {
  const color = pos <= 3 ? MEDAL_COLORS[pos - 1] : undefined;
  if (color) {
    return (
      <View style={[rowS.medalCircle, { borderColor: color }]}>
        <Text style={[rowS.medalText, { color }]}>{pos}</Text>
      </View>
    );
  }
  return (
    <View style={rowS.posCircle}>
      <Text style={rowS.posText}>{pos}º</Text>
    </View>
  );
}

// ─── Participant Row ──────────────────────────────────────────────────────────

function ParticipantRow({
  player, position, isCurrentUser,
}: { player: Player; position: number; isCurrentUser: boolean }): React.JSX.Element {
  return (
    <View style={[rowS.row, isCurrentUser && rowS.rowHighlight]}>
      <PositionBadge pos={position} />
      <View style={rowS.nameCol}>
        <Text style={[rowS.name, isCurrentUser && rowS.nameSelf]} numberOfLines={1}>
          {player.name}
        </Text>
        {isCurrentUser && <Text style={rowS.youLabel}>você</Text>}
      </View>
      <View style={rowS.stat}>
        <Text style={rowS.statValue}>{player.exactMatches}</Text>
        <Text style={rowS.statLabel}>exatos</Text>
      </View>
      <View style={rowS.pointsCol}>
        <Text style={[rowS.points, isCurrentUser && rowS.pointsSelf]}>{player.points}</Text>
        <Text style={rowS.ptLabel}>pts</Text>
      </View>
    </View>
  );
}

const rowS = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(55,65,81,0.4)',
    gap: Spacing.sm,
  },
  rowHighlight: {
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderBottomColor: Colors.accentGold,
  },
  medalCircle: {
    width: 30, height: 30, borderRadius: 15, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  medalText: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold },
  posCircle: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  posText: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: FontWeights.semibold },
  nameCol: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  name: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium, color: Colors.textPrimary },
  nameSelf: { fontWeight: FontWeights.bold, color: Colors.accentGold },
  youLabel: {
    fontSize: 10, color: Colors.accentGold,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: BorderRadius.sm, paddingHorizontal: 4, paddingVertical: 1,
    fontWeight: FontWeights.semibold,
  },
  stat: { alignItems: 'center', width: 44 },
  statValue: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  statLabel: { fontSize: 9, color: Colors.textSecondary },
  pointsCol: { alignItems: 'flex-end', minWidth: 48 },
  points: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  pointsSelf: { color: Colors.accentGold },
  ptLabel: { fontSize: 9, color: Colors.textSecondary },
});

// ─── Scoring Config Panel ─────────────────────────────────────────────────────

interface ScoringConfig {
  scoreResult: number;
  scoreGoalDiff: number;
  scoreExact: number;
}

function ScoringPanel({
  leagueId,
  initial,
  onSaved,
}: {
  leagueId: string;
  initial: ScoringConfig;
  onSaved: (next: ScoringConfig) => void;
}): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ScoringConfig>(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const ROWS: { key: keyof ScoringConfig; label: string; hint: string }[] = [
    { key: 'scoreResult',   label: 'Vencedor / Empate', hint: 'acertou quem venceu ou que empatou' },
    { key: 'scoreGoalDiff', label: 'Saldo de Gols',     hint: 'acertou a diferença de gols' },
    { key: 'scoreExact',    label: 'Placar Exato',       hint: 'acertou o placar exato' },
  ];

  function setVal(key: keyof ScoringConfig, raw: string): void {
    const n = parseInt(raw, 10);
    setDraft((prev) => ({ ...prev, [key]: isNaN(n) ? 0 : Math.min(99, Math.max(0, n)) }));
  }

  async function save(): Promise<void> {
    if (draft.scoreResult > draft.scoreGoalDiff || draft.scoreGoalDiff > draft.scoreExact) {
      setError('Os pontos devem ser: Vencedor ≤ Saldo ≤ Exato.');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      await updateLeagueScoring(leagueId, draft);
      onSaved(draft);
      setOpen(false);
    } catch {
      setError('Falha ao salvar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={spS.container}>
      <TouchableOpacity style={spS.header} onPress={() => setOpen((o) => !o)} activeOpacity={0.8}>
        <View style={spS.headerLeft}>
          <Ionicons name="settings-outline" size={14} color={Colors.accentGold} />
          <Text style={spS.headerTitle}>Configuração de Pontuação</Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textSecondary} />
      </TouchableOpacity>

      {open && (
        <View style={spS.body}>
          {ROWS.map(({ key, label, hint }) => (
            <View key={key} style={spS.row}>
              <View style={spS.rowText}>
                <Text style={spS.rowLabel}>{label}</Text>
                <Text style={spS.rowHint}>{hint}</Text>
              </View>
              <View style={spS.inputWrap}>
                <TextInput
                  style={spS.input}
                  value={String(draft[key])}
                  onChangeText={(v) => setVal(key, v)}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                />
                <Text style={spS.pts}>pts</Text>
              </View>
            </View>
          ))}

          {error !== '' && <Text style={spS.error}>{error}</Text>}

          <TouchableOpacity
            style={[spS.saveBtn, isSaving && spS.saveBtnDisabled]}
            onPress={() => void save()}
            activeOpacity={0.8}
            disabled={isSaving}
          >
            {isSaving
              ? <ActivityIndicator size="small" color={Colors.background} />
              : <Text style={spS.saveBtnText}>Salvar</Text>
            }
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const spS = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundAlt,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  headerTitle: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.textPrimary },
  body: { padding: Spacing.md, gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rowText: { flex: 1 },
  rowLabel: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium, color: Colors.textPrimary },
  rowHint: { fontSize: 10, color: Colors.textSecondary, marginTop: 1 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  input: {
    width: 44, height: 36, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.sm, backgroundColor: Colors.backgroundAlt,
    color: Colors.textPrimary, fontSize: FontSizes.md, fontWeight: FontWeights.bold,
    textAlign: 'center',
  },
  pts: { fontSize: 11, color: Colors.textSecondary },
  error: { fontSize: 11, color: Colors.error, marginTop: 2 },
  saveBtn: {
    backgroundColor: Colors.accentGold, borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm, alignItems: 'center', marginTop: Spacing.xs,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.background, fontWeight: FontWeights.bold, fontSize: FontSizes.sm },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LigaRankingScreen(): React.JSX.Element {
  const router = useRouter();
  const { leagueId } = useLocalSearchParams<{ leagueId: string }>();
  const { user } = useAuth();

  const [league, setLeague] = useState<(League & { ownerNickname: string }) | null>(null);
  const [ranking, setRanking] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (silent = false): Promise<void> => {
    if (!leagueId) return;
    if (!silent) setIsLoading(true);
    setError('');
    try {
      const [lg, rank] = await Promise.all([
        getLeagueById(leagueId),
        getLeagueRanking(leagueId),
      ]);
      setLeague(lg);
      setRanking(rank);
    } catch {
      setError('Erro ao carregar dados da liga.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [leagueId]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleRefresh(): void {
    setIsRefreshing(true);
    void load(true);
  }

  const isOwner = user !== null && league !== null && user.id === league.ownerId;
  const leader = ranking[0];
  const myIdx = ranking.findIndex((p) => p.id === user?.id);
  const myEntry = myIdx !== -1 ? ranking[myIdx] : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.accentGold} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {league?.name ?? 'Liga'}
          </Text>
          <Text style={styles.headerSubtitle}>Ranking da liga</Text>
        </View>
      </View>

      {isLoading && !isRefreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accentGold} />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      ) : error !== '' ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void load()} activeOpacity={0.8}>
            <Text style={styles.retryTxt}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.accentGold}
              colors={[Colors.accentGold]}
            />
          }
        >
          {/* Summary bar */}
          {league !== null && (
            <View style={styles.summaryBar}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{league.participantCount}</Text>
                <Text style={styles.summaryLabel}>participantes</Text>
              </View>
              {leader !== undefined && (
                <>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue} numberOfLines={1}>{leader.name}</Text>
                    <Text style={styles.summaryLabel}>líder · {leader.points}pts</Text>
                  </View>
                </>
              )}
              {myEntry !== null && (
                <>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: Colors.accentGold }]}>
                      {myIdx + 1}º
                    </Text>
                    <Text style={styles.summaryLabel}>sua posição</Text>
                  </View>
                </>
              )}
            </View>
          )}

          {/* Scoring info chips */}
          {league !== null && (
            <View style={styles.scoringBar}>
              <View style={styles.scoringChip}>
                <Text style={styles.scoringChipLabel}>Vencedor</Text>
                <Text style={styles.scoringChipValue}>{league.scoreResult}pt</Text>
              </View>
              <View style={styles.scoringChip}>
                <Text style={styles.scoringChipLabel}>Saldo</Text>
                <Text style={styles.scoringChipValue}>{league.scoreGoalDiff}pt</Text>
              </View>
              <View style={styles.scoringChip}>
                <Text style={styles.scoringChipLabel}>Exato</Text>
                <Text style={styles.scoringChipValue}>{league.scoreExact}pt</Text>
              </View>
            </View>
          )}

          {/* Scoring config — only for owner */}
          {isOwner && league !== null && (
            <ScoringPanel
              leagueId={league.id}
              initial={{ scoreResult: league.scoreResult, scoreGoalDiff: league.scoreGoalDiff, scoreExact: league.scoreExact }}
              onSaved={(next) => setLeague((prev) => prev !== null ? { ...prev, ...next } : prev)}
            />
          )}

          {/* Table header */}
          <View style={styles.tableHeader}>
            <View style={{ width: 30 }} />
            <Text style={[styles.colHeader, { flex: 1, marginLeft: Spacing.sm }]}>Participante</Text>
            <Text style={[styles.colHeader, { width: 44, textAlign: 'center' }]}>Exatos</Text>
            <Text style={[styles.colHeader, { width: 56, textAlign: 'right' }]}>Pontos</Text>
          </View>

          {ranking.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={40} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>Nenhum palpite contabilizado ainda.</Text>
            </View>
          ) : (
            ranking.map((p, i) => (
              <ParticipantRow
                key={p.id}
                player={p}
                position={i + 1}
                isCurrentUser={p.id === user?.id}
              />
            ))
          )}

          <View style={styles.notice}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.noticeText}>
              Pontuação parcial — atualiza após cada jogo encerrado.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundAlt },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.backgroundAlt,
    gap: Spacing.sm,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  headerTitle: {
    fontSize: FontSizes.xl, fontWeight: FontWeights.bold,
    color: Colors.textPrimary, letterSpacing: 0.5,
  },
  headerSubtitle: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: FontWeights.medium },
  errorText: { fontSize: FontSizes.md, color: Colors.error, textAlign: 'center', paddingHorizontal: Spacing.xl },
  retryBtn: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md, backgroundColor: Colors.accentGold,
  },
  retryTxt: { color: Colors.background, fontWeight: FontWeights.bold, fontSize: FontSizes.sm },
  list: { paddingBottom: Spacing.xxl },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  summaryLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 1 },
  summaryDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 2 },
  scoringBar: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundAlt,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  scoringChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  scoringChipLabel: { fontSize: 10, color: Colors.textSecondary },
  scoringChipValue: { fontSize: 10, fontWeight: FontWeights.bold, color: Colors.accentGold },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2030',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  colHeader: {
    fontSize: 10, fontWeight: FontWeights.semibold,
    color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  empty: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.xxl, gap: Spacing.md, paddingHorizontal: Spacing.xl,
  },
  emptyText: { fontSize: FontSizes.md, color: Colors.textSecondary, textAlign: 'center' },
  notice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    margin: Spacing.md, padding: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  noticeText: { flex: 1, fontSize: 11, color: Colors.textSecondary, lineHeight: 16 },
});
