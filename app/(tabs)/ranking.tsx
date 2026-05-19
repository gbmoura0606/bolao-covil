// REGRA: Este arquivo consome APENAS services/computed.ts para dados derivados.
// Para atualizar resultados edite worldcup2026.ts → tudo aqui se atualiza sozinho.

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Dimensions, Platform, UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ScreenHeader';
import {
  computeGroupStandings,
  ALL_STANDINGS, THIRD_RANKING, OVERALL_RANKING, BRACKET,
  getClassificationCriteria,
  GROUPS,
  type WCStanding, type RankedStanding, type ResolvedKnockoutMatch, type KnockoutRound,
} from '@/services/computed';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '@/constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_W } = Dimensions.get('window');
const IS_WIDE = SCREEN_W >= 700;

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
  r32: 'Rodada de 32', r16: 'Oitavas de Final',
  qf: 'Quartas de Final', sf: 'Semifinais',
  final: 'Final', terceiro: '3º Lugar',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string): string {
  const [, m, day] = d.split('-');
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${parseInt(day, 10)} ${months[parseInt(m, 10) - 1]}`;
}

// ─── Phase navigation ─────────────────────────────────────────────────────────

function PhaseNav({ phase, onChange }: { phase: Phase; onChange: (p: Phase) => void }): React.JSX.Element {
  const idx = PHASES.indexOf(phase);
  return (
    <View style={pnS.bar}>
      <TouchableOpacity style={pnS.arrow} onPress={() => idx > 0 && onChange(PHASES[idx - 1])} disabled={idx === 0} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={20} color={idx > 0 ? Colors.accentGold : Colors.border} />
      </TouchableOpacity>
      <View style={pnS.center}>
        <Text style={pnS.label}>{PHASE_LABEL[phase]}</Text>
        <View style={pnS.dots}>
          {PHASES.map((p) => (
            <TouchableOpacity key={p} onPress={() => onChange(p)} activeOpacity={0.7}>
              <View style={[pnS.dot, p === phase && pnS.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <TouchableOpacity style={pnS.arrow} onPress={() => idx < PHASES.length - 1 && onChange(PHASES[idx + 1])} disabled={idx === PHASES.length - 1} activeOpacity={0.7}>
        <Ionicons name="chevron-forward" size={20} color={idx < PHASES.length - 1 ? Colors.accentGold : Colors.border} />
      </TouchableOpacity>
    </View>
  );
}
const pnS = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderBottomWidth: 2, borderBottomColor: Colors.accentGold, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm },
  arrow: { width: 40, alignItems: 'center', paddingVertical: 4 },
  center: { flex: 1, alignItems: 'center' },
  label: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.textPrimary, letterSpacing: 0.5, textTransform: 'uppercase' },
  dots: { flexDirection: 'row', gap: 6, marginTop: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.accentGold, width: 18 },
});

// ─── Standings table ──────────────────────────────────────────────────────────

function StandingsTable({ standings, highlightTop = 2 }: { standings: WCStanding[]; highlightTop?: number }): React.JSX.Element {
  return (
    <View>
      <View style={stS.header}>
        <View style={stS.posCol} />
        <View style={stS.teamCell} />
        <View style={stS.numCol}><Text style={stS.h}>P</Text></View>
        <View style={stS.numCol}><Text style={stS.h}>J</Text></View>
        <View style={stS.numCol}><Text style={stS.h}>V</Text></View>
        <View style={stS.numCol}><Text style={stS.h}>E</Text></View>
        <View style={stS.numCol}><Text style={stS.h}>D</Text></View>
        <View style={stS.numCol}><Text style={stS.h}>GP</Text></View>
        <View style={stS.numCol}><Text style={stS.h}>GC</Text></View>
        <View style={stS.numCol}><Text style={stS.h}>SG</Text></View>
        <View style={stS.pctCol}><Text style={stS.h}>%</Text></View>
        <View style={stS.lastCol}><Text style={stS.h}>Últ.</Text></View>
      </View>
      {standings.map((st, idx) => {
        const qualify = idx < highlightTop;
        const pct = st.played > 0 ? Math.round((st.won / st.played) * 100) : 0;
        return (
          <View key={st.team.id} style={[stS.row, idx < standings.length - 1 && stS.rowBorder, qualify && stS.rowQ]}>
            <View style={stS.posCol}><Text style={[stS.pos, qualify && stS.posQ]}>{idx + 1}</Text></View>
            <View style={stS.teamCell}>
              <Text style={stS.flag}>{st.team.flag}</Text>
              <Text style={stS.name} numberOfLines={1}>{st.team.name}</Text>
            </View>
            <View style={stS.numCol}><Text style={stS.pts}>{st.points}</Text></View>
            <View style={stS.numCol}><Text style={stS.val}>{st.played}</Text></View>
            <View style={stS.numCol}><Text style={stS.val}>{st.won}</Text></View>
            <View style={stS.numCol}><Text style={stS.val}>{st.drawn}</Text></View>
            <View style={stS.numCol}><Text style={stS.val}>{st.lost}</Text></View>
            <View style={stS.numCol}><Text style={stS.val}>{st.goalsFor}</Text></View>
            <View style={stS.numCol}><Text style={stS.val}>{st.goalsAgainst}</Text></View>
            <View style={stS.numCol}><Text style={[stS.val, st.goalDiff > 0 && stS.pos_, st.goalDiff < 0 && stS.neg]}>{st.goalDiff > 0 ? `+${st.goalDiff}` : st.goalDiff}</Text></View>
            <View style={stS.pctCol}><Text style={stS.val}>{pct}</Text></View>
            <View style={stS.lastCol}>
              <View style={stS.dots}>
                {st.lastResults.slice(-3).map((r, i) => (
                  <View key={i} style={[stS.dot, r === 'W' && stS.dW, r === 'D' && stS.dD, r === 'L' && stS.dL]} />
                ))}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}
const stS = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a2030', paddingHorizontal: Spacing.xs, paddingVertical: Spacing.xs + 2, borderBottomWidth: 1, borderBottomColor: Colors.border },
  h: { fontSize: 10, fontWeight: FontWeights.semibold, color: Colors.textSecondary, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xs, paddingVertical: 7 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(55,65,81,0.5)' },
  rowQ: { backgroundColor: 'rgba(245,158,11,0.05)' },
  posCol: { width: 20, alignItems: 'center' },
  teamCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  numCol: { width: 26, alignItems: 'center' },
  pctCol: { width: 26, alignItems: 'center' },
  lastCol: { width: 38, alignItems: 'center' },
  pos: { fontSize: 11, fontWeight: FontWeights.semibold, color: Colors.textSecondary },
  posQ: { color: Colors.accentGold },
  flag: { fontSize: 16 },
  name: { fontSize: 12, fontWeight: FontWeights.medium, color: Colors.textPrimary, flex: 1 },
  pts: { fontSize: 13, fontWeight: FontWeights.bold, color: Colors.textPrimary, textAlign: 'center' },
  val: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
  pos_: { color: Colors.success },
  neg: { color: Colors.error },
  dots: { flexDirection: 'row', gap: 2 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.border },
  dW: { backgroundColor: Colors.success },
  dD: { backgroundColor: Colors.textSecondary },
  dL: { backgroundColor: Colors.error },
});

// ─── Round matches panel ──────────────────────────────────────────────────────

function MatchesPanel({ groupId }: { groupId: string }): React.JSX.Element {
  const [round, setRound] = useState<1 | 2 | 3>(1);
  const group = GROUPS.find((g) => g.id === groupId)!;
  const matches = group.matches.filter((m) => m.round === round);
  const ridx = round - 1;

  return (
    <View style={mpS.wrap}>
      <View style={mpS.nav}>
        <TouchableOpacity onPress={() => round > 1 && setRound((round - 1) as 1|2|3)} disabled={round === 1} style={mpS.arr} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={16} color={round > 1 ? Colors.accentGold : Colors.border} />
        </TouchableOpacity>
        <Text style={mpS.roundLbl}>{ridx + 1}ª Rodada</Text>
        <TouchableOpacity onPress={() => round < 3 && setRound((round + 1) as 1|2|3)} disabled={round === 3} style={mpS.arr} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={16} color={round < 3 ? Colors.accentGold : Colors.border} />
        </TouchableOpacity>
      </View>
      {matches.map((m) => (
        <View key={m.id} style={mpS.card}>
          <Text style={mpS.venue} numberOfLines={1}>{m.venue}</Text>
          <Text style={mpS.date}>{fmtDate(m.date)} · {m.time}</Text>
          <View style={mpS.row}>
            <View style={mpS.side}>
              <Text style={mpS.mFlag}>{m.home.flag}</Text>
              <Text style={mpS.mTeam} numberOfLines={2}>{m.home.name}</Text>
            </View>
            <View style={mpS.scoreBox}>
              {m.homeScore !== null && m.awayScore !== null
                ? <Text style={mpS.score}>{m.homeScore} – {m.awayScore}</Text>
                : <View style={mpS.timeBox}><Text style={mpS.time}>{m.time}</Text></View>}
            </View>
            <View style={[mpS.side, mpS.sideAway]}>
              <Text style={mpS.mTeam} numberOfLines={2}>{m.away.name}</Text>
              <Text style={mpS.mFlag}>{m.away.flag}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
const mpS = StyleSheet.create({
  wrap: { flex: 1 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xs, paddingVertical: Spacing.sm, backgroundColor: Colors.backgroundAlt, borderBottomWidth: 1, borderBottomColor: Colors.border },
  arr: { width: 32, alignItems: 'center' },
  roundLbl: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  card: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(55,65,81,0.4)' },
  venue: { fontSize: 10, color: Colors.accentGold, fontWeight: FontWeights.medium },
  date: { fontSize: 10, color: Colors.textSecondary, marginBottom: Spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center' },
  side: { flex: 1, alignItems: 'center', gap: 3 },
  sideAway: {},
  mFlag: { fontSize: 22 },
  mTeam: { fontSize: 11, color: Colors.textPrimary, fontWeight: FontWeights.medium, textAlign: 'center' },
  scoreBox: { width: 64, alignItems: 'center' },
  score: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.accentGold },
  timeBox: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: Colors.border },
  time: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.textPrimary },
});

// ─── Group block (used in FASE DE GRUPOS) ────────────────────────────────────

function GroupBlock({ groupId }: { groupId: string }): React.JSX.Element {
  const group = GROUPS.find((g) => g.id === groupId)!;
  const standings = ALL_STANDINGS.get(groupId) ?? computeGroupStandings(group);

  return (
    <View style={gbS.card}>
      <View style={gbS.header}>
        <Text style={gbS.title}>{group.name}</Text>
        <Text style={gbS.flags}>{group.teams.map((t) => t.flag).join('  ')}</Text>
      </View>
      {IS_WIDE ? (
        <View style={gbS.split}>
          <View style={gbS.left}><StandingsTable standings={standings} /></View>
          <View style={gbS.divider} />
          <View style={gbS.right}><MatchesPanel groupId={groupId} /></View>
        </View>
      ) : (
        <>
          <StandingsTable standings={standings} />
          <View style={{ height: 1, backgroundColor: Colors.border }} />
          <MatchesPanel groupId={groupId} />
        </>
      )}
      <View style={gbS.legend}>
        <View style={[gbS.ldot, { backgroundColor: Colors.accentGold }]} />
        <Text style={gbS.ltxt}>Classificados para a Rodada de 32</Text>
      </View>
    </View>
  );
}
const gbS = StyleSheet.create({
  card: { backgroundColor: Colors.surface, marginHorizontal: Spacing.md, marginBottom: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...Shadows.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.backgroundAlt, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 2, borderBottomColor: Colors.accentGold },
  title: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.accentGold },
  flags: { fontSize: 16 },
  split: { flexDirection: 'row' },
  left: { flex: 3 },
  divider: { width: 1, backgroundColor: Colors.border },
  right: { flex: 2 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing.sm, paddingVertical: 5, borderTopWidth: 1, borderTopColor: Colors.border },
  ldot: { width: 8, height: 8, borderRadius: 4 },
  ltxt: { fontSize: 9, color: Colors.textSecondary },
});

// ─── FASE DE GRUPOS ───────────────────────────────────────────────────────────

function FaseDeGrupos(): React.JSX.Element {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: Spacing.sm, paddingBottom: Spacing.xxl }}>
      {GROUPS.map((g) => <GroupBlock key={g.id} groupId={g.id} />)}
    </ScrollView>
  );
}

// ─── TERCEIROS COLOCADOS ──────────────────────────────────────────────────────

function TerceirosColocados(): React.JSX.Element {
  const thirds = THIRD_RANKING;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={t3S.info}>
        <Ionicons name="information-circle-outline" size={14} color={Colors.textSecondary} />
        <Text style={t3S.infoTxt}>
          Os 8 melhores 3os colocados (de 12 grupos) avançam para a Rodada de 32.
          Critérios: pontos → saldo de gols → gols marcados → fair play.
        </Text>
      </View>

      <View style={t3S.header}>
        <View style={t3S.rankCol} />
        <View style={t3S.grpCol}><Text style={t3S.h}>Grp</Text></View>
        <View style={t3S.teamCell} />
        <View style={t3S.numCol}><Text style={t3S.h}>P</Text></View>
        <View style={t3S.numCol}><Text style={t3S.h}>J</Text></View>
        <View style={t3S.numCol}><Text style={t3S.h}>V</Text></View>
        <View style={t3S.numCol}><Text style={t3S.h}>E</Text></View>
        <View style={t3S.numCol}><Text style={t3S.h}>D</Text></View>
        <View style={t3S.numCol}><Text style={t3S.h}>GP</Text></View>
        <View style={t3S.numCol}><Text style={t3S.h}>GC</Text></View>
        <View style={t3S.numCol}><Text style={t3S.h}>SG</Text></View>
      </View>

      {thirds.map((st, idx) => {
        const qualifies = idx < 8;
        return (
          <View key={st.team.id} style={[t3S.row, qualifies && t3S.rowQ, idx === 7 && t3S.cutRow]}>
            <View style={t3S.rankCol}><Text style={[t3S.rank, qualifies && t3S.rankQ]}>{idx + 1}</Text></View>
            <View style={t3S.grpCol}><Text style={t3S.grp}>{st.groupId}</Text></View>
            <View style={t3S.teamCell}>
              <Text style={t3S.flag}>{st.team.flag}</Text>
              <Text style={t3S.name} numberOfLines={1}>{st.team.name}</Text>
            </View>
            <View style={t3S.numCol}><Text style={t3S.pts}>{st.points}</Text></View>
            <View style={t3S.numCol}><Text style={t3S.val}>{st.played}</Text></View>
            <View style={t3S.numCol}><Text style={t3S.val}>{st.won}</Text></View>
            <View style={t3S.numCol}><Text style={t3S.val}>{st.drawn}</Text></View>
            <View style={t3S.numCol}><Text style={t3S.val}>{st.lost}</Text></View>
            <View style={t3S.numCol}><Text style={t3S.val}>{st.goalsFor}</Text></View>
            <View style={t3S.numCol}><Text style={t3S.val}>{st.goalsAgainst}</Text></View>
            <View style={t3S.numCol}><Text style={[t3S.val, st.goalDiff > 0 && { color: Colors.success }, st.goalDiff < 0 && { color: Colors.error }]}>{st.goalDiff > 0 ? `+${st.goalDiff}` : st.goalDiff}</Text></View>
          </View>
        );
      })}

      <View style={t3S.cutLine}><Text style={t3S.cutTxt}>▲ Classificados (8)  ·  Eliminados ▼</Text></View>
    </ScrollView>
  );
}
const t3S = StyleSheet.create({
  info: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', margin: Spacing.md, padding: Spacing.sm, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border },
  infoTxt: { flex: 1, fontSize: 11, color: Colors.textSecondary, lineHeight: 16 },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a2030', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs + 2, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border },
  h: { fontSize: 10, fontWeight: FontWeights.semibold, color: Colors.textSecondary, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(55,65,81,0.4)' },
  rowQ: { backgroundColor: 'rgba(245,158,11,0.05)' },
  cutRow: { borderBottomColor: Colors.accentGold, borderBottomWidth: 2 },
  rankCol: { width: 22, alignItems: 'center' },
  grpCol: { width: 28, alignItems: 'center' },
  teamCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  numCol: { width: 26, alignItems: 'center' },
  rank: { fontSize: 12, fontWeight: FontWeights.bold, color: Colors.textSecondary },
  rankQ: { color: Colors.accentGold },
  grp: { fontSize: 11, fontWeight: FontWeights.bold, color: Colors.accentGold },
  flag: { fontSize: 16 },
  name: { fontSize: 12, fontWeight: FontWeights.medium, color: Colors.textPrimary, flex: 1 },
  pts: { fontSize: 13, fontWeight: FontWeights.bold, color: Colors.textPrimary, textAlign: 'center' },
  val: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
  cutLine: { padding: Spacing.sm, alignItems: 'center', borderTopWidth: 2, borderTopColor: Colors.accentGold, backgroundColor: 'rgba(245,158,11,0.06)', marginBottom: Spacing.xl },
  cutTxt: { fontSize: 10, color: Colors.accentGold, fontWeight: FontWeights.semibold },
});

// ─── CRITÉRIOS ────────────────────────────────────────────────────────────────

function CriteriosView(): React.JSX.Element {
  const criteria = getClassificationCriteria();
  const overall: RankedStanding[] = OVERALL_RANKING;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.xxl }}>
      {/* Criteria list */}
      <View style={crS.section}>
        <Text style={crS.sectionTitle}>Critérios de Classificação FIFA 2026</Text>
        <Text style={crS.sectionSub}>Em caso de empate de pontos, a classificação é definida nesta ordem:</Text>
      </View>
      {criteria.map((c) => (
        <View key={c.order} style={crS.criteriaRow}>
          <View style={crS.badge}><Text style={crS.badgeNum}>{c.order}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={crS.criteriaTitle}>{c.title}</Text>
            <Text style={crS.criteriaDesc}>{c.description}</Text>
          </View>
        </View>
      ))}

      <View style={crS.divider} />

      {/* Global 48-team ranking */}
      <Text style={[crS.sectionTitle, { paddingHorizontal: Spacing.md }]}>Classificação Geral — 48 Seleções</Text>
      <Text style={[crS.sectionSub, { paddingHorizontal: Spacing.md, marginBottom: Spacing.sm }]}>
        Ordenação global por pontos → saldo → gols. Atualiza automaticamente conforme os resultados.
      </Text>

      <View style={crS.tableHeader}>
        <View style={crS.oRankCol} />
        <View style={crS.oGrpCol}><Text style={crS.h}>Grp</Text></View>
        <View style={crS.oTeamCell} />
        <View style={crS.oNumCol}><Text style={crS.h}>P</Text></View>
        <View style={crS.oNumCol}><Text style={crS.h}>J</Text></View>
        <View style={crS.oNumCol}><Text style={crS.h}>V</Text></View>
        <View style={crS.oNumCol}><Text style={crS.h}>E</Text></View>
        <View style={crS.oNumCol}><Text style={crS.h}>D</Text></View>
        <View style={crS.oNumCol}><Text style={crS.h}>GP</Text></View>
        <View style={crS.oNumCol}><Text style={crS.h}>GC</Text></View>
        <View style={crS.oNumCol}><Text style={crS.h}>SG</Text></View>
      </View>

      {overall.map((st, idx) => (
        <View key={st.team.id} style={[crS.oRow, idx < overall.length - 1 && crS.oRowBorder]}>
          <View style={crS.oRankCol}><Text style={crS.oRank}>{idx + 1}</Text></View>
          <View style={crS.oGrpCol}><Text style={crS.oGrp}>{st.groupId}</Text></View>
          <View style={crS.oTeamCell}>
            <Text style={crS.oFlag}>{st.team.flag}</Text>
            <Text style={crS.oName} numberOfLines={1}>{st.team.name}</Text>
          </View>
          <View style={crS.oNumCol}><Text style={crS.opts}>{st.points}</Text></View>
          <View style={crS.oNumCol}><Text style={crS.oval}>{st.played}</Text></View>
          <View style={crS.oNumCol}><Text style={crS.oval}>{st.won}</Text></View>
          <View style={crS.oNumCol}><Text style={crS.oval}>{st.drawn}</Text></View>
          <View style={crS.oNumCol}><Text style={crS.oval}>{st.lost}</Text></View>
          <View style={crS.oNumCol}><Text style={crS.oval}>{st.goalsFor}</Text></View>
          <View style={crS.oNumCol}><Text style={crS.oval}>{st.goalsAgainst}</Text></View>
          <View style={crS.oNumCol}><Text style={[crS.oval, st.goalDiff > 0 && { color: Colors.success }, st.goalDiff < 0 && { color: Colors.error }]}>{st.goalDiff > 0 ? `+${st.goalDiff}` : st.goalDiff}</Text></View>
        </View>
      ))}
    </ScrollView>
  );
}
const crS = StyleSheet.create({
  section: { padding: Spacing.md },
  sectionTitle: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.accentGold, marginBottom: 4 },
  sectionSub: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  criteriaRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  badge: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.accentGold, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  badgeNum: { fontSize: 12, fontWeight: FontWeights.bold, color: Colors.background },
  criteriaTitle: { fontSize: 13, fontWeight: FontWeights.semibold, color: Colors.textPrimary, marginBottom: 2 },
  criteriaDesc: { fontSize: 11, color: Colors.textSecondary, lineHeight: 16 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md, marginHorizontal: Spacing.md },
  tableHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a2030', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs + 2, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border },
  h: { fontSize: 10, fontWeight: FontWeights.semibold, color: Colors.textSecondary, textAlign: 'center' },
  oRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 7 },
  oRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(55,65,81,0.4)' },
  oRankCol: { width: 26, alignItems: 'center' },
  oGrpCol: { width: 26, alignItems: 'center' },
  oTeamCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  oNumCol: { width: 26, alignItems: 'center' },
  oRank: { fontSize: 11, fontWeight: FontWeights.semibold, color: Colors.textSecondary },
  oGrp: { fontSize: 11, fontWeight: FontWeights.bold, color: Colors.accentGold },
  oFlag: { fontSize: 15 },
  oName: { fontSize: 12, fontWeight: FontWeights.medium, color: Colors.textPrimary, flex: 1 },
  opts: { fontSize: 13, fontWeight: FontWeights.bold, color: Colors.textPrimary, textAlign: 'center' },
  oval: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
});

// ─── MATA-MATA ────────────────────────────────────────────────────────────────

function MataMataView(): React.JSX.Element {
  const [koRound, setKoRound] = useState<KnockoutRound>('r32');
  const matches = BRACKET.filter((m) => m.round === koRound);
  const ridx = KNOCKOUT_ROUNDS.indexOf(koRound);

  return (
    <View style={{ flex: 1 }}>
      <View style={mmS.roundNav}>
        <TouchableOpacity style={mmS.arrow} onPress={() => ridx > 0 && setKoRound(KNOCKOUT_ROUNDS[ridx - 1])} disabled={ridx === 0} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color={ridx > 0 ? Colors.accentGold : Colors.border} />
        </TouchableOpacity>
        <Text style={mmS.roundLabel}>{KO_LABEL[koRound]}</Text>
        <TouchableOpacity style={mmS.arrow} onPress={() => ridx < KNOCKOUT_ROUNDS.length - 1 && setKoRound(KNOCKOUT_ROUNDS[ridx + 1])} disabled={ridx === KNOCKOUT_ROUNDS.length - 1} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={18} color={ridx < KNOCKOUT_ROUNDS.length - 1 ? Colors.accentGold : Colors.border} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={mmS.tabs} contentContainerStyle={{ gap: 6, paddingHorizontal: Spacing.sm, paddingVertical: 6 }}>
        {KNOCKOUT_ROUNDS.map((r) => (
          <TouchableOpacity key={r} style={[mmS.tab, r === koRound && mmS.tabActive]} onPress={() => setKoRound(r)} activeOpacity={0.75}>
            <Text style={[mmS.tabTxt, r === koRound && mmS.tabTxtActive]}>{KO_LABEL[r]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: Spacing.xxl }} showsVerticalScrollIndicator={false}>
        {koRound === 'r32' && (
          <View style={mmS.notice}>
            <Ionicons name="information-circle-outline" size={13} color={Colors.textSecondary} />
            <Text style={mmS.noticeTxt}>
              Os 8 melhores 3os colocados serão distribuídos conforme tabela oficial FIFA.
              Times nos slots são preenchidos automaticamente ao atualizar os resultados da fase de grupos.
            </Text>
          </View>
        )}

        <View style={IS_WIDE ? mmS.grid : undefined}>
          {matches.map((m: ResolvedKnockoutMatch) => (
            <View key={m.id} style={[mmS.card, IS_WIDE && mmS.cardWide]}>
              <View style={mmS.cardHeader}>
                <Text style={mmS.matchNum}>Jogo {m.matchNumber}</Text>
                {m.date && <Text style={mmS.matchDate}>{fmtDate(m.date)}</Text>}
              </View>
              <View style={mmS.matchBody}>
                <View style={mmS.slot}>
                  {m.homeTeam ? (<><Text style={mmS.slotFlag}>{m.homeTeam.flag}</Text><Text style={mmS.slotName}>{m.homeTeam.name}</Text></>) : (<Text style={mmS.slotTbd}>{m.homeSlot}</Text>)}
                </View>
                <View style={mmS.vs}>
                  {m.homeScore !== null && m.awayScore !== null
                    ? <Text style={mmS.score}>{m.homeScore} – {m.awayScore}</Text>
                    : <Text style={mmS.vsText}>×</Text>}
                </View>
                <View style={[mmS.slot, mmS.slotAway]}>
                  {m.awayTeam ? (<><Text style={mmS.slotFlag}>{m.awayTeam.flag}</Text><Text style={mmS.slotName}>{m.awayTeam.name}</Text></>) : (<Text style={mmS.slotTbd}>{m.awaySlot}</Text>)}
                </View>
              </View>
              {m.venue && <Text style={mmS.venue}>{m.venue} · {m.city}</Text>}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
const mmS = StyleSheet.create({
  roundNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  arrow: { width: 36, alignItems: 'center' },
  roundLabel: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  tabs: { backgroundColor: Colors.backgroundAlt, maxHeight: 42 },
  tab: { paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: BorderRadius.sm, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.accentGold, borderColor: Colors.accentGold },
  tabTxt: { fontSize: 11, fontWeight: FontWeights.semibold, color: Colors.textSecondary },
  tabTxtActive: { color: Colors.background },
  notice: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', margin: Spacing.md, padding: Spacing.sm, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border },
  noticeTxt: { flex: 1, fontSize: 11, color: Colors.textSecondary, lineHeight: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.sm, gap: Spacing.sm },
  card: { backgroundColor: Colors.surface, marginHorizontal: Spacing.md, marginTop: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...Shadows.sm },
  cardWide: { width: '47%', marginHorizontal: 0, marginTop: 0 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.backgroundAlt, paddingHorizontal: Spacing.sm, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: Colors.border },
  matchNum: { fontSize: 10, fontWeight: FontWeights.semibold, color: Colors.accentGold },
  matchDate: { fontSize: 10, color: Colors.textSecondary },
  matchBody: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.md },
  slot: { flex: 1, alignItems: 'center', gap: 4 },
  slotAway: {},
  slotFlag: { fontSize: 24 },
  slotName: { fontSize: 12, fontWeight: FontWeights.semibold, color: Colors.textPrimary, textAlign: 'center' },
  slotTbd: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center', fontStyle: 'italic', lineHeight: 15 },
  vs: { width: 56, alignItems: 'center' },
  vsText: { fontSize: FontSizes.lg, color: Colors.border, fontWeight: FontWeights.bold },
  score: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.accentGold },
  venue: { fontSize: 10, color: Colors.textSecondary, textAlign: 'center', paddingBottom: Spacing.sm, paddingHorizontal: Spacing.sm },
});

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function TabelasScreen(): React.JSX.Element {
  const [phase, setPhase] = useState<Phase>('grupos');
  return (
    <View style={{ flex: 1, backgroundColor: Colors.backgroundAlt }}>
      <ScreenHeader title="Tabelas" subtitle="Copa do Mundo FIFA 2026" />
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
