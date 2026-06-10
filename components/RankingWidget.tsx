import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { getRanking } from '@/services/ranking';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import type { Player } from '@/types';

interface RankingWidgetProps {
  refreshKey?: number;
}

const MEDAL = ['🥇', '🥈', '🥉'];

export function RankingWidget({ refreshKey = 0 }: RankingWidgetProps): React.JSX.Element {
  const { user } = useAuth();
  const [players, setPlayers] = useState<(Player & { isCurrentUser: boolean })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    try {
      const data = await getRanking();
      setPlayers(data.map((p) => ({ ...p, isCurrentUser: p.id === user?.id })));
    } catch {
      // Ranking failure is non-critical
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const myIdx = players.findIndex((p) => p.isCurrentUser);
  const myPlayer = myIdx !== -1 ? players[myIdx] : null;
  const displayPlayers = players.slice(0, expanded ? 20 : 5);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color={Colors.accentGold} />
      </View>
    );
  }
  if (players.length === 0) return <View />;

  return (
    <View style={styles.container}>
      {/* Header — sempre visível, tap para expandir */}
      <TouchableOpacity style={styles.header} onPress={() => setExpanded((e) => !e)} activeOpacity={0.8}>
        <View style={styles.headerLeft}>
          <Ionicons name="trophy-outline" size={14} color={Colors.accentGold} />
          <Text style={styles.headerTitle}>Ranking Parcial</Text>
        </View>
        <View style={styles.headerRight}>
          {myPlayer !== null && (
            <View style={styles.myChip}>
              <Text style={styles.myChipText}>
                #{myIdx + 1} · {myPlayer.points} pts
              </Text>
            </View>
          )}
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={Colors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <ScrollView scrollEnabled={false} style={styles.table}>
          {/* Header columns */}
          <View style={styles.tableHeader}>
            <Text style={[styles.hCol, styles.rankCol]}>#</Text>
            <Text style={[styles.hCol, styles.nameCol]}>Jogador</Text>
            <Text style={[styles.hCol, styles.numCol]}>Pts</Text>
            <Text style={[styles.hCol, styles.numCol]}>Exatos</Text>
          </View>

          {displayPlayers.map((p, i) => (
            <View key={p.id} style={[styles.row, p.isCurrentUser && styles.rowMe]}>
              <Text style={[styles.rankTxt, i < 3 && styles.rankTop]}>
                {i < 3 ? MEDAL[i] : String(i + 1)}
              </Text>
              <Text
                style={[styles.nameTxt, p.isCurrentUser && styles.nameTxtMe]}
                numberOfLines={1}
              >
                {p.name}
              </Text>
              <Text style={[styles.numTxt, p.isCurrentUser && styles.numTxtMe]}>{p.points}</Text>
              <Text style={styles.numTxt}>{p.exactMatches}✓</Text>
            </View>
          ))}

          {/* Se o usuário não está no top 5, mostra separador + posição dele */}
          {myIdx >= 5 && myPlayer !== null && (
            <>
              <View style={styles.ellipsisRow}>
                <Text style={styles.ellipsisTxt}>·  ·  ·</Text>
              </View>
              <View style={[styles.row, styles.rowMe]}>
                <Text style={styles.rankTxt}>#{myIdx + 1}</Text>
                <Text style={[styles.nameTxt, styles.nameTxtMe]} numberOfLines={1}>
                  {myPlayer.name}
                </Text>
                <Text style={[styles.numTxt, styles.numTxtMe]}>{myPlayer.points}</Text>
                <Text style={styles.numTxt}>{myPlayer.exactMatches}✓</Text>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  container: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
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
  headerTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  myChip: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  myChipText: {
    fontSize: 11,
    fontWeight: FontWeights.bold,
    color: Colors.accentGold,
  },
  table: { maxHeight: 300 },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    backgroundColor: '#1a2030',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  hCol: {
    fontSize: 10,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  rankCol: { width: 36, textAlign: 'center' },
  nameCol: { flex: 1 },
  numCol: { width: 44, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(55,65,81,0.4)',
  },
  rowMe: { backgroundColor: 'rgba(245,158,11,0.07)' },
  rankTxt: { width: 36, fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  rankTop: { color: Colors.textPrimary },
  nameTxt: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
  },
  nameTxtMe: { color: Colors.accentGold, fontWeight: FontWeights.bold },
  numTxt: { width: 44, fontSize: FontSizes.sm, color: Colors.textSecondary, textAlign: 'center' },
  numTxtMe: { color: Colors.accentGold, fontWeight: FontWeights.bold },
  ellipsisRow: { paddingVertical: 4, alignItems: 'center' },
  ellipsisTxt: { fontSize: 12, color: Colors.border, letterSpacing: 4 },
});
