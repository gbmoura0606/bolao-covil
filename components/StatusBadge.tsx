import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import type { MatchStatus } from '@/types';

interface StatusBadgeProps {
  status: MatchStatus;
}

const STATUS_LABELS: Record<MatchStatus, string> = {
  OPEN: 'Aberto',
  CLOSED: 'Encerrado',
  FINISHED: 'Finalizado',
};

const STATUS_COLORS: Record<MatchStatus, string> = {
  OPEN: Colors.success,
  CLOSED: Colors.error,
  FINISHED: Colors.textSecondary,
};

const STATUS_BG_COLORS: Record<MatchStatus, string> = {
  OPEN: 'rgba(16, 185, 129, 0.15)',
  CLOSED: 'rgba(239, 68, 68, 0.15)',
  FINISHED: 'rgba(156, 163, 175, 0.15)',
};

export function StatusBadge({ status }: StatusBadgeProps): React.JSX.Element {
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: STATUS_BG_COLORS[status],
          borderColor: STATUS_COLORS[status],
        },
      ]}
    >
      <Text style={[styles.label, { color: STATUS_COLORS[status] }]}>
        {STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
