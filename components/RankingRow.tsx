import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import type { Player } from '@/types';

interface RankingRowProps {
  player: Player;
  position: number;
}

const MEDALS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

export function RankingRow({ player, position }: RankingRowProps): React.JSX.Element {
  const medal = MEDALS[position];
  const isUser = player.isCurrentUser === true;

  return (
    <View style={[styles.row, isUser && styles.rowHighlighted]}>
      <View style={styles.positionCell}>
        {medal ? (
          <Text style={styles.medal}>{medal}</Text>
        ) : (
          <Text style={[styles.position, isUser && styles.positionUser]}>{position}</Text>
        )}
      </View>

      <View style={styles.nameCell}>
        <Text style={[styles.name, isUser && styles.nameUser]} numberOfLines={1}>
          {player.name}
        </Text>
        {isUser && <Text style={styles.youBadge}>Você</Text>}
      </View>

      <View style={styles.statsCell}>
        <Text style={[styles.points, isUser && styles.pointsUser]}>{player.points}</Text>
        <Text style={styles.statsLabel}>pts</Text>
      </View>

      <View style={styles.statsCell}>
        <Text style={styles.statValue}>{player.exactMatches}</Text>
        <Text style={styles.statsLabel}>exatos</Text>
      </View>

      <View style={styles.statsCell}>
        <Text style={styles.statValue}>{player.winRate}%</Text>
        <Text style={styles.statsLabel}>aproveit.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  rowHighlighted: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.accentGold,
  },
  positionCell: {
    width: 36,
    alignItems: 'center',
  },
  medal: {
    fontSize: FontSizes.lg,
  },
  position: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textSecondary,
  },
  positionUser: {
    color: Colors.accentGold,
  },
  nameCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingRight: Spacing.sm,
  },
  name: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  nameUser: {
    color: Colors.accentGold,
    fontWeight: FontWeights.semibold,
  },
  youBadge: {
    fontSize: FontSizes.xs,
    color: Colors.accentGold,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
    fontWeight: FontWeights.semibold,
  },
  statsCell: {
    width: 54,
    alignItems: 'center',
  },
  points: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  pointsUser: {
    color: Colors.accentGold,
  },
  statValue: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  statsLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 1,
  },
});
