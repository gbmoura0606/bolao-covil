import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMatchPredictions, GroupPrediction } from '@/services/predictions';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';

function PredRow({
  item,
  isMe,
  isFinished,
  liveHomeScore,
  liveAwayScore,
}: {
  item: GroupPrediction;
  isMe: boolean;
  isFinished: boolean;
  liveHomeScore?: number | null;
  liveAwayScore?: number | null;
}): React.JSX.Element {
  const pts = item.points;
  const ptColor =
    pts === null ? Colors.textSecondary
    : pts >= 5   ? Colors.accentGold
    : pts >= 3   ? '#60A5FA'
    : pts >= 1   ? Colors.success
    : Colors.textSecondary;

  // Exact score is impossible if the live score already exceeded either prediction value
  const isDead =
    !isFinished &&
    liveHomeScore != null &&
    liveAwayScore != null &&
    (item.homeScore < liveHomeScore || item.awayScore < liveAwayScore);

  return (
    <View style={[rowS.row, isMe && rowS.rowMe]}>
      <Text style={[rowS.name, isMe && rowS.nameMe, isDead && rowS.nameDead]} numberOfLines={1}>
        {item.nickname}
        {isMe && <Text style={[rowS.you, isDead && rowS.nameDead]}> (você)</Text>}
      </Text>
      <Text style={[rowS.score, isDead && rowS.scoreDead]}>
        {item.homeScore} × {item.awayScore}
      </Text>
      {isFinished && pts !== null && (
        <Text style={[rowS.pts, { color: ptColor }]}>
          {pts} pt{pts !== 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );
}

const rowS = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  rowMe: { backgroundColor: 'rgba(245,158,11,0.07)' },
  name: {
    flex: 1,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  nameMe: { color: Colors.accentGold, fontWeight: FontWeights.bold },
  nameDead: { opacity: 0.45 },
  you: { fontSize: 10, fontWeight: FontWeights.medium, color: Colors.accentGold },
  score: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    minWidth: 44,
    textAlign: 'center',
  },
  scoreDead: {
    color: Colors.error,
    opacity: 0.55,
    textDecorationLine: 'line-through',
  },
  pts: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    minWidth: 44,
    textAlign: 'right',
  },
});

interface Props {
  matchId: string;
  currentUserId: string | undefined;
  isFinished: boolean;
  liveHomeScore?: number | null;
  liveAwayScore?: number | null;
  refreshKey?: number;
}

export function GroupPredictionsPanel({ matchId, currentUserId, isFinished, liveHomeScore, liveAwayScore, refreshKey }: Props): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<GroupPrediction[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const rows = await getMatchPredictions(matchId);
      setData(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar.');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  // Reload when live match polling updates score (refreshKey changes)
  useEffect(() => {
    if (open) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  function toggle(): void {
    if (!open && data === null) void load();
    setOpen((o) => !o);
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={toggle} activeOpacity={0.8}>
        <View style={styles.headerLeft}>
          <Ionicons name="people-outline" size={13} color={Colors.textSecondary} />
          <Text style={styles.headerTxt}>
            {isFinished ? 'Palpites do grupo' : 'Palpites do grupo · visíveis após o início'}
          </Text>
        </View>
        {open
          ? <Ionicons name="chevron-up" size={13} color={Colors.textSecondary} />
          : <Ionicons name="chevron-down" size={13} color={Colors.textSecondary} />}
      </TouchableOpacity>

      {open && (
        <View style={styles.body}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="small" color={Colors.accentGold} />
            </View>
          ) : error !== '' ? (
            <TouchableOpacity style={styles.center} onPress={() => void load()} activeOpacity={0.8}>
              <Text style={styles.errorTxt}>{error} — toque para tentar novamente</Text>
            </TouchableOpacity>
          ) : data !== null && data.length === 0 ? (
            <Text style={styles.emptyTxt}>Nenhum palpite registrado.</Text>
          ) : (
            <>
              {isFinished && (
                <View style={styles.colHeaders}>
                  <Text style={[styles.colHdr, { flex: 1 }]}>Participante</Text>
                  <Text style={[styles.colHdr, { minWidth: 44, textAlign: 'center' }]}>Palpite</Text>
                  <Text style={[styles.colHdr, { minWidth: 44, textAlign: 'right' }]}>Pts</Text>
                </View>
              )}
              {data?.map((item) => (
                <PredRow
                  key={item.userId}
                  item={item}
                  isMe={item.userId === currentUserId}
                  isFinished={isFinished}
                  liveHomeScore={liveHomeScore}
                  liveAwayScore={liveAwayScore}
                />
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  headerTxt: { fontSize: 11, color: Colors.textSecondary },
  body: { backgroundColor: 'rgba(0,0,0,0.12)' },
  center: { alignItems: 'center', paddingVertical: Spacing.sm },
  errorTxt: { fontSize: 11, color: Colors.error, textAlign: 'center' },
  emptyTxt: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  colHeaders: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.xs,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  colHdr: {
    fontSize: 9,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
