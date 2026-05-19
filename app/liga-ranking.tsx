import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';

// Reference view — mock data only
const MOCK_PARTICIPANTS = [
  { id: '1', name: 'Rodrigo',  points: 124, exactHits: 8,  position: 1 },
  { id: '2', name: 'Marina',   points: 115, exactHits: 7,  position: 2 },
  { id: '3', name: 'Tia Márcia', points: 110, exactHits: 6, position: 3 },
  { id: '4', name: 'Você',     points: 87,  exactHits: 5,  position: 4, isCurrentUser: true },
  { id: '5', name: 'Tiago',    points: 82,  exactHits: 4,  position: 5 },
  { id: '6', name: 'Lucas',    points: 74,  exactHits: 3,  position: 6 },
  { id: '7', name: 'Carla',    points: 68,  exactHits: 3,  position: 7 },
  { id: '8', name: 'Pedro',    points: 61,  exactHits: 2,  position: 8 },
  { id: '9', name: 'Beatriz',  points: 55,  exactHits: 2,  position: 9 },
  { id: '10', name: 'Felipe',  points: 42,  exactHits: 1,  position: 10 },
];

function getMedalColor(pos: number): string | undefined {
  if (pos === 1) return '#FFD700';
  if (pos === 2) return '#C0C0C0';
  if (pos === 3) return '#CD7F32';
  return undefined;
}

function PositionBadge({ pos }: { pos: number }): React.JSX.Element {
  const medal = getMedalColor(pos);
  if (medal) {
    return (
      <View style={[rowS.medalCircle, { borderColor: medal }]}>
        <Text style={[rowS.medalText, { color: medal }]}>{pos}</Text>
      </View>
    );
  }
  return (
    <View style={rowS.posCircle}>
      <Text style={rowS.posText}>{pos}º</Text>
    </View>
  );
}

function ParticipantRow({ participant }: { participant: typeof MOCK_PARTICIPANTS[0] }): React.JSX.Element {
  const { name, points, exactHits, position, isCurrentUser } = participant;
  return (
    <View style={[rowS.row, isCurrentUser && rowS.rowHighlight]}>
      <PositionBadge pos={position} />

      <View style={rowS.nameCol}>
        <Text style={[rowS.name, isCurrentUser && rowS.nameSelf]}>{name}</Text>
        {isCurrentUser && <Text style={rowS.youLabel}>você</Text>}
      </View>

      <View style={rowS.stat}>
        <Text style={rowS.statValue}>{exactHits}</Text>
        <Text style={rowS.statLabel}>exatos</Text>
      </View>

      <View style={rowS.pointsCol}>
        <Text style={[rowS.points, isCurrentUser && rowS.pointsSelf]}>{points}</Text>
        <Text style={rowS.ptLabel}>pts</Text>
      </View>
    </View>
  );
}

const rowS = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(55,65,81,0.4)',
    gap: Spacing.sm,
  },
  rowHighlight: {
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderBottomColor: Colors.accentGold,
  },
  medalCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  posCircle: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeights.semibold,
  },
  nameCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  name: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
  },
  nameSelf: {
    fontWeight: FontWeights.bold,
    color: Colors.accentGold,
  },
  youLabel: {
    fontSize: 10,
    color: Colors.accentGold,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 4,
    paddingVertical: 1,
    fontWeight: FontWeights.semibold,
  },
  stat: {
    alignItems: 'center',
    width: 44,
  },
  statValue: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
  },
  pointsCol: {
    alignItems: 'flex-end',
    minWidth: 48,
  },
  points: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  pointsSelf: {
    color: Colors.accentGold,
  },
  ptLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
  },
});

export default function LigaRankingScreen(): React.JSX.Element {
  const router = useRouter();
  const leader = MOCK_PARTICIPANTS[0];
  const me = MOCK_PARTICIPANTS.find((p) => p.isCurrentUser);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.accentGold} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Covil da Miga</Text>
          <Text style={styles.headerSubtitle}>Ranking da liga</Text>
        </View>
      </View>

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{MOCK_PARTICIPANTS.length}</Text>
          <Text style={styles.summaryLabel}>participantes</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{leader.name}</Text>
          <Text style={styles.summaryLabel}>líder · {leader.points}pts</Text>
        </View>
        {me && (
          <>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: Colors.accentGold }]}>{me.position}º</Text>
              <Text style={styles.summaryLabel}>sua posição</Text>
            </View>
          </>
        )}
      </View>

      {/* Table header */}
      <View style={styles.tableHeader}>
        <View style={{ width: 30 }} />
        <Text style={[styles.headerText, { flex: 1, marginLeft: Spacing.sm }]}>Participante</Text>
        <Text style={[styles.headerText, { width: 44, textAlign: 'center' }]}>Exatos</Text>
        <Text style={[styles.headerText, { width: 56, textAlign: 'right' }]}>Pontos</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {MOCK_PARTICIPANTS.map((p) => (
          <ParticipantRow key={p.id} participant={p} />
        ))}

        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.noticeText}>
            Pontuação parcial — atualiza após cada jogo encerrado.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundAlt,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.backgroundAlt,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  summaryLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2030',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  headerText: {
    fontSize: 10,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: {
    paddingBottom: Spacing.xxl,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    margin: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noticeText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
});
