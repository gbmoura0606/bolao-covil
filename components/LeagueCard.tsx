import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import type { League } from '@/types';

interface LeagueCardProps {
  league: League;
}

function getPositionLabel(pos: number): string {
  if (pos === 1) return '1º lugar';
  if (pos === 2) return '2º lugar';
  if (pos === 3) return '3º lugar';
  return `${pos}º lugar`;
}

export function LeagueCard({ league }: LeagueCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrapper}>
        <Ionicons name="trophy" size={24} color={Colors.accentGold} />
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{league.name}</Text>
        <Text style={styles.code}>Código: {league.code}</Text>

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
      </View>
    </View>
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    ...Shadows.md,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  code: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    fontFamily: 'monospace',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
});
