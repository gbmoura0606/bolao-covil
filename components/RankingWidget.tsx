import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Platform, ScrollView } from 'react-native';
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
  const [expanded, setExpanded] = useState(false);

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
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="trophy-outline" size={13} color={Colors.accentGold} />
          <Text style={styles.headerTitle}>Ranking Parcial</Text>
          <ActivityIndicator size="small" color={Colors.accentGold} style={styles.loadingIndicator} />
        </View>
      </View>
    );
  }

  if (players.length === 0) return <View />;

  const myIdx = players.findIndex((p) => p.id === user?.id);
  const myPlayer = myIdx >= 0 ? players[myIdx] : null;

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

  const rankLabel = myPlayer
    ? (myIdx < 3 ? MEDAL[myIdx] : `#${myIdx + 1}`)
    : null;

  const webStyle = Platform.OS === 'web' ? styles.webCursor : undefined;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.header, webStyle]}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.75}
      >
        <Ionicons name="trophy-outline" size={13} color={Colors.accentGold} />
        <Text style={styles.headerTitle}>Ranking Parcial</Text>

        {!expanded && myPlayer && (
          <View style={styles.badge}>
            <Text style={styles.badgeRank}>{rankLabel}</Text>
            <Text style={styles.badgePts}>{myPlayer.points} pts</Text>
          </View>
        )}

        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={Colors.textSecondary}
          style={styles.chevron}
        />
      </TouchableOpacity>

      {expanded && (
        <ScrollView style={styles.list} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          {players.map((p, i) => renderRow(p, i))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  },
  headerTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
  },
  badgeRank: {
    fontSize: FontSizes.sm,
    color: Colors.accentGold,
    fontWeight: FontWeights.bold,
  },
  badgePts: {
    fontSize: FontSizes.xs,
    color: Colors.accentGold,
    fontWeight: FontWeights.medium,
  },
  chevron: {
    marginLeft: 2,
  },
  loadingIndicator: {
    marginLeft: 4,
  },
  list: {
    maxHeight: 320,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(55,65,81,0.3)',
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
  webCursor: { cursor: 'pointer' } as object,
});
