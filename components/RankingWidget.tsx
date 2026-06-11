import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
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
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (): Promise<void> => {
    try {
      const data = await getRanking();
      setPlayers(data);
    } catch {
      // non-critical
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color={Colors.accentGold} />
      </View>
    );
  }
  if (players.length === 0) return <View />;

  const myIdx = players.findIndex((p) => p.id === user?.id);
  const inTop3 = myIdx >= 0 && myIdx <= 2;

  // Rows: always 1st + 2nd, then 3rd if user is top-3, else user's own row
  const top2 = players.slice(0, Math.min(2, players.length));
  const thirdRow = inTop3
    ? (players[2] ?? null)
    : (myIdx >= 0 ? players[myIdx] : (players[2] ?? null));
  const showEllipsis = !inTop3 && myIdx > 2;

  function renderRow(p: Player, rank: number): React.JSX.Element {
    const isMe = p.id === user?.id;
    return (
      <View key={p.id} style={[styles.row, isMe && styles.rowMe]}>
        <Text style={[styles.rankTxt, rank < 3 && styles.rankMedal]}>
          {rank < 3 ? MEDAL[rank] : `#${rank + 1}`}
        </Text>
        <Text style={[styles.nameTxt, isMe && styles.nameTxtMe]} numberOfLines={1}>
          {p.name}
        </Text>
        <Text style={[styles.ptsTxt, isMe && styles.ptsTxtMe]}>{p.points} pts</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="trophy-outline" size={13} color={Colors.accentGold} />
        <Text style={styles.headerTitle}>Ranking Parcial</Text>
      </View>

      {top2.map((p, i) => renderRow(p, i))}

      {showEllipsis && (
        <View style={styles.ellipsisRow}>
          <Text style={styles.ellipsisTxt}>·  ·  ·</Text>
        </View>
      )}

      {thirdRow !== null && renderRow(thirdRow, inTop3 ? 2 : myIdx)}
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
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundAlt,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(55,65,81,0.3)',
  },
  rowMe: { backgroundColor: 'rgba(245,158,11,0.07)' },
  rankTxt: { width: 36, fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  rankMedal: { color: Colors.textPrimary },
  nameTxt: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
  },
  nameTxtMe: { color: Colors.accentGold, fontWeight: FontWeights.bold },
  ptsTxt: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: FontWeights.medium },
  ptsTxtMe: { color: Colors.accentGold, fontWeight: FontWeights.bold },
  ellipsisRow: { paddingVertical: 3, alignItems: 'center' },
  ellipsisTxt: { fontSize: 11, color: Colors.border, letterSpacing: 4 },
});
