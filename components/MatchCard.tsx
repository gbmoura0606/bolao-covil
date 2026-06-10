import React, { useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlagImage } from '@/components/FlagImage';
import { GroupPredictionsPanel } from '@/components/GroupPredictionsPanel';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import type { Match } from '@/types';
import type { PredictionEdit } from '@/hooks/usePredictions';

export interface MatchCardProps {
  match: Match;
  prediction: PredictionEdit | undefined;
  onUpdateScore: (team: 'home' | 'away', value: string) => void;
  onRetry: () => void;
  currentUserId?: string;
}

const ROUND_LABEL: Record<string, string> = {
  R1: '1ª Rodada', R2: '2ª Rodada', R3: '3ª Rodada',
  r32: 'Rodada de 32', r16: 'Oitavas', qf: 'Quartas', sf: 'Semifinal',
  final: 'Final', terceiro: '3º Lugar',
};

function fmtSavedAt(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getPointsInfo(
  predHome: number, predAway: number,
  realHome: number, realAway: number,
): { label: string; color: string; icon: string } {
  if (predHome === realHome && predAway === realAway) {
    return { label: 'placar exato', color: Colors.accentGold, icon: 'trophy' };
  }
  if (predHome - predAway === realHome - realAway) {
    return { label: 'saldo de gols', color: '#60A5FA', icon: 'trending-up' };
  }
  if (Math.sign(predHome - predAway) === Math.sign(realHome - realAway)) {
    return { label: 'resultado certo', color: Colors.success, icon: 'football-outline' };
  }
  return { label: 'resultado errado', color: Colors.textSecondary, icon: 'close-circle-outline' };
}

/**
 * matchDate/matchTime estão no horário de Brasília; em dispositivos no fuso
 * BRT a comparação local é exata. O backend rejeita palpites após o início
 * independentemente desta checagem visual.
 */
function hasMatchStarted(match: Match): boolean {
  return new Date().getTime() >= new Date(`${match.matchDate}T${match.matchTime}:00`).getTime();
}

export function MatchCard({ match, prediction, onUpdateScore, onRetry, currentUserId }: MatchCardProps): React.JSX.Element {
  const awayInputRef = useRef<TextInput>(null);

  const started = hasMatchStarted(match);
  const isOpen = match.status === 'OPEN' && !started;
  const isLive = match.status === 'CLOSED' || (match.status === 'OPEN' && started);
  const isFinished = match.status === 'FINISHED';

  const homeScore = prediction?.homeScore ?? '';
  const awayScore = prediction?.awayScore ?? '';
  const saveStatus = prediction?.saveStatus ?? 'idle';
  const hasPrediction = prediction?.persistedId !== undefined;

  const pointsInfo = (() => {
    if (!isFinished || !hasPrediction) return null;
    const pH = prediction?.persistedHomeScore;
    const pA = prediction?.persistedAwayScore;
    const rH = match.homeScore;
    const rA = match.awayScore;
    if (pH === undefined || pA === undefined || rH === undefined || rA === undefined) return null;
    return getPointsInfo(pH, pA, rH, rA);
  })();

  return (
    <View style={[styles.card, isLive && styles.cardLive]}>

      {/* Meta row */}
      <View style={styles.meta}>
        <View style={styles.metaBadge}>
          {isLive && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>AO VIVO</Text>
            </View>
          )}
          {isFinished && (
            <View style={styles.finishedBadge}>
              <Ionicons name="checkmark-circle-outline" size={11} color={Colors.textSecondary} />
              <Text style={styles.finishedText}>ENCERRADO</Text>
            </View>
          )}
          {isOpen && (
            <View style={styles.openBadge}>
              <View style={styles.openDot} />
              <Text style={styles.openText}>ABERTO</Text>
            </View>
          )}
        </View>
        <Text style={styles.metaInfo} numberOfLines={1}>
          {match.group ? `Grupo ${match.group} · ` : ''}{ROUND_LABEL[match.round] ?? match.round}
        </Text>
      </View>

      {/* Teams row — inputs sit in center column for OPEN matches */}
      <View style={styles.teamsRow}>
        <View style={styles.teamSide}>
          <FlagImage country={match.homeTeam.country} height={34} />
          <Text style={styles.teamName} numberOfLines={2}>{match.homeTeam.name}</Text>
        </View>

        <View style={styles.centerCol}>
          {isOpen ? (
            <View style={styles.inputsRow}>
              <TextInput
                style={[styles.input, homeScore !== '' && styles.inputFilled]}
                value={homeScore}
                onChangeText={(v) => {
                  const c = v.replace(/[^0-9]/g, '').slice(0, 1);
                  onUpdateScore('home', c);
                  if (c !== '' && homeScore === '') awayInputRef.current?.focus();
                }}
                keyboardType="number-pad"
                maxLength={1}
                placeholder="?"
                placeholderTextColor={Colors.border}
                selectTextOnFocus
              />
              <Text style={styles.inputSep}>×</Text>
              <TextInput
                ref={awayInputRef}
                style={[styles.input, awayScore !== '' && styles.inputFilled]}
                value={awayScore}
                onChangeText={(v) => {
                  const c = v.replace(/[^0-9]/g, '').slice(0, 1);
                  onUpdateScore('away', c);
                  if (c !== '') Keyboard.dismiss();
                }}
                keyboardType="number-pad"
                maxLength={1}
                placeholder="?"
                placeholderTextColor={Colors.border}
                selectTextOnFocus
              />
            </View>
          ) : (isLive || isFinished) && match.homeScore !== undefined && match.awayScore !== undefined ? (
            <Text style={[styles.score, isLive && styles.scoreLive]}>
              {match.homeScore} – {match.awayScore}
            </Text>
          ) : (
            <Text style={styles.vsText}>×</Text>
          )}
          <Text style={styles.timeText}>{match.matchTime}</Text>
        </View>

        <View style={[styles.teamSide, styles.teamSideRight]}>
          <FlagImage country={match.awayTeam.country} height={34} />
          <Text style={styles.teamName} numberOfLines={2}>{match.awayTeam.name}</Text>
        </View>
      </View>

      {/* Bottom strip — save status (OPEN) or locked prediction info */}
      <View style={styles.predRow}>
        {isOpen ? (
          <View style={styles.saveRow}>
            <Text style={styles.predLabel}>Palpite</Text>
            <View style={styles.saveIndicator}>
              {saveStatus === 'saving' && (
                <ActivityIndicator size="small" color={Colors.accentGold} />
              )}
              {saveStatus === 'dirty' && (
                <Text style={styles.dotIndicator}>•••</Text>
              )}
              {saveStatus === 'saved' && prediction?.savedAt !== undefined && (
                <View style={styles.savedRow}>
                  <Ionicons name="checkmark-circle" size={13} color={Colors.success} />
                  <Text style={styles.savedText}>Salvo {fmtSavedAt(prediction.savedAt)}</Text>
                </View>
              )}
              {saveStatus === 'error' && (
                <TouchableOpacity onPress={onRetry} activeOpacity={0.7} style={styles.errorBtn}>
                  <Ionicons name="alert-circle" size={13} color={Colors.error} />
                  <Text style={styles.errorText}>Erro · tentar novamente</Text>
                </TouchableOpacity>
              )}
              {saveStatus === 'idle' && (
                <Text style={styles.hintText}>sem palpite</Text>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.lockedRow}>
            {hasPrediction &&
              prediction?.persistedHomeScore !== undefined &&
              prediction?.persistedAwayScore !== undefined ? (
              <>
                <Text style={styles.predStatic}>
                  Palpite: {prediction.persistedHomeScore} × {prediction.persistedAwayScore}
                </Text>
                {isLive && (
                  <View style={styles.lockChip}>
                    <Ionicons name="lock-closed" size={11} color={Colors.textSecondary} />
                    <Text style={styles.lockText}>bloqueado</Text>
                  </View>
                )}
                {isFinished && pointsInfo !== null && (
                  <View style={styles.pointsChip}>
                    <Ionicons name={pointsInfo.icon as 'trophy'} size={12} color={pointsInfo.color} />
                    <Text style={[styles.pointsText, { color: pointsInfo.color }]}>
                      {prediction.points ?? 0} pt{(prediction.points ?? 0) !== 1 ? 's' : ''}{' '}
                      · {pointsInfo.label}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.noPredText}>
                {isFinished ? 'Sem palpite — 0 pts' : 'Sem palpite 🔒'}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Palpites do grupo — visíveis após o início do jogo */}
      {!isOpen && (
        <GroupPredictionsPanel
          matchId={match.id}
          currentUserId={currentUserId}
          isFinished={isFinished}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  cardLive: {
    borderColor: Colors.error,
    borderWidth: 1.5,
  },

  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    backgroundColor: Colors.backgroundAlt,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  metaBadge: { flexDirection: 'row', alignItems: 'center' },
  metaInfo: { fontSize: 10, color: Colors.textSecondary, flex: 1, textAlign: 'right' },

  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.error },
  liveText: { fontSize: 10, fontWeight: FontWeights.bold, color: Colors.error, letterSpacing: 0.8 },

  finishedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  finishedText: { fontSize: 10, color: Colors.textSecondary, letterSpacing: 0.5 },

  openBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  openDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  openText: { fontSize: 10, fontWeight: FontWeights.semibold, color: Colors.success, letterSpacing: 0.8 },

  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  teamSide: { flex: 1, alignItems: 'center', gap: 5 },
  teamSideRight: {},
  teamName: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 16,
  },

  centerCol: {
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    minWidth: 120,
  },
  inputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  input: {
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    width: 40,
    height: 40,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  inputFilled: { borderColor: Colors.accentGold },
  inputSep: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontWeight: FontWeights.bold,
  },

  score: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  scoreLive: { color: Colors.error },
  vsText: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.border },
  timeText: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },

  predRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },

  saveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  predLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: FontWeights.medium },
  saveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dotIndicator: { fontSize: FontSizes.md, color: Colors.textSecondary, letterSpacing: 2 },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  savedText: { fontSize: 11, color: Colors.success },
  errorBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  errorText: { fontSize: 11, color: Colors.error },
  hintText: { fontSize: 11, color: Colors.border, fontStyle: 'italic' },

  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  predStatic: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeights.semibold,
  },
  lockChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  lockText: { fontSize: 11, color: Colors.textSecondary },
  pointsChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  pointsText: { fontSize: 11, fontWeight: FontWeights.semibold },
  noPredText: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontStyle: 'italic' },
});
