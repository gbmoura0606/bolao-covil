import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import type { League } from '@/types';

interface LeagueCardProps {
  league: League;
  onPress?: () => void;
  onConfigPress?: () => void;
}

function getPositionLabel(pos: number): string {
  return `${pos}º lugar`;
}

export function LeagueCard({ league, onPress, onConfigPress }: LeagueCardProps): React.JSX.Element {
  const diff =
    league.firstPlacePoints !== undefined && league.userPoints !== undefined
      ? league.firstPlacePoints - league.userPoints
      : undefined;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      {/* Top row: emoji + name + config button */}
      <View style={styles.topRow}>
        <View style={styles.emojiWrapper}>
          <Text style={styles.emoji}>{league.emoji ?? '🏆'}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{league.name}</Text>
          <Text style={styles.code}>{league.code}</Text>
        </View>

        <TouchableOpacity
          style={styles.configBtn}
          onPress={onConfigPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.configText}>Config</Text>
        </TouchableOpacity>
      </View>

      {/* Stats row: participants + position */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons name="people" size={14} color={Colors.textSecondary} />
          <Text style={styles.statText}>{league.participantCount} participantes</Text>
        </View>
        {league.userPosition !== undefined && (
          <View style={styles.positionBadge}>
            <Text style={styles.positionText}>{getPositionLabel(league.userPosition)}</Text>
          </View>
        )}
      </View>

      {/* Points info */}
      {league.userPoints !== undefined && (
        <View style={styles.pointsRow}>
          <View style={styles.pointsItem}>
            <Text style={styles.pointsLabel}>Seus pontos</Text>
            <Text style={styles.pointsValue}>{league.userPoints}</Text>
          </View>

          {diff !== undefined && diff > 0 && (
            <View style={styles.pointsItem}>
              <Text style={styles.pointsLabel}>Distância pro 1º</Text>
              <Text style={[styles.pointsValue, styles.diffValue]}>−{diff}</Text>
            </View>
          )}
          {diff === 0 && (
            <View style={styles.pointsItem}>
              <Text style={styles.pointsLabel}>Distância pro 1º</Text>
              <Text style={[styles.pointsValue, styles.leadValue]}>Líder!</Text>
            </View>
          )}

          {league.firstPlaceName !== undefined && (
            <View style={styles.pointsItem}>
              <Text style={styles.pointsLabel}>Líder</Text>
              <Text style={styles.pointsValue}>{league.firstPlaceName}</Text>
            </View>
          )}
        </View>
      )}

      {/* Arrow hint */}
      {onPress && (
        <View style={styles.arrowRow}>
          <Text style={styles.arrowHint}>Ver ranking da liga</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.accentGold} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  emojiWrapper: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  emoji: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  code: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  configBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundAlt,
  },
  configText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  positionBadge: {
    backgroundColor: 'rgba(6, 95, 70, 0.4)',
    borderWidth: 1,
    borderColor: Colors.darkGreen,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  positionText: {
    fontSize: FontSizes.xs,
    color: Colors.success,
    fontWeight: FontWeights.semibold,
  },
  pointsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    gap: 0,
    marginBottom: Spacing.sm,
  },
  pointsItem: {
    flex: 1,
    alignItems: 'center',
  },
  pointsLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 2,
    textAlign: 'center',
  },
  pointsValue: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  diffValue: {
    color: Colors.error,
  },
  leadValue: {
    color: Colors.success,
  },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 2,
  },
  arrowHint: {
    fontSize: 11,
    color: Colors.accentGold,
    fontWeight: FontWeights.medium,
  },
});
