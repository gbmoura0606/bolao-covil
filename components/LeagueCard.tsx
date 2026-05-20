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

export function LeagueCard({ league, onPress, onConfigPress }: LeagueCardProps): React.JSX.Element {
  const diff =
    league.firstPlacePoints !== undefined && league.userPoints !== undefined
      ? league.firstPlacePoints - league.userPoints
      : undefined;

  const leaderLabel =
    league.firstPlaceName !== undefined && league.firstPlacePoints !== undefined
      ? `${league.firstPlaceName} · ${league.firstPlacePoints}pts`
      : league.firstPlaceName;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      {/* Top row: emoji + name + config button */}
      <View style={styles.topRow}>
        {/* Emoji with position badge overlay */}
        <View style={styles.emojiOuter}>
          <View style={styles.emojiWrapper}>
            <Text style={styles.emoji}>{league.emoji ?? '🏆'}</Text>
          </View>
          {league.userPosition !== undefined && (
            <View style={styles.positionOverlay}>
              <Text style={styles.positionOverlayText}>{league.userPosition}º</Text>
            </View>
          )}
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

      {/* Stats row: participants only (position moved to badge) */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons name="people" size={14} color={Colors.textSecondary} />
          <Text style={styles.statText}>{league.participantCount} participantes</Text>
        </View>
      </View>

      {/* Points info: Seus pontos | Líder | Distância pro 1º */}
      {league.userPoints !== undefined && (
        <View style={styles.pointsRow}>
          <View style={styles.pointsItem}>
            <Text style={styles.pointsLabel}>Seus pontos</Text>
            <Text style={styles.pointsValue}>{league.userPoints}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.pointsItem}>
            <Text style={styles.pointsLabel}>Líder</Text>
            {diff === 0 ? (
              <Text style={[styles.pointsValue, styles.leadValue]}>Você!</Text>
            ) : (
              <Text style={styles.pointsValue} numberOfLines={1}>{leaderLabel}</Text>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.pointsItem}>
            <Text style={styles.pointsLabel}>Distância pro 1º</Text>
            {diff === 0 ? (
              <Text style={[styles.pointsValue, styles.leadValue]}>—</Text>
            ) : diff !== undefined ? (
              <Text style={[styles.pointsValue, styles.diffValue]}>−{diff}</Text>
            ) : null}
          </View>
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
  emojiOuter: {
    position: 'relative',
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
  positionOverlay: {
    position: 'absolute',
    bottom: -6,
    right: -8,
    backgroundColor: Colors.darkGreen,
    borderWidth: 1,
    borderColor: Colors.success,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 22,
    alignItems: 'center',
  },
  positionOverlayText: {
    fontSize: 9,
    fontWeight: FontWeights.bold,
    color: Colors.success,
    lineHeight: 13,
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
    marginBottom: Spacing.sm,
    marginTop: 4,
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
  pointsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  divider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  pointsItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  pointsLabel: {
    fontSize: 9,
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
