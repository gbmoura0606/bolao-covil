import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Dimensions, Platform, UIManager, ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlagImage } from '@/components/FlagImage';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/hooks/useAuth';
import { patchMatchScore, resetMatchScore } from '@/services/matches';
import { getStandingsData } from '@/services/standings';
import type { StandingsData, StandingRow, ApiGroup, BracketMatch, GroupMatch } from '@/services/standings';
import {
  buildBracketLayout, CW, CH, COL_ORDER, COL_LABELS, type LineSegment,
} from '@/components/bracketLayout';
import { BracketCanvas } from '@/components/BracketCanvas';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '@/constants/theme';

const FINISH_DELAY_MS = 105 * 60_000;
const CONFIRM_TIMEOUT_MS = 4000;

function kickoffLocal(iso: string): Date {
  return new Date(iso.replace(/(\.\d{3})?Z$/, ''));
}

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  OPEN:     { label: 'PRÉ-JOGO',     color: Colors.success,    bg: 'rgba(34,197,94,0.12)' },
  CLOSED:   { label: 'EM ANDAMENTO', color: Colors.accentGold, bg: 'rgba(245,158,11,0.12)' },
  FINISHED: { label: 'ENCERRADO',    color: Colors.error,      bg: 'rgba(239,68,68,0.12)' },
};

function MatchStatusBadge({ status }: { status: string }): React.JSX.Element {
  const b = STATUS_BADGE[status] ?? STATUS_BADGE.OPEN;
  return (
    <View style={[adS.badge, { backgroundColor: b.bg, borderColor: b.color }]}>
      <View style={[adS.badgeDot, { backgroundColor: b.color }]} />
      <Text style={[adS.badgeTxt, { color: b.color }]}>{b.label}</Text>
    </View>
  );
}

/** Forma mínima que os controles de admin precisam — atende GroupMatch e BracketMatch. */
interface EditableMatch {
  id: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  matchDate: string;
  homePenalty?: number | null;
  awayPenalty?: number | null;
}

function AdminMatchControls({
  match,
  onSaved,
  allowPenalties = false,
  hideScoreInputs = false,
  penaltiesAlwaysVisible = false,
}: {
  match: EditableMatch;
  onSaved: () => void;
  /** Mata-mata: habilita disputa de pênaltis quando o tempo normal termina empatado. */
  allowPenalties?: boolean;
  /** Quando o placar é editado fora (caixinhas inline), oculta os inputs de gols aqui. */
  hideScoreInputs?: boolean;
  /** Mostra os campos de pênalti sempre (admin), habilitando-os só no empate. */
  penaltiesAlwaysVisible?: boolean;
}): React.JSX.Element {
  const [home, setHome] = useState(match.homeScore?.toString() ?? '');
  const [away, setAway] = useState(match.awayScore?.toString() ?? '');
  const [homePen, setHomePen] = useState(match.homePenalty?.toString() ?? '');
  const [awayPen, setAwayPen] = useState(match.awayPenalty?.toString() ?? '');
  const [confirming, setConfirming] = useState<'save' | 'finish' | 'reset' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHome(match.homeScore?.toString() ?? '');
    setAway(match.awayScore?.toString() ?? '');
    setHomePen(match.homePenalty?.toString() ?? '');
    setAwayPen(match.awayPenalty?.toString() ?? '');
  }, [match.homeScore, match.awayScore, match.homePenalty, match.awayPenalty]);

  useEffect(() => () => { if (confirmTimer.current) clearTimeout(confirmTimer.current); }, []);

  const isFinished = match.status === 'FINISHED';
  const kickoff = kickoffLocal(match.matchDate);
  const started = Date.now() >= kickoff.getTime();
  const canFinish = !isFinished && Date.now() >= kickoff.getTime() + FINISH_DELAY_MS;
  const canReset = !isFinished && !started;
  const hasScore = home !== '' && away !== '';
  const isDraw = hasScore && home === away;
  const showPen = allowPenalties && (isDraw || penaltiesAlwaysVisible);
  const dirty =
    home !== (match.homeScore?.toString() ?? '') ||
    away !== (match.awayScore?.toString() ?? '') ||
    homePen !== (match.homePenalty?.toString() ?? '') ||
    awayPen !== (match.awayPenalty?.toString() ?? '');

  /** Campos de pênalti a enviar: preenchidos no empate, limpos caso contrário. */
  function penaltyBody(): Record<string, number | null> {
    if (!allowPenalties) return {};
    // Pênaltis só contam (e são salvos) quando o tempo normal termina empatado.
    if (isDraw && homePen !== '' && awayPen !== '') {
      return { homePenalty: parseInt(homePen, 10), awayPenalty: parseInt(awayPen, 10) };
    }
    return { homePenalty: null, awayPenalty: null };
  }

  function arm(action: 'save' | 'finish' | 'reset'): boolean {
    if (confirming === action) {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      setConfirming(null);
      return true;
    }
    setConfirming(action);
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    confirmTimer.current = setTimeout(() => setConfirming(null), CONFIRM_TIMEOUT_MS);
    return false;
  }

  async function doSave(body: Record<string, unknown>): Promise<void> {
    setError('');
    setSaving(true);
    try {
      await patchMatchScore(match.id, body);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function doReset(): Promise<void> {
    setError('');
    setSaving(true);
    try {
      await resetMatchScore(match.id);
      setHome('');
      setAway('');
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao resetar.');
    } finally {
      setSaving(false);
    }
  }

  if (isFinished) {
    return (
      <View style={adS.lockedRow}>
        <Ionicons name="lock-closed" size={10} color={Colors.textSecondary} />
        <Text style={adS.lockedTxt}>Encerrado — placar travado</Text>
      </View>
    );
  }

  return (
    <View style={adS.adminWrap}>
      {!hideScoreInputs && (
        <View style={adS.inputsRow}>
          <TextInput
            style={[adS.input, home !== '' && adS.inputFilled]}
            value={home}
            onChangeText={(v) => setHome(v.replace(/[^0-9]/g, '').slice(0, 2))}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="?"
            placeholderTextColor={Colors.border}
            selectTextOnFocus
          />
          <Text style={adS.sep}>×</Text>
          <TextInput
            style={[adS.input, away !== '' && adS.inputFilled]}
            value={away}
            onChangeText={(v) => setAway(v.replace(/[^0-9]/g, '').slice(0, 2))}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="?"
            placeholderTextColor={Colors.border}
            selectTextOnFocus
          />
        </View>
      )}

      {showPen && (
        <View style={[adS.penRow, !isDraw && adS.penRowDim]}>
          <Text style={adS.penLabel}>Pênaltis{!isDraw ? ' (só no empate)' : ''}</Text>
          <TextInput
            style={[adS.penInput, homePen !== '' && adS.inputFilled]}
            value={homePen}
            onChangeText={(v) => setHomePen(v.replace(/[^0-9]/g, '').slice(0, 2))}
            editable={isDraw}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="?"
            placeholderTextColor={Colors.border}
            selectTextOnFocus
          />
          <Text style={adS.sep}>×</Text>
          <TextInput
            style={[adS.penInput, awayPen !== '' && adS.inputFilled]}
            value={awayPen}
            onChangeText={(v) => setAwayPen(v.replace(/[^0-9]/g, '').slice(0, 2))}
            editable={isDraw}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="?"
            placeholderTextColor={Colors.border}
            selectTextOnFocus
          />
        </View>
      )}

      <View style={adS.btnsRow}>
        {!hideScoreInputs && dirty && hasScore && (
          <TouchableOpacity
            style={[adS.btn, adS.btnSave, confirming === 'save' && adS.btnConfirm]}
            onPress={() => {
              if (!arm('save')) return;
              const body: Record<string, unknown> = {
                homeScore: parseInt(home, 10),
                awayScore: parseInt(away, 10),
                ...penaltyBody(),
              };
              if (match.status === 'OPEN' && started) body.status = 'CLOSED';
              void doSave(body);
            }}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving && confirming !== 'finish' && confirming !== 'reset'
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={adS.btnTxt}>{confirming === 'save' ? 'Confirmar?' : 'Salvar'}</Text>}
          </TouchableOpacity>
        )}
        {canFinish && hasScore && (
          <TouchableOpacity
            style={[adS.btn, adS.btnFinish, confirming === 'finish' && adS.btnConfirm]}
            onPress={() => {
              if (!arm('finish')) return;
              void doSave({ homeScore: parseInt(home, 10), awayScore: parseInt(away, 10), status: 'FINISHED', ...penaltyBody() });
            }}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving && confirming === 'finish'
              ? <ActivityIndicator size="small" color="#fff" />
              : <><Ionicons name="lock-closed" size={11} color="#fff" /><Text style={adS.btnTxt}>{confirming === 'finish' ? 'Confirmar?' : 'Encerrar'}</Text></>}
          </TouchableOpacity>
        )}
        {canReset && (
          <TouchableOpacity
            style={[adS.btn, adS.btnReset, confirming === 'reset' && adS.btnConfirm]}
            onPress={() => { if (!arm('reset')) return; void doReset(); }}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={11} color="#fff" />
            <Text style={adS.btnTxt}>{confirming === 'reset' ? 'Resetar?' : 'Resetar'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {error !== '' && <Text style={adS.error}>{error}</Text>}
    </View>
  );
}

const adS = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: BorderRadius.sm, borderWidth: 1,
  },
  badgeDot: { width: 5, height: 5, borderRadius: 3 },
  badgeTxt: { fontSize: 9, fontWeight: FontWeights.bold, letterSpacing: 0.5 },
  lockedRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingTop: 3, paddingBottom: 4,
  },
  lockedTxt: { fontSize: 9, color: Colors.textSecondary },
  adminWrap: { paddingTop: Spacing.xs, paddingBottom: 2 },
  inputsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 5 },
  input: {
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 2, borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    width: 36, height: 36,
    fontSize: FontSizes.md, fontWeight: FontWeights.bold,
    color: Colors.textPrimary, textAlign: 'center',
  },
  inputFilled: { borderColor: '#3B82F6' },
  sep: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: FontWeights.bold },
  penRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 5 },
  penRowDim: { opacity: 0.5 },
  penLabel: { fontSize: 9, color: Colors.textSecondary, fontWeight: FontWeights.bold, marginRight: 2, textTransform: 'uppercase' },
  penInput: {
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 2, borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    width: 30, height: 30,
    fontSize: FontSizes.sm, fontWeight: FontWeights.bold,
    color: Colors.textPrimary, textAlign: 'center',
  },
  btnsRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', justifyContent: 'center' },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingVertical: 5, paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
  },
  btnSave: { backgroundColor: '#3B82F6' },
  btnFinish: { backgroundColor: Colors.error },
  btnReset: { backgroundColor: Colors.textSecondary },
  btnConfirm: { opacity: 0.85 },
  btnTxt: { fontSize: 10, fontWeight: FontWeights.bold, color: '#fff' },
  error: { fontSize: 10, color: Colors.error, textAlign: 'center', marginTop: 3 },
});

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

type KnockoutRound = 'r32' | 'r16' | 'qf' | 'sf' | 'final' | 'terceiro';
const KO_LABEL: Record<KnockoutRound, string> = {
  r32: 'Rodada de 32', r16: 'Oitavas de Final',
  qf: 'Quartas de Final', sf: 'Semifinais',
  final: 'Final', terceiro: '3º Lugar',
};

const CLASSIFICATION_CRITERIA = [
  { order: 1, title: 'Pontos', description: 'Vitória = 3 pts · Empate = 1 pt · Derrota = 0 pts' },
  { order: 2, title: 'Saldo de Gols', description: 'Gols marcados menos gols sofridos nos jogos do grupo.' },
  { order: 3, title: 'Gols Marcados', description: 'Total de gols marcados na fase de grupos.' },
  { order: 4, title: 'Confronto Direto — Pontos', description: 'Pontos obtidos nos jogos entre as seleções empatadas.' },
  { order: 5, title: 'Confronto Direto — Saldo', description: 'Saldo de gols nos confrontos diretos entre as seleções empatadas.' },
  { order: 6, title: 'Confronto Direto — Gols', description: 'Gols marcados nos confrontos diretos.' },
  { order: 7, title: 'Fair Play', description: 'Menor número de cartões ponderados (amarelo = 1 pt, vermelho = 3 pts).' },
  { order: 8, title: 'Ranking FIFA', description: 'Posição no ranking FIFA no momento do sorteio.' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(isoDate: string): string {
  const d = isoDate.substring(0, 10);
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

function StandingsTable({ standings, highlightTop = 2, qualifyingThirdIds }: {
  standings: StandingRow[];
  highlightTop?: number;
  qualifyingThirdIds?: Set<string>;
}): React.JSX.Element {
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
        const thirdQualifies = idx === 2 && (qualifyingThirdIds?.has(st.team.id) ?? false);
        const pct = st.played > 0 ? Math.round((st.won / st.played) * 100) : 0;
        return (
          <View key={st.team.id} style={[stS.row, idx < standings.length - 1 && stS.rowBorder, qualify && stS.rowQ, thirdQualifies && stS.rowT3]}>
            <View style={stS.posCol}><Text style={[stS.pos, qualify && stS.posQ, thirdQualifies && stS.posT3]}>{idx + 1}</Text></View>
            <View style={stS.teamCell}>
              <FlagImage country={st.team.country} height={16} />
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
  rowQ:  { backgroundColor: 'rgba(245,158,11,0.05)' },
  rowT3: { backgroundColor: 'rgba(16,185,129,0.06)' },
  posT3: { color: Colors.success },
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

/** Primeira rodada (1-3) que ainda tem jogos não encerrados; se todas completas, retorna a 3ª. */
function initialRoundForGroup(group: ApiGroup): 1 | 2 | 3 {
  for (const r of [1, 2, 3] as const) {
    const rMatches = group.matches.filter((m) => m.round === `R${r}`);
    if (rMatches.length > 0 && rMatches.some((m) => m.status !== 'FINISHED')) return r;
  }
  return 3;
}

function MatchesPanel({
  group, isAdmin, onMatchSaved,
}: {
  group: ApiGroup;
  isAdmin: boolean;
  onMatchSaved: () => void;
}): React.JSX.Element {
  const [round, setRound] = useState<1 | 2 | 3>(() => initialRoundForGroup(group));
  const matches = group.matches.filter((m) => m.round === `R${round}`);

  return (
    <View style={mpS.wrap}>
      <View style={mpS.nav}>
        <TouchableOpacity onPress={() => round > 1 && setRound((round - 1) as 1|2|3)} disabled={round === 1} style={mpS.arr} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={16} color={round > 1 ? Colors.accentGold : Colors.border} />
        </TouchableOpacity>
        <Text style={mpS.roundLbl}>{round}ª Rodada</Text>
        <TouchableOpacity onPress={() => round < 3 && setRound((round + 1) as 1|2|3)} disabled={round === 3} style={mpS.arr} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={16} color={round < 3 ? Colors.accentGold : Colors.border} />
        </TouchableOpacity>
      </View>
      {matches.map((m) => (
        <View key={m.id} style={mpS.card}>
          <View style={mpS.cardTop}>
            <View style={mpS.venueDate}>
              <Text style={mpS.venue} numberOfLines={1}>{m.venue}</Text>
              <Text style={mpS.date}>{fmtDate(m.matchDate)} · {m.matchDate.substring(11, 16)}</Text>
            </View>
            <MatchStatusBadge status={m.status} />
          </View>
          <View style={mpS.row}>
            <View style={mpS.side}>
              {m.homeTeam && <FlagImage country={m.homeTeam.country} height={22} />}
              <Text style={mpS.mTeam} numberOfLines={2}>{m.homeTeam?.name ?? '?'}</Text>
            </View>
            <View style={mpS.scoreBox}>
              {!isAdmin && (m.homeScore !== null && m.awayScore !== null
                ? <Text style={mpS.score}>{m.homeScore} – {m.awayScore}</Text>
                : <View style={mpS.timeBox}><Text style={mpS.time}>{m.matchDate.substring(11, 16)}</Text></View>)}
              {isAdmin && m.status === 'FINISHED' && m.homeScore !== null && m.awayScore !== null && (
                <Text style={mpS.score}>{m.homeScore} – {m.awayScore}</Text>
              )}
            </View>
            <View style={[mpS.side, mpS.sideAway]}>
              {m.awayTeam && <FlagImage country={m.awayTeam.country} height={22} />}
              <Text style={mpS.mTeam} numberOfLines={2}>{m.awayTeam?.name ?? '?'}</Text>
            </View>
          </View>
          {isAdmin && (
            <AdminMatchControls match={m} onSaved={onMatchSaved} />
          )}
        </View>
      ))}
    </View>
  );
}
const mpS = StyleSheet.create({
  wrap: { flex: 1, alignSelf: 'stretch' },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xs, paddingVertical: Spacing.sm, backgroundColor: Colors.backgroundAlt, borderBottomWidth: 1, borderBottomColor: Colors.border },
  arr: { width: 32, alignItems: 'center' },
  roundLbl: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  card: { paddingHorizontal: Spacing.sm, paddingTop: Spacing.xs, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(55,65,81,0.4)' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: Spacing.xs },
  venueDate: { flex: 1 },
  venue: { fontSize: 10, color: Colors.accentGold, fontWeight: FontWeights.medium },
  date: { fontSize: 10, color: Colors.textSecondary },
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

// ─── Group block ──────────────────────────────────────────────────────────────

function GroupBlock({
  group, qualifyingThirdIds, isAdmin, onMatchSaved,
}: {
  group: ApiGroup;
  qualifyingThirdIds: Set<string>;
  isAdmin: boolean;
  onMatchSaved: () => void;
}): React.JSX.Element {
  return (
    <View style={gbS.card}>
      <View style={gbS.header}>
        <Text style={gbS.title}>{group.name}</Text>
        <View style={gbS.flagsRow}>
          {group.teams.map((t) => <FlagImage key={t.id} country={t.country} height={16} />)}
        </View>
      </View>
      {IS_WIDE ? (
        <View style={gbS.split}>
          <View style={gbS.left}><StandingsTable standings={group.standings} qualifyingThirdIds={qualifyingThirdIds} /></View>
          <View style={gbS.divider} />
          <View style={gbS.right}><MatchesPanel group={group} isAdmin={isAdmin} onMatchSaved={onMatchSaved} /></View>
        </View>
      ) : (
        <>
          <StandingsTable standings={group.standings} qualifyingThirdIds={qualifyingThirdIds} />
          <View style={{ height: 1, backgroundColor: Colors.border }} />
          <MatchesPanel group={group} isAdmin={isAdmin} onMatchSaved={onMatchSaved} />
        </>
      )}
    </View>
  );
}
const gbS = StyleSheet.create({
  card: { backgroundColor: Colors.surface, marginHorizontal: Spacing.md, marginBottom: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...Shadows.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.backgroundAlt, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 2, borderBottomColor: Colors.accentGold },
  title: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.accentGold },
  flags: { fontSize: 16 },
  split: { flexDirection: 'row', alignItems: 'stretch' },
  left: { flex: 3 },
  divider: { width: 1, backgroundColor: Colors.border },
  right: { flex: 2, alignSelf: 'stretch' },
  flagsRow: { flexDirection: 'row', gap: 4 },
});

// ─── FASE DE GRUPOS ───────────────────────────────────────────────────────────

function FaseDeGrupos({
  groups, thirds, isAdmin, onMatchSaved,
}: {
  groups: ApiGroup[];
  thirds: StandingRow[];
  isAdmin: boolean;
  onMatchSaved: () => void;
}): React.JSX.Element {
  const qualifyingThirdIds = new Set(thirds.slice(0, 8).map((s) => s.team.id));
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: Spacing.sm, paddingBottom: Spacing.xxl }}>
      {groups.map((g) => <GroupBlock key={g.id} group={g} qualifyingThirdIds={qualifyingThirdIds} isAdmin={isAdmin} onMatchSaved={onMatchSaved} />)}
    </ScrollView>
  );
}

// ─── TERCEIROS COLOCADOS ──────────────────────────────────────────────────────

function TerceirosColocados({ thirds }: { thirds: StandingRow[] }): React.JSX.Element {
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
              <FlagImage country={st.team.country} height={16} />
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

function CriteriosView({ overall }: { overall: StandingRow[] }): React.JSX.Element {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.xxl }}>
      <View style={crS.section}>
        <Text style={crS.sectionTitle}>Critérios de Classificação FIFA 2026</Text>
        <Text style={crS.sectionSub}>Em caso de empate de pontos, a classificação é definida nesta ordem:</Text>
      </View>
      {CLASSIFICATION_CRITERIA.map((c) => (
        <View key={c.order} style={crS.criteriaRow}>
          <View style={crS.badge}><Text style={crS.badgeNum}>{c.order}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={crS.criteriaTitle}>{c.title}</Text>
            <Text style={crS.criteriaDesc}>{c.description}</Text>
          </View>
        </View>
      ))}

      <View style={crS.divider} />

      <Text style={[crS.sectionTitle, { paddingHorizontal: Spacing.md }]}>Classificação Geral — 48 Seleções</Text>
      <Text style={[crS.sectionSub, { paddingHorizontal: Spacing.md, marginBottom: Spacing.sm }]}>
        Ordenação global por pontos → saldo → gols. Atualiza conforme os resultados.
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
            <FlagImage country={st.team.country} height={15} />
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

// Layout do chaveamento (dimensões, ordem da árvore e linhas) vem de
// components/bracketLayout.ts — fonte única compartilhada com a aba Previsão.

// ── Card individual ───────────────────────────────────────────────────────────

function BracketCard({
  match, isAdmin, onMatchSaved, cardStyle,
}: {
  match: BracketMatch;
  isAdmin: boolean;
  onMatchSaved: () => void;
  cardStyle?: object;
}): React.JSX.Element {
  const teamsKnown = !!(match.homeTeam && match.awayTeam);
  const hasScore   = match.homeScore !== null && match.awayScore !== null;
  const hasPens    = match.homePenalty !== null && match.awayPenalty !== null;
  const editable   = isAdmin && teamsKnown && match.status !== 'FINISHED';

  let homeWin = false, awayWin = false;
  if (hasScore) {
    if (hasPens) homeWin = (match.homePenalty ?? 0) > (match.awayPenalty ?? 0);
    else homeWin = (match.homeScore ?? 0) > (match.awayScore ?? 0);
    awayWin = !homeWin && (match.homeScore !== match.awayScore || hasPens);
  }

  function TeamRow({ side }: { side: 'home' | 'away' }): React.JSX.Element {
    const team   = side === 'home' ? match.homeTeam : match.awayTeam;
    const slot   = side === 'home' ? match.homeSlot : match.awaySlot;
    const score  = side === 'home' ? match.homeScore : match.awayScore;
    const pen    = side === 'home' ? match.homePenalty : match.awayPenalty;
    const winner = side === 'home' ? homeWin : awayWin;
    return (
      <View style={[bkS.teamRow, winner && bkS.teamRowW]}>
        {team ? <FlagImage country={team.country} height={14} /> : <View style={bkS.flagPh} />}
        <Text style={[bkS.teamName, winner && bkS.teamNameW]} numberOfLines={1}>
          {team ? team.name : (slot ?? '?')}
        </Text>
        {/* Placar visível para todos quando há resultado (admin edita abaixo) */}
        {!editable && score !== null && (
          <View style={[bkS.scoreBadge, winner && bkS.scoreBadgeW]}>
            <Text style={[bkS.scoreText, winner && bkS.scoreTextW]}>{score}</Text>
            {pen !== null && <Text style={[bkS.penBadge, winner && bkS.scoreTextW]}> ({pen})</Text>}
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[bkS.card, cardStyle]}>
      <View style={bkS.cardHeader}>
        <Text style={bkS.matchNum}>J{match.matchNumber}</Text>
        <View style={bkS.headerRight}>
          {match.matchDate && (
            <Text style={bkS.headerDate}>{fmtDate(match.matchDate)} · {match.matchDate.substring(11, 16)}</Text>
          )}
          <View style={[bkS.dot, {
            backgroundColor:
              match.status === 'FINISHED' ? Colors.error :
              match.status === 'CLOSED'   ? Colors.accentGold : Colors.success,
          }]} />
        </View>
      </View>

      <TeamRow side="home" />
      <View style={bkS.divider} />
      <TeamRow side="away" />

      {/* Admin: mesmo fluxo da fase de grupos (salvar parcial, pênaltis no empate, encerrar 1h45 após) */}
      {editable && (
        <View style={bkS.adminInline}>
          <AdminMatchControls
            match={match}
            onSaved={onMatchSaved}
            allowPenalties
            penaltiesAlwaysVisible
          />
        </View>
      )}

      {!editable && match.venue && <Text style={bkS.venueTxt} numberOfLines={1}>{match.venue}</Text>}
    </View>
  );
}

// ── Linhas de conexão ─────────────────────────────────────────────────────────

function ConnectorLines({ lines }: { lines: LineSegment[] }): React.JSX.Element {
  return (
    <>
      {lines.map((l, i) => {
        const vTop = Math.min(l.y1, l.y2);
        const vLen = Math.abs(l.y2 - l.y1);
        return (
          <React.Fragment key={i}>
            {/* src → xMid horizontal */}
            <View style={[bkS.line, { left: l.x1, top: l.y1, width: l.xMid - l.x1 }]} />
            {/* vertical bend */}
            {vLen > 1 && (
              <View style={[bkS.line, { left: l.xMid, top: vTop, width: 1, height: vLen }]} />
            )}
            {/* xMid → dst horizontal */}
            <View style={[bkS.line, { left: l.xMid, top: l.y2, width: l.x2 - l.xMid }]} />
          </React.Fragment>
        );
      })}
    </>
  );
}

// ── MataMataView ──────────────────────────────────────────────────────────────

function MataMataView({
  bracket, isAdmin, onMatchSaved,
}: {
  bracket: BracketMatch[];
  isAdmin: boolean;
  onMatchSaved: () => void;
}): React.JSX.Element {
  const [availW, setAvailW] = useState(0);
  // Cards do admin são mais altos (controles inline) → mais espaço entre slots.
  const cardHeight = isAdmin ? 196 : CH;
  const { cards, lines, thirdCard, canvasW, canvasH, colXs } = buildBracketLayout(bracket, { width: availW, cardHeight });
  const totalH = canvasH + (thirdCard ? cardHeight + 48 : 0);

  return (
    <View style={{ flex: 1 }}>
      {bracket.some(m => m.round === 'r32') && (
        <View style={bkS.notice}>
          <Ionicons name="information-circle-outline" size={12} color={Colors.textSecondary} />
          <Text style={bkS.noticeTxt}>
            {isAdmin
              ? 'Edite o placar como na fase de grupos: salve o parcial, informe os pênaltis em caso de empate e encerre 1h45 após o início. 3os colocados pelo Anexo C da FIFA.'
              : 'Resultados oficiais do mata-mata. 3os colocados alocados pelo Anexo C da FIFA.'}
          </Text>
        </View>
      )}

      <BracketCanvas
        canvasW={canvasW}
        bodyH={totalH}
        onWidth={setAvailW}
        labels={COL_ORDER.map((round, idx) => bracket.some(m => m.round === round) && (
          <Text key={round} style={[bkS.colLabel, {
            position: 'absolute', left: colXs[idx], top: 14, width: CW, textAlign: 'center',
          }]}>
            {COL_LABELS[round]}
          </Text>
        ))}
      >
        {/* Linhas de conexão — atrás dos cards */}
        <ConnectorLines lines={lines} />

        {/* Cards posicionados absolutamente */}
        {cards.map(c => (
          <BracketCard
            key={c.match.id}
            match={c.match}
            isAdmin={isAdmin}
            onMatchSaved={onMatchSaved}
            cardStyle={{ position: 'absolute', left: c.x, top: c.y, width: CW }}
          />
        ))}

        {/* 3º Lugar */}
        {thirdCard && (
          <View style={{ position: 'absolute', left: thirdCard.x, top: thirdCard.y }}>
            <Text style={[bkS.colLabel, { textAlign: 'center', width: CW, marginBottom: 4 }]}>
              3º Lugar
            </Text>
            <BracketCard
              match={thirdCard.match}
              isAdmin={isAdmin}
              onMatchSaved={onMatchSaved}
              cardStyle={{ width: CW }}
            />
          </View>
        )}
      </BracketCanvas>
    </View>
  );
}

const bkS = StyleSheet.create({
  notice: {
    flexDirection: 'row', gap: 6, alignItems: 'flex-start',
    margin: Spacing.sm, padding: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  noticeTxt: { flex: 1, fontSize: 10, color: Colors.textSecondary, lineHeight: 15 },
  colLabel: {
    fontSize: 9, fontWeight: FontWeights.bold, color: Colors.accentGold,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  // card
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.sm,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden', ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 6, paddingTop: 4, paddingBottom: 2,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  headerDate: { fontSize: 9, color: Colors.textSecondary },
  matchNum: { fontSize: 9, fontWeight: FontWeights.bold, color: Colors.accentGold },
  dot: { width: 5, height: 5, borderRadius: 3 },
  penBadge: { fontSize: 9, fontWeight: FontWeights.bold, color: Colors.textSecondary },
  adminInline: { paddingHorizontal: 6, paddingBottom: 4, borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 2 },
  venueTxt: { fontSize: 9, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 6, paddingBottom: 4 },
  teamRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 6, paddingVertical: 5,
  },
  teamRowW: { backgroundColor: 'rgba(245,158,11,0.10)' },
  teamName: { flex: 1, fontSize: 11, color: Colors.textSecondary, fontWeight: FontWeights.medium },
  teamNameW: { color: Colors.textPrimary, fontWeight: FontWeights.bold },
  scoreBadge: {
    minWidth: 22, paddingHorizontal: 3, paddingVertical: 1,
    borderRadius: 3, backgroundColor: Colors.backgroundAlt,
    alignItems: 'center',
  },
  scoreBadgeW: { backgroundColor: Colors.accentGold },
  scoreInput: {
    width: 26, height: 24, borderRadius: 4,
    borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.backgroundAlt,
    color: Colors.textPrimary, textAlign: 'center',
    fontSize: 12, fontWeight: FontWeights.bold, padding: 0,
  },
  scoreInputFilled: { borderColor: '#3B82F6' },
  penRowInline: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
    gap: 5, paddingHorizontal: 6, paddingBottom: 5,
  },
  penLbl: { fontSize: 9, color: Colors.textSecondary, fontWeight: FontWeights.bold, textTransform: 'uppercase', marginRight: 2 },
  penSep: { fontSize: 11, color: Colors.textSecondary, fontWeight: FontWeights.bold },
  scoreText: { fontSize: 11, fontWeight: FontWeights.bold, color: Colors.textSecondary },
  scoreTextW: { color: Colors.background },
  flagPh: { width: 13, height: 9, backgroundColor: Colors.border, borderRadius: 2 },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 6 },
  // connector lines
  line: { position: 'absolute', height: 1, backgroundColor: Colors.border, opacity: 0.45 },
  // expand panel
  panel: {
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1, borderTopWidth: 0, borderColor: Colors.border,
    borderBottomLeftRadius: BorderRadius.sm, borderBottomRightRadius: BorderRadius.sm,
    padding: 6, gap: 3, zIndex: 10,
  },
  panelTxt: { fontSize: 10, color: Colors.textSecondary, textAlign: 'center' },
});

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function TabelasScreen(): React.JSX.Element {
  const { canAccessGerencia } = useAuth();
  const [phase, setPhase] = useState<Phase>('matamata');
  const [data, setData] = useState<StandingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async (silent = false): Promise<void> => {
    if (!silent) setIsLoading(true);
    setError('');
    try {
      const result = await getStandingsData();
      setData(result);
    } catch {
      setError('Erro ao carregar classificações. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleMatchSaved = useCallback(() => { void loadData(true); }, [loadData]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.backgroundAlt }}>
      <ScreenHeader title="Tabelas" subtitle="Copa do Mundo FIFA 2026" />
      <PhaseNav phase={phase} onChange={setPhase} />
      <View style={{ flex: 1 }}>
        {isLoading ? (
          <View style={rootS.center}>
            <ActivityIndicator size="large" color={Colors.accentGold} />
            <Text style={rootS.loadingText}>Carregando classificações...</Text>
          </View>
        ) : error !== '' ? (
          <View style={rootS.center}>
            <Text style={rootS.errorText}>{error}</Text>
            <TouchableOpacity style={rootS.retryBtn} onPress={() => void loadData()} activeOpacity={0.8}>
              <Text style={rootS.retryTxt}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : data !== null ? (
          <>
            {phase === 'grupos'    && <FaseDeGrupos groups={data.groups} thirds={data.thirds} isAdmin={canAccessGerencia} onMatchSaved={handleMatchSaved} />}
            {phase === 'terceiros' && <TerceirosColocados thirds={data.thirds} />}
            {phase === 'criterios' && <CriteriosView overall={data.overall} />}
            {phase === 'matamata' && <MataMataView bracket={data.bracket} isAdmin={canAccessGerencia} onMatchSaved={handleMatchSaved} />}
          </>
        ) : null}
      </View>
    </View>
  );
}
const rootS = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: FontWeights.medium },
  errorText: { fontSize: FontSizes.md, color: Colors.error, textAlign: 'center', paddingHorizontal: Spacing.xl },
  retryBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: Colors.accentGold },
  retryTxt: { color: Colors.background, fontWeight: FontWeights.bold, fontSize: FontSizes.sm },
});
