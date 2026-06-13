import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/hooks/useAuth';
import { getUserLeagues } from '@/services/leagues';
import { getLeagueRanking } from '@/services/ranking';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import type { League, Player } from '@/types';

const COVIL_CODE = 'COVILCVL';
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

export default function LigaScreen(): React.JSX.Element {
  const { user } = useAuth();
  const [league, setLeague] = useState<League | null>(null);
  const [ranking, setRanking] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (silent = false): Promise<void> => {
    if (!silent) setIsLoading(true);
    setError('');
    try {
      const leagues = await getUserLeagues();
      const covil = leagues.find((l) => l.code === COVIL_CODE);
      if (!covil) { setError('Liga não encontrada.'); return; }
      const rank = await getLeagueRanking(covil.id);
      setLeague(covil);
      setRanking(rank);
    } catch {
      setError('Erro ao carregar ranking.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const id = setInterval(() => void load(true), 30_000);
    return () => clearInterval(id);
  }, [load]);

  function handleRefresh(): void {
    setIsRefreshing(true);
    void load(true);
  }

  const leader = ranking[0];
  const myIdx = ranking.findIndex((p) => p.id === user?.id);
  const myEntry = myIdx !== -1 ? ranking[myIdx] : null;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Covil da Liga"
        subtitle={league ? `${league.participantCount} participantes` : 'Ranking'}
      />

      {isLoading && !isRefreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accentGold} />
          <Text style={styles.loadingText}>Carregando ranking...</Text>
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

          {/* Scoring chips */}
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
              Pontuação atualiza em tempo real a cada placar salvo pelo administrador.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundAlt },
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
