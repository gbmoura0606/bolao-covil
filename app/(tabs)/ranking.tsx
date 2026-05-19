import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Dimensions, LayoutAnimation, UIManager, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ScreenHeader';
import {
  getWorldCupGroups, getKnockoutByRound, getClassificationCriteria,
  type WCGroup, type WCStanding, type WCMatch, type KnockoutMatch, type KnockoutRound,
} from '@/services/worldcup2026';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '@/constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_W } = Dimensions.get('window');
const IS_WIDE = SCREEN_W >= 680;

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'criterios' | 'terceiros' | 'grupos' | 'matamata';

const PHASES: Phase[] = ['criterios', 'terceiros', 'grupos', 'matamata'];

const PHASE_LABEL: Record<Phase, string> = {
  criterios: 'Critérios',
  terceiros: '3os Lugares',
  grupos: 'Fase de Grupos',
  matamata: 'Mata-Mata',
};

const KNOCKOUT_ROUNDS: KnockoutRound[] = ['r32', 'r16', 'qf', 'sf', 'final', 'terceiro'];
const KO_LABEL: Record<KnockoutRound, string> = {
  r32: 'Rodada de 32',
  r16: 'Oitavas de Final',
  qf: 'Quartas de Final',
  sf: 'Semifinais',
  final: 'Final',
  terceiro: '3º Lugar',
};

const GROUP_IDS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string): string {
  const [, m, day] = d.split('-');
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${parseInt(day, 10)} ${months[parseInt(m, 10) - 1]}`;
}

// ─── Phase navigation bar ─────────────────────────────────────────────────────

interface PhaseNavProps { phase: Phase; onChange: (p: Phase) => void; }

function PhaseNav({ phase, onChange }: PhaseNavProps): React.JSX.Element {
  const idx = PHASES.indexOf(phase);
  const prev = idx > 0 ? PHASES[idx - 1] : null;
  const next = idx < PHASES.length - 1 ? PHASES[idx + 1] : null;

  return (
    <View style={pnStyles.bar}>
      <TouchableOpacity
        style={pnStyles.arrow}
        onPress={() => prev && onChange(prev)}
        disabled={!prev}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={20} color={prev ? Colors.accentGold : Colors.border} />
      </TouchableOpacity>

      <View style={pnStyles.center}>
        <Text style={pnStyles.label}>{PHASE_LABEL[phase]}</Text>
        <View style={pnStyles.dots}>
          {PHASES.map((p) => (
            <TouchableOpacity key={p} onPress={() => onChange(p)} activeOpacity={0.7}>
              <View style={[pnStyles.dot, p === phase && pnStyles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={pnStyles.arrow}
        onPress={() => next && onChange(next)}
        disabled={!next}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-forward" size={20} color={next ? Colors.accentGold : Colors.border} />
      </TouchableOpacity>
    </View>
  );
}

const pnStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: Colors.accentGold,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  arrow: { width: 40, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  center: { flex: 1, alignItems: 'center' },
  label: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dots: { flexDirection: 'row', gap: 6, marginTop: 4 },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.border,
  },
  dotActive: { backgroundColor: Colors.accentGold, width: 18 },
});

// ─── Group tab selector ───────────────────────────────────────────────────────

interface GroupTabsProps { selected: string; onSelect: (id: string) => void; }

function GroupTabs({ selected, onSelect }: GroupTabsProps): React.JSX.Element {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={gtStyles.scroll}
      contentContainerStyle={gtStyles.content}
    >
      {GROUP_IDS.map((id) => (
        <TouchableOpacity
          key={id}
          style={[gtStyles.tab, selected === id && gtStyles.tabActive]}
          onPress={() => onSelect(id)}
          activeOpacity={0.75}
        >
          <Text style={[gtStyles.label, selected === id && gtStyles.labelActive]}>
            {id}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const gtStyles = StyleSheet.create({
  scroll: { backgroundColor: Colors.backgroundAlt, maxHeight: 44 },
  content: { paddingHorizontal: Spacing.sm, paddingVertical: 6, gap: 6 },
  tab: {
    width: 36, height: 32, borderRadius: BorderRadius.sm,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.accentGold, borderColor: Colors.accentGold },
  label: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.textSecondary },
  labelActive: { color: Colors.background },
});

// ─── Standings table ──────────────────────────────────────────────────────────

interface StandingsProps { group: WCGroup; compact?: boolean; showPos?: boolean; }

function StandingsTable({ group, compact = false, showPos = true }: StandingsProps): React.JSX.Element {
  return (
    <View style={stStyles.wrap}>
      {/* Header row */}
      <View style={stStyles.header}>
        {showPos && <View style={stStyles.posCol}><Text style={stStyles.hLabel}>#</Text></View>}
        <View style={stStyles.teamCol}><Text style={stStyles.hLabel}>Classificação</Text></View>
        <View style={stStyles.numCol}><Text style={stStyles.hLabel}>P</Text></View>
        <View style={stStyles.numCol}><Text style={stStyles.hLabel}>J</Text></View>
        <View style={stStyles.numCol}><Text style={stStyles.hLabel}>V</Text></View>
        <View style={stStyles.numCol}><Text style={stStyles.hLabel}>E</Text></View>
        <View style={stStyles.numCol}><Text style={stStyles.hLabel}>D</Text></View>
        {!compact && <View style={stStyles.numCol}><Text style={stStyles.hLabel}>GP</Text></View>}
        {!compact && <View style={stStyles.numCol}><Text style={stStyles.hLabel}>GC</Text></View>}
        <View style={stStyles.numCol}><Text style={stStyles.hLabel}>SG</Text></View>
        {!compact && <View style={stStyles.pctCol}><Text style={stStyles.hLabel}>%</Text></View>}
        <View style={stStyles.lastCol}><Text style={stStyles.hLabel}>Últ.</Text></View>
      </View>

      {group.standings.map((st: WCStanding, idx: number) => {
        const qualify = idx < 2;
        const pct = st.played > 0 ? Math.round((st.won / st.played) * 100) : 0;
        return (
          <View
            key={st.team.id}
            style={[stStyles.row, idx < group.standings.length - 1 && stStyles.rowBorder, qualify && stStyles.rowQualify]}
          >
            {showPos && (
              <View style={stStyles.posCol}>
                <Text style={[stStyles.pos, qualify && stStyles.posQ]}>{idx + 1}</Text>
              </View>
            )}
            <View style={stStyles.teamCell}>
              <Text style={stStyles.flag}>{st.team.flag}</Text>
              <Text style={stStyles.teamName} numberOfLines={1}>{st.team.name}</Text>
            </View>
            <View style={stStyles.numCol}><Text style={stStyles.pts}>{st.points}</Text></View>
            <View style={stStyles.numCol}><Text style={stStyles.val}>{st.played}</Text></View>
            <View style={stStyles.numCol}><Text style={stStyles.val}>{st.won}</Text></View>
            <View style={stStyles.numCol}><Text style={stStyles.val}>{st.drawn}</Text></View>
            <View style={stStyles.numCol}><Text style={stStyles.val}>{st.lost}</Text></View>
            {!compact && <View style={stStyles.numCol}><Text style={stStyles.val}>{st.goalsFor}</Text></View>}
            {!compact && <View style={stStyles.numCol}><Text style={stStyles.val}>{st.goalsAgainst}</Text></View>}
            <View style={stStyles.numCol}>
              <Text style={[stStyles.val, st.goalDiff > 0 && stStyles.pos_, st.goalDiff < 0 && stStyles.neg]}>
                {st.goalDiff > 0 ? `+${st.goalDiff}` : st.goalDiff}
              </Text>
            </View>
            {!compact && (
              <View style={stStyles.pctCol}><Text style={stStyles.val}>{pct}</Text></View>
            )}
            <View style={stStyles.lastCol}>
              <View style={stStyles.dots}>
                {st.lastResults.slice(-3).map((r, i) => (
                  <View
                    key={i}
                    style={[
                      stStyles.resDot,
                      r === 'W' && stStyles.resW,
                      r === 'D' && stStyles.resD,
                      r === 'L' && stStyles.resL,
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>
        );
      })}

      <View style={stStyles.legend}>
        <View style={[stStyles.legendDot, { backgroundColor: Colors.accentGold }]} />
        <Text style={stStyles.legendTxt}>Classificado para Rodada de 32</Text>
      </View>
    </View>
  );
}

const stStyles = StyleSheet.create({
  wrap: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a2030',
    paddingHorizontal: Spacing.xs, paddingVertical: Spacing.xs + 2,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  hLabel: { fontSize: 10, fontWeight: FontWeights.semibold, color: Colors.textSecondary, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xs, paddingVertical: 7 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(55,65,81,0.5)' },
  rowQualify: { backgroundColor: 'rgba(245,158,11,0.05)' },
  posCol: { width: 18, alignItems: 'center' },
  teamCol: { flex: 1 },
  teamCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  numCol: { width: 24, alignItems: 'center' },
  pctCol: { width: 26, alignItems: 'center' },
  lastCol: { width: 36, alignItems: 'center' },
  pos: { fontSize: 11, fontWeight: FontWeights.semibold, color: Colors.textSecondary },
  posQ: { color: Colors.accentGold },
  flag: { fontSize: 16 },
  teamName: { fontSize: 12, fontWeight: FontWeights.medium, color: Colors.textPrimary, flex: 1 },
  pts: { fontSize: 13, fontWeight: FontWeights.bold, color: Colors.textPrimary, textAlign: 'center' },
  val: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
  pos_: { color: Colors.success },
  neg: { color: Colors.error },
  dots: { flexDirection: 'row', gap: 2 },
  resDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.border },
  resW: { backgroundColor: Colors.success },
  resD: { backgroundColor: Colors.textSecondary },
  resL: { backgroundColor: Colors.error },
  legend: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.xs, paddingVertical: 5,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendTxt: { fontSize: 9, color: Colors.textSecondary },
});

// ─── Round matches panel ──────────────────────────────────────────────────────

const ROUNDS: (1|2|3)[] = [1, 2, 3];
const ROUND_LABEL: Record<number, string> = { 1: '1ª Rodada', 2: '2ª Rodada', 3: '3ª Rodada' };

interface MatchesPanelProps { group: WCGroup; }

function MatchesPanel({ group }: MatchesPanelProps): React.JSX.Element {
  const [round, setRound] = useState<1|2|3>(1);

  const roundMatches = group.matches.filter((m) => m.round === round);
  const ridx = ROUNDS.indexOf(round);

  return (
    <View style={mpStyles.wrap}>
      {/* Round navigation */}
      <View style={mpStyles.roundNav}>
        <TouchableOpacity
          onPress={() => ridx > 0 && setRound(ROUNDS[ridx - 1])}
          disabled={ridx === 0}
          style={mpStyles.roundArrow}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={16} color={ridx > 0 ? Colors.accentGold : Colors.border} />
        </TouchableOpacity>
        <Text style={mpStyles.roundLabel}>{ROUND_LABEL[round]}</Text>
        <TouchableOpacity
          onPress={() => ridx < ROUNDS.length - 1 && setRound(ROUNDS[ridx + 1])}
          disabled={ridx === ROUNDS.length - 1}
          style={mpStyles.roundArrow}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={16} color={ridx < ROUNDS.length - 1 ? Colors.accentGold : Colors.border} />
        </TouchableOpacity>
      </View>

      {/* Matches */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {roundMatches.map((m: WCMatch) => (
          <View key={m.id} style={mpStyles.matchCard}>
            <Text style={mpStyles.venue} numberOfLines={1}>{m.venue}</Text>
            <Text style={mpStyles.venueCity}>{fmtDate(m.date)} • {m.time}</Text>

            <View style={mpStyles.matchRow}>
              {/* Home */}
              <View style={mpStyles.teamSide}>
                <Text style={mpStyles.mFlag}>{m.home.flag}</Text>
                <Text style={mpStyles.mTeam} numberOfLines={2}>{m.home.name}</Text>
              </View>

              {/* Score / time */}
              <View style={mpStyles.scoreBox}>
                {m.homeScore !== null && m.awayScore !== null ? (
                  <Text style={mpStyles.score}>{m.homeScore} – {m.awayScore}</Text>
                ) : (
                  <View style={mpStyles.timeBox}>
                    <Text style={mpStyles.timeText}>{m.time}</Text>
                  </View>
                )}
              </View>

              {/* Away */}
              <View style={[mpStyles.teamSide, mpStyles.teamAway]}>
                <Text style={mpStyles.mTeam} numberOfLines={2}>{m.away.name}</Text>
                <Text style={mpStyles.mFlag}>{m.away.flag}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const mpStyles = StyleSheet.create({
  wrap: { flex: 1 },
  roundNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs, paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundAlt,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  roundArrow: { width: 32, alignItems: 'center' },
  roundLabel: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  matchCard: {
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: 'rgba(55,65,81,0.4)',
  },
  venue: { fontSize: 10, color: Colors.accentGold, fontWeight: FontWeights.medium },
  venueCity: { fontSize: 10, color: Colors.textSecondary, marginBottom: Spacing.xs },
  matchRow: { flexDirection: 'row', alignItems: 'center' },
  teamSide: { flex: 1, alignItems: 'center', gap: 3 },
  teamAway: {},
  mFlag: { fontSize: 22 },
  mTeam: { fontSize: 11, color: Colors.textPrimary, fontWeight: FontWeights.medium, textAlign: 'center' },
  scoreBox: { width: 64, alignItems: 'center' },
  score: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.accentGold },
  timeBox: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.sm,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: Colors.border,
  },
  timeText: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.textPrimary },
});

// ─── FASE DE GRUPOS view ──────────────────────────────────────────────────────

function FaseDeGrupos(): React.JSX.Element {
  const [selectedId, setSelectedId] = useState('A');
  const groups = getWorldCupGroups();
  const group = groups.find((g) => g.id === selectedId) ?? groups[0];

  return (
    <View style={{ flex: 1 }}>
      <GroupTabs selected={selectedId} onSelect={setSelectedId} />

      {/* Group title */}
      <View style={fgStyles.groupBar}>
        <Text style={fgStyles.groupTitle}>{group.name}</Text>
        <Text style={fgStyles.groupSub}>{group.standings.map((s) => s.team.flag).join('  ')}</Text>
      </View>

      {/* Split panel */}
      {IS_WIDE ? (
        <View style={fgStyles.splitRow}>
          <View style={fgStyles.leftPanel}>
            <StandingsTable group={group} />
          </View>
          <View style={fgStyles.divider} />
          <View style={fgStyles.rightPanel}>
            <MatchesPanel group={group} />
          </View>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <StandingsTable group={group} compact />
          <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm }} />
          <MatchesPanel group={group} />
        </ScrollView>
      )}
    </View>
  );
}

const fgStyles = StyleSheet.create({
  groupBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  groupTitle: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.accentGold },
  groupSub: { fontSize: 16 },
  splitRow: { flex: 1, flexDirection: 'row' },
  leftPanel: { flex: 3, borderRightWidth: 1, borderRightColor: Colors.border },
  divider: { width: 1, backgroundColor: Colors.border },
  rightPanel: { flex: 2 },
});

// ─── TERCEIROS COLOCADOS view ─────────────────────────────────────────────────

function TerceirosColocados(): React.JSX.Element {
  const groups = getWorldCupGroups();

  const thirds: Array<WCStanding & { groupId: string }> = groups
    .map((g) => ({ ...g.standings[2], groupId: g.id }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      return b.goalsFor - a.goalsFor;
    });

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <View style={t3styles.info}>
        <Ionicons name="information-circle-outline" size={14} color={Colors.textSecondary} />
        <Text style={t3styles.infoTxt}>
          Os 8 melhores 3os colocados (entre 12) avançam para a Rodada de 32.
          Critérios: pontos → saldo → gols → fair play.
        </Text>
      </View>

      {/* Table header */}
      <View style={t3styles.header}>
        <View style={t3styles.rankCol}><Text style={t3styles.hLabel}>#</Text></View>
        <View style={t3styles.grpCol}><Text style={t3styles.hLabel}>Grp</Text></View>
        <View style={t3styles.teamCol}><Text style={t3styles.hLabel}>Seleção</Text></View>
        <View style={t3styles.numCol}><Text style={t3styles.hLabel}>P</Text></View>
        <View style={t3styles.numCol}><Text style={t3styles.hLabel}>J</Text></View>
        <View style={t3styles.numCol}><Text style={t3styles.hLabel}>V</Text></View>
        <View style={t3styles.numCol}><Text style={t3styles.hLabel}>E</Text></View>
        <View style={t3styles.numCol}><Text style={t3styles.hLabel}>D</Text></View>
        <View style={t3styles.numCol}><Text style={t3styles.hLabel}>GP</Text></View>
        <View style={t3styles.numCol}><Text style={t3styles.hLabel}>GC</Text></View>
        <View style={t3styles.numCol}><Text style={t3styles.hLabel}>SG</Text></View>
      </View>

      {thirds.map((st, idx) => {
        const qualifies = idx < 8;
        return (
          <View
            key={st.team.id}
            style={[t3styles.row, qualifies && t3styles.rowQ, idx === 7 && t3styles.rowLast]}
          >
            <View style={t3styles.rankCol}>
              <Text style={[t3styles.rank, qualifies && t3styles.rankQ]}>{idx + 1}</Text>
            </View>
            <View style={t3styles.grpCol}>
              <Text style={t3styles.grpBadge}>{(st as typeof st & { groupId: string }).groupId}</Text>
            </View>
            <View style={t3styles.teamCell}>
              <Text style={t3styles.flag}>{st.team.flag}</Text>
              <Text style={t3styles.teamName} numberOfLines={1}>{st.team.name}</Text>
            </View>
            <View style={t3styles.numCol}><Text style={t3styles.pts}>{st.points}</Text></View>
            <View style={t3styles.numCol}><Text style={t3styles.val}>{st.played}</Text></View>
            <View style={t3styles.numCol}><Text style={t3styles.val}>{st.won}</Text></View>
            <View style={t3styles.numCol}><Text style={t3styles.val}>{st.drawn}</Text></View>
            <View style={t3styles.numCol}><Text style={t3styles.val}>{st.lost}</Text></View>
            <View style={t3styles.numCol}><Text style={t3styles.val}>{st.goalsFor}</Text></View>
            <View style={t3styles.numCol}><Text style={t3styles.val}>{st.goalsAgainst}</Text></View>
            <View style={t3styles.numCol}>
              <Text style={[t3styles.val, st.goalDiff > 0 && { color: Colors.success }, st.goalDiff < 0 && { color: Colors.error }]}>
                {st.goalDiff > 0 ? `+${st.goalDiff}` : st.goalDiff}
              </Text>
            </View>
          </View>
        );
      })}

      <View style={t3styles.cutLine}>
        <Text style={t3styles.cutTxt}>▲ Classificados (8)  ·  Eliminados ▼</Text>
      </View>
    </ScrollView>
  );
}

const t3styles = StyleSheet.create({
  info: {
    flexDirection: 'row', gap: 6, alignItems: 'flex-start',
    margin: Spacing.md, padding: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  infoTxt: { flex: 1, fontSize: 11, color: Colors.textSecondary, lineHeight: 16 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a2030',
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs + 2,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border,
  },
  hLabel: { fontSize: 10, fontWeight: FontWeights.semibold, color: Colors.textSecondary, textAlign: 'center' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.sm, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: 'rgba(55,65,81,0.4)',
  },
  rowQ: { backgroundColor: 'rgba(245,158,11,0.05)' },
  rowLast: { borderBottomColor: Colors.accentGold, borderBottomWidth: 2 },
  rankCol: { width: 22, alignItems: 'center' },
  grpCol: { width: 28, alignItems: 'center' },
  teamCol: { flex: 1 },
  teamCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  numCol: { width: 26, alignItems: 'center' },
  rank: { fontSize: 12, fontWeight: FontWeights.bold, color: Colors.textSecondary },
  rankQ: { color: Colors.accentGold },
  grpBadge: { fontSize: 11, fontWeight: FontWeights.bold, color: Colors.accentGold },
  flag: { fontSize: 16 },
  teamName: { fontSize: 12, fontWeight: FontWeights.medium, color: Colors.textPrimary, flex: 1 },
  pts: { fontSize: 13, fontWeight: FontWeights.bold, color: Colors.textPrimary, textAlign: 'center' },
  val: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
  cutLine: {
    padding: Spacing.sm,
    alignItems: 'center',
    borderTopWidth: 2, borderTopColor: Colors.accentGold,
    backgroundColor: 'rgba(245,158,11,0.06)',
    marginBottom: Spacing.xl,
  },
  cutTxt: { fontSize: 10, color: Colors.accentGold, fontWeight: FontWeights.semibold },
});

// ─── CRITÉRIOS view ───────────────────────────────────────────────────────────

function CriteriosView(): React.JSX.Element {
  const criteria = getClassificationCriteria();
  const groups = getWorldCupGroups();

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <View style={crStyles.section}>
        <Text style={crStyles.sectionTitle}>Critérios de Classificação FIFA 2026</Text>
        <Text style={crStyles.sectionSub}>
          Em caso de empate de pontos ao final da fase de grupos, a classificação é definida na seguinte ordem:
        </Text>
      </View>

      {criteria.map((c) => (
        <View key={c.order} style={crStyles.criteriaRow}>
          <View style={crStyles.orderBadge}>
            <Text style={crStyles.orderNum}>{c.order}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={crStyles.criteriaTitle}>{c.title}</Text>
            <Text style={crStyles.criteriaDesc}>{c.description}</Text>
          </View>
        </View>
      ))}

      <View style={crStyles.divider} />

      <Text style={crStyles.sectionTitle}>Critérios aplicados por grupo</Text>
      <Text style={crStyles.sectionSub}>
        Valores atuais de cada seleção nos critérios de desempate (confronto direto calculado ao final da fase de grupos).
      </Text>

      {groups.map((g) => (
        <View key={g.id} style={crStyles.groupBlock}>
          <View style={crStyles.groupHeader}>
            <Text style={crStyles.groupTitle}>{g.name}</Text>
          </View>

          {/* Mini criteria table header */}
          <View style={crStyles.miniHeader}>
            <View style={crStyles.miniTeamCol}><Text style={crStyles.miniH}>Seleção</Text></View>
            <View style={crStyles.miniNumCol}><Text style={crStyles.miniH}>P</Text></View>
            <View style={crStyles.miniNumCol}><Text style={crStyles.miniH}>SG</Text></View>
            <View style={crStyles.miniNumCol}><Text style={crStyles.miniH}>GP</Text></View>
            <View style={crStyles.miniNumCol}><Text style={crStyles.miniH}>P¹</Text></View>
            <View style={crStyles.miniNumCol}><Text style={crStyles.miniH}>SG¹</Text></View>
            <View style={crStyles.miniNumCol}><Text style={crStyles.miniH}>GP¹</Text></View>
            <View style={crStyles.miniNumCol}><Text style={crStyles.miniH}>FP</Text></View>
          </View>

          {g.standings.map((st: WCStanding, idx: number) => (
            <View key={st.team.id} style={[crStyles.miniRow, idx < g.standings.length - 1 && { borderBottomWidth: 1, borderBottomColor: 'rgba(55,65,81,0.4)' }]}>
              <View style={crStyles.miniTeamCell}>
                <Text style={crStyles.miniFlag}>{st.team.flag}</Text>
                <Text style={crStyles.miniName} numberOfLines={1}>{st.team.name}</Text>
              </View>
              <View style={crStyles.miniNumCol}><Text style={crStyles.miniVal}>{st.points}</Text></View>
              <View style={crStyles.miniNumCol}><Text style={crStyles.miniVal}>{st.goalDiff}</Text></View>
              <View style={crStyles.miniNumCol}><Text style={crStyles.miniVal}>{st.goalsFor}</Text></View>
              {/* Direct confrontation columns — all 0 pre-tournament */}
              <View style={crStyles.miniNumCol}><Text style={crStyles.miniValD}>–</Text></View>
              <View style={crStyles.miniNumCol}><Text style={crStyles.miniValD}>–</Text></View>
              <View style={crStyles.miniNumCol}><Text style={crStyles.miniValD}>–</Text></View>
              <View style={crStyles.miniNumCol}><Text style={crStyles.miniVal}>0</Text></View>
            </View>
          ))}
        </View>
      ))}

      <View style={crStyles.footnote}>
        <Text style={crStyles.footnoteText}>
          P¹ = Pontos confronto direto · SG¹ = Saldo confronto direto · GP¹ = Gols confronto direto · FP = Pontos Fair Play
        </Text>
      </View>
    </ScrollView>
  );
}

const crStyles = StyleSheet.create({
  section: { padding: Spacing.md },
  sectionTitle: {
    fontSize: FontSizes.md, fontWeight: FontWeights.bold,
    color: Colors.accentGold, marginBottom: 4,
  },
  sectionSub: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  criteriaRow: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  orderBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.accentGold, alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  orderNum: { fontSize: 12, fontWeight: FontWeights.bold, color: Colors.background },
  criteriaTitle: { fontSize: 13, fontWeight: FontWeights.semibold, color: Colors.textPrimary, marginBottom: 2 },
  criteriaDesc: { fontSize: 11, color: Colors.textSecondary, lineHeight: 16 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md, marginHorizontal: Spacing.md },
  groupBlock: {
    marginHorizontal: Spacing.md, marginBottom: Spacing.md,
    borderRadius: BorderRadius.md, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  groupHeader: {
    backgroundColor: Colors.backgroundAlt,
    paddingHorizontal: Spacing.sm, paddingVertical: 5,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  groupTitle: { fontSize: 12, fontWeight: FontWeights.bold, color: Colors.accentGold },
  miniHeader: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a2030',
    paddingHorizontal: Spacing.xs, paddingVertical: 4,
  },
  miniH: { fontSize: 9, fontWeight: FontWeights.semibold, color: Colors.textSecondary, textAlign: 'center' },
  miniRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xs, paddingVertical: 6 },
  miniTeamCol: { flex: 1 },
  miniTeamCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  miniNumCol: { width: 28, alignItems: 'center' },
  miniFlag: { fontSize: 14 },
  miniName: { fontSize: 11, color: Colors.textPrimary, fontWeight: FontWeights.medium, flex: 1 },
  miniVal: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
  miniValD: { fontSize: 11, color: Colors.border, textAlign: 'center' },
  footnote: {
    margin: Spacing.md, padding: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.sm,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.xxl,
  },
  footnoteText: { fontSize: 10, color: Colors.textSecondary, lineHeight: 16 },
});

// ─── MATA-MATA view ───────────────────────────────────────────────────────────

function MataMataView(): React.JSX.Element {
  const [koRound, setKoRound] = useState<KnockoutRound>('r32');
  const rounds = KNOCKOUT_ROUNDS;
  const ridx = rounds.indexOf(koRound);
  const matches = getKnockoutByRound(koRound);

  return (
    <View style={{ flex: 1 }}>
      {/* Round navigation */}
      <View style={mmStyles.roundNav}>
        <TouchableOpacity
          style={mmStyles.arrow}
          onPress={() => ridx > 0 && setKoRound(rounds[ridx - 1])}
          disabled={ridx === 0}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={18} color={ridx > 0 ? Colors.accentGold : Colors.border} />
        </TouchableOpacity>
        <Text style={mmStyles.roundLabel}>{KO_LABEL[koRound]}</Text>
        <TouchableOpacity
          style={mmStyles.arrow}
          onPress={() => ridx < rounds.length - 1 && setKoRound(rounds[ridx + 1])}
          disabled={ridx === rounds.length - 1}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={18} color={ridx < rounds.length - 1 ? Colors.accentGold : Colors.border} />
        </TouchableOpacity>
      </View>

      {/* Round tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={mmStyles.tabs} contentContainerStyle={{ gap: 6, paddingHorizontal: Spacing.sm, paddingVertical: 6 }}>
        {rounds.map((r) => (
          <TouchableOpacity
            key={r}
            style={[mmStyles.tab, r === koRound && mmStyles.tabActive]}
            onPress={() => setKoRound(r)}
            activeOpacity={0.75}
          >
            <Text style={[mmStyles.tabTxt, r === koRound && mmStyles.tabTxtActive]}>{KO_LABEL[r]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Match cards */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: Spacing.xxl }} showsVerticalScrollIndicator={false}>
        {koRound === 'r32' && (
          <View style={mmStyles.notice}>
            <Ionicons name="information-circle-outline" size={13} color={Colors.textSecondary} />
            <Text style={mmStyles.noticeTxt}>
              Os 8 melhores 3os colocados serão distribuídos nesta rodada conforme tabela oficial FIFA.
              Slots marcados como "3º melhor (n)" dependem do desempenho na fase de grupos.
            </Text>
          </View>
        )}

        {matches.length === 0 ? (
          <View style={mmStyles.empty}>
            <Text style={mmStyles.emptyTxt}>Nenhum confronto definido ainda para esta fase.</Text>
          </View>
        ) : (
          <View style={IS_WIDE ? mmStyles.grid : undefined}>
            {matches.map((m: KnockoutMatch) => (
              <View key={m.id} style={[mmStyles.matchCard, IS_WIDE && mmStyles.matchCardWide]}>
                <View style={mmStyles.matchNum}>
                  <Text style={mmStyles.matchNumTxt}>Jogo {m.matchNumber}</Text>
                  {m.date && <Text style={mmStyles.matchDate}>{fmtDate(m.date)}</Text>}
                </View>

                <View style={mmStyles.matchBody}>
                  {/* Home slot */}
                  <View style={mmStyles.slotSide}>
                    {m.homeTeam ? (
                      <>
                        <Text style={mmStyles.slotFlag}>{m.homeTeam.flag}</Text>
                        <Text style={mmStyles.slotName}>{m.homeTeam.name}</Text>
                      </>
                    ) : (
                      <Text style={mmStyles.slotTbd}>{m.homeSlot}</Text>
                    )}
                  </View>

                  {/* Score */}
                  <View style={mmStyles.vs}>
                    {m.homeScore !== null && m.awayScore !== null ? (
                      <Text style={mmStyles.score}>{m.homeScore} – {m.awayScore}</Text>
                    ) : (
                      <Text style={mmStyles.vsText}>×</Text>
                    )}
                  </View>

                  {/* Away slot */}
                  <View style={[mmStyles.slotSide, mmStyles.slotAway]}>
                    {m.awayTeam ? (
                      <>
                        <Text style={mmStyles.slotFlag}>{m.awayTeam.flag}</Text>
                        <Text style={mmStyles.slotName}>{m.awayTeam.name}</Text>
                      </>
                    ) : (
                      <Text style={mmStyles.slotTbd}>{m.awaySlot}</Text>
                    )}
                  </View>
                </View>

                {m.venue && (
                  <Text style={mmStyles.venue} numberOfLines={1}>{m.venue} · {m.city}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const mmStyles = StyleSheet.create({
  roundNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  arrow: { width: 36, alignItems: 'center' },
  roundLabel: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  tabs: { backgroundColor: Colors.backgroundAlt, maxHeight: 42 },
  tab: {
    paddingHorizontal: Spacing.sm, paddingVertical: 5,
    borderRadius: BorderRadius.sm, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.accentGold, borderColor: Colors.accentGold },
  tabTxt: { fontSize: 11, fontWeight: FontWeights.semibold, color: Colors.textSecondary },
  tabTxtActive: { color: Colors.background },
  notice: {
    flexDirection: 'row', gap: 6, alignItems: 'flex-start',
    margin: Spacing.md, padding: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  noticeTxt: { flex: 1, fontSize: 11, color: Colors.textSecondary, lineHeight: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.sm, gap: Spacing.sm },
  matchCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md, marginTop: Spacing.md,
    borderRadius: BorderRadius.md, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
    ...Shadows.sm,
  },
  matchCardWide: { width: '47%', marginHorizontal: 0, marginTop: 0 },
  matchNum: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.backgroundAlt,
    paddingHorizontal: Spacing.sm, paddingVertical: 5,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  matchNumTxt: { fontSize: 10, fontWeight: FontWeights.semibold, color: Colors.accentGold },
  matchDate: { fontSize: 10, color: Colors.textSecondary },
  matchBody: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.md,
  },
  slotSide: { flex: 1, alignItems: 'center', gap: 4 },
  slotAway: {},
  slotFlag: { fontSize: 24 },
  slotName: { fontSize: 12, fontWeight: FontWeights.semibold, color: Colors.textPrimary, textAlign: 'center' },
  slotTbd: {
    fontSize: 11, color: Colors.textSecondary, textAlign: 'center',
    fontStyle: 'italic', lineHeight: 15,
  },
  vs: { width: 56, alignItems: 'center' },
  vsText: { fontSize: FontSizes.lg, color: Colors.border, fontWeight: FontWeights.bold },
  score: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.accentGold },
  venue: {
    fontSize: 10, color: Colors.textSecondary,
    textAlign: 'center', paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  empty: { padding: Spacing.xl, alignItems: 'center' },
  emptyTxt: { color: Colors.textSecondary, fontSize: FontSizes.sm },
});

// ─── Root screen ──────────────────────────────────────────────────────────────

export default function TabelasScreen(): React.JSX.Element {
  const [phase, setPhase] = useState<Phase>('grupos');

  return (
    <View style={rootStyles.root}>
      <ScreenHeader
        title="Tabelas"
        subtitle="Copa do Mundo FIFA 2026"
      />

      <PhaseNav phase={phase} onChange={setPhase} />

      <View style={{ flex: 1 }}>
        {phase === 'grupos'    && <FaseDeGrupos />}
        {phase === 'terceiros' && <TerceirosColocados />}
        {phase === 'criterios' && <CriteriosView />}
        {phase === 'matamata'  && <MataMataView />}
      </View>
    </View>
  );
}

const rootStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundAlt },
});
