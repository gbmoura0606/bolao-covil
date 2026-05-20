import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { StatusBadge } from './StatusBadge';
import type { Match } from '@/types';

interface MatchCardProps {
  match: Match;
  homeScore: string;
  awayScore: string;
  submitted: boolean;
  onUpdateScore: (team: 'home' | 'away', value: string) => void;
  onSubmit: () => void;
}

export function MatchCard({
  match,
  homeScore,
  awayScore,
  submitted,
  onUpdateScore,
  onSubmit,
}: MatchCardProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const canPredict = match.status === 'OPEN';

  function formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        if (canPredict) setExpanded((prev) => !prev);
      }}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View style={styles.metaRow}>
          <Text style={styles.round}>{match.round}</Text>
          {match.group ? <Text style={styles.group}>{match.group}</Text> : null}
        </View>
        <StatusBadge status={match.status} />
      </View>

      <View style={styles.teams}>
        <View style={styles.teamBlock}>
          <Text style={styles.flag}>{match.homeTeam.flagEmoji}</Text>
          <Text style={styles.teamName}>{match.homeTeam.name}</Text>
        </View>

        <View style={styles.scoreBlock}>
          {match.status === 'FINISHED' ? (
            <Text style={styles.finalScore}>
              {match.homeScore} <Text style={styles.scoreSep}>×</Text> {match.awayScore}
            </Text>
          ) : (
            <Text style={styles.vsText}>VS</Text>
          )}
          <Text style={styles.matchTime}>
            {formatDate(match.matchDate)} · {match.matchTime}
          </Text>
        </View>

        <View style={[styles.teamBlock, styles.teamBlockRight]}>
          <Text style={styles.flag}>{match.awayTeam.flagEmoji}</Text>
          <Text style={styles.teamName}>{match.awayTeam.name}</Text>
        </View>
      </View>

      {submitted && (
        <View style={styles.submittedRow}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.submittedText}>
            Palpite: {homeScore} × {awayScore}
          </Text>
        </View>
      )}

      {canPredict && !submitted && expanded && (
        <View style={styles.predictionBox}>
          <Text style={styles.predictionTitle}>Seu Palpite</Text>
          <View style={styles.predictionRow}>
            <View style={styles.scoreInputGroup}>
              <Text style={styles.scoreInputLabel}>{match.homeTeam.name}</Text>
              <TextInput
                style={styles.scoreInput}
                value={homeScore}
                onChangeText={(v) => onUpdateScore('home', v)}
                keyboardType="number-pad"
                maxLength={1}
                placeholder="0"
                placeholderTextColor={Colors.textSecondary}
                textAlign="center"
              />
            </View>
            <Text style={styles.predSep}>×</Text>
            <View style={styles.scoreInputGroup}>
              <Text style={styles.scoreInputLabel}>{match.awayTeam.name}</Text>
              <TextInput
                style={styles.scoreInput}
                value={awayScore}
                onChangeText={(v) => onUpdateScore('away', v)}
                keyboardType="number-pad"
                maxLength={1}
                placeholder="0"
                placeholderTextColor={Colors.textSecondary}
                textAlign="center"
              />
            </View>
          </View>
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={onSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.submitBtnText}>Confirmar Palpite</Text>
          </TouchableOpacity>
        </View>
      )}

      {canPredict && !submitted && (
        <View style={styles.tapHint}>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={Colors.textSecondary}
          />
          <Text style={styles.tapHintText}>
            {expanded ? 'Fechar' : 'Tocar para palpitar'}
          </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  round: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  group: {
    fontSize: FontSizes.xs,
    color: Colors.accentGold,
    fontWeight: FontWeights.semibold,
  },
  teams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  teamBlock: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  teamBlockRight: {
    alignItems: 'center',
  },
  flag: {
    fontSize: 32,
  },
  teamName: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeights.semibold,
    textAlign: 'center',
  },
  scoreBlock: {
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    minWidth: 80,
  },
  finalScore: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  scoreSep: {
    color: Colors.textSecondary,
  },
  vsText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textSecondary,
  },
  matchTime: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  submittedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.sm,
  },
  submittedText: {
    fontSize: FontSizes.sm,
    color: Colors.success,
    fontWeight: FontWeights.medium,
  },
  predictionBox: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
  },
  predictionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  scoreInputGroup: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  scoreInputLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  scoreInput: {
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 2,
    borderColor: Colors.accentGold,
    borderRadius: BorderRadius.md,
    width: 56,
    height: 56,
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  predSep: {
    fontSize: FontSizes.xl,
    color: Colors.textSecondary,
    fontWeight: FontWeights.bold,
    marginTop: Spacing.lg,
  },
  submitBtn: {
    backgroundColor: Colors.accentGold,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  submitBtnText: {
    color: Colors.background,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.5,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  tapHintText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
});
