import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlagImage } from '@/components/FlagImage';
import { getStandingsData } from '@/services/standings';
import { getBracketPrediction, saveBracketPrediction } from '@/services/bracketPredictions';
import type { BracketMatch, TeamInfo } from '@/services/standings';
import type { BracketPicks } from '@/services/bracketPredictions';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '@/constants/theme';

// ── Tipos ─────────────────────────────────────────────────────────────────────

type KnockoutRound = 'r32' | 'r16' | 'qf' | 'sf' | 'final' | 'terceiro';

const KO_LABEL: Record<KnockoutRound, string> = {
  r32: 'Rodada de 32', r16: 'Oitavas',
  qf: 'Quartas', sf: 'Semis',
  final: 'Final', terceiro: '3º Lugar',
};

const PHASE_ORDER: KnockoutRound[] = ['r32', 'r16', 'qf', 'sf', 'final', 'terceiro'];

// Mapeamento de externalId de confronto → quais confrontos alimentam cada slot
// (home slot "Vencedor M89" → buscar partida com externalId "M89")
function matchIdFromSlot(slot: string | null): string | null {
  if (!slot) return null;
  const m = slot.match(/^(?:Vencedor|Perdedor) (M\d+)$/);
  return m ? m[1] : null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Resolve qual time o usuário escolheu (ou null) para uma partida, dado os picks */
function resolvePickedTeam(
  match: BracketMatch,
  side: 'home' | 'away',
  picks: BracketPicks,
  allMatches: BracketMatch[],
): TeamInfo | null {
  // Se já tem time conhecido, usa ele
  const team = side === 'home' ? match.homeTeam : match.awayTeam;
  if (team) return team;

  // Senão, tenta resolver via picks do confronto anterior
  const slot = side === 'home' ? match.homeSlot : match.awaySlot;
  const srcExtId = matchIdFromSlot(slot);
  if (!srcExtId) return null;

  const srcMatch = allMatches.find((m) => m.externalId === srcExtId);
  if (!srcMatch) return null;

  const pickedTeamId = picks[srcMatch.id];
  if (!pickedTeamId) return null;

  // O time escolhido no confronto fonte
  if (srcMatch.homeTeam?.id === pickedTeamId) return srcMatch.homeTeam;
  if (srcMatch.awayTeam?.id === pickedTeamId) return srcMatch.awayTeam;

  // Recursão: o time escolhido pode não estar resolvido ainda (bracket profundo)
  const homeResolved = resolvePickedTeam(srcMatch, 'home', picks, allMatches);
  const awayResolved = resolvePickedTeam(srcMatch, 'away', picks, allMatches);
  if (homeResolved?.id === pickedTeamId) return homeResolved;
  if (awayResolved?.id === pickedTeamId) return awayResolved;

  return null;
}

// ── Card do confronto ─────────────────────────────────────────────────────────

function PredCard({
  match, allMatches, picks, onPick, disabled,
}: {
  match: BracketMatch;
  allMatches: BracketMatch[];
  picks: BracketPicks;
  onPick: (matchId: string, teamId: string | null) => void;
  disabled: boolean;
}): React.JSX.Element {
  const homeTeam = resolvePickedTeam(match, 'home', picks, allMatches);
  const awayTeam = resolvePickedTeam(match, 'away', picks, allMatches);

  const pickedId = picks[match.id] ?? null;
  const homeSlotLabel = match.homeSlot ?? '?';
  const awaySlotLabel = match.awaySlot ?? '?';

  function handlePick(team: TeamInfo | null, slot: string): void {
    if (!team) return; // sem time resolvido ainda
    const newPick = pickedId === team.id ? null : team.id;
    onPick(match.id, newPick);
  }

  function TeamSlot({
    team, slot, side,
  }: {
    team: TeamInfo | null; slot: string; side: 'home' | 'away';
  }): React.JSX.Element {
    const isPicked = !!team && pickedId === team.id;
    const isLooser = !!team && pickedId !== null && pickedId !== team.id;
    return (
      <TouchableOpacity
        activeOpacity={team ? 0.7 : 1}
        disabled={!team || disabled}
        onPress={() => handlePick(team, slot)}
        style={[
          pcS.slot,
          isPicked && pcS.slotPicked,
          isLooser && pcS.slotLooser,
          !team && pcS.slotEmpty,
        ]}
      >
        {team
          ? <FlagImage country={team.country} height={22} />
          : <View style={pcS.flagPlaceholder} />}
        <Text
          numberOfLines={2}
          style={[pcS.teamName, isPicked && pcS.teamNamePicked, !team && pcS.teamNameEmpty]}
        >
          {team ? team.name : slot}
        </Text>
        {isPicked && (
          <Ionicons name="checkmark-circle" size={14} color={Colors.accentGold} style={pcS.check} />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={pcS.card}>
      <Text style={pcS.matchNum}>J{match.matchNumber}</Text>
      <TeamSlot team={homeTeam} slot={homeSlotLabel} side="home" />
      <View style={pcS.divider} />
      <TeamSlot team={awayTeam} slot={awaySlotLabel} side="away" />
    </View>
  );
}

const pcS = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    width: 130,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  matchNum: {
    fontSize: 9, fontWeight: FontWeights.bold, color: Colors.accentGold,
    paddingHorizontal: 6, paddingTop: 4, paddingBottom: 2,
  },
  slot: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 6, paddingVertical: 7,
  },
  slotPicked: { backgroundColor: 'rgba(245,158,11,0.14)' },
  slotLooser: { opacity: 0.4 },
  slotEmpty: { opacity: 0.5 },
  teamName: {
    flex: 1, fontSize: 11, color: Colors.textSecondary, fontWeight: FontWeights.medium,
  },
  teamNamePicked: { color: Colors.textPrimary, fontWeight: FontWeights.bold },
  teamNameEmpty: { fontStyle: 'italic', fontSize: 10 },
  flagPlaceholder: { width: 22, height: 15, backgroundColor: Colors.border, borderRadius: 2 },
  divider: { height: 1, backgroundColor: Colors.border },
  check: { marginLeft: 2 },
});

// ── Coluna da fase ────────────────────────────────────────────────────────────

function BracketColumn({
  round, matches, allMatches, picks, onPick, disabled,
}: {
  round: KnockoutRound;
  matches: BracketMatch[];
  allMatches: BracketMatch[];
  picks: BracketPicks;
  onPick: (matchId: string, teamId: string | null) => void;
  disabled: boolean;
}): React.JSX.Element {
  const sorted = [...matches].sort((a, b) => (a.matchNumber ?? 0) - (b.matchNumber ?? 0));
  return (
    <View style={colS.col}>
      <Text style={colS.label}>{KO_LABEL[round]}</Text>
      <View style={colS.cards}>
        {sorted.map((m) => (
          <PredCard
            key={m.id}
            match={m}
            allMatches={allMatches}
            picks={picks}
            onPick={onPick}
            disabled={disabled}
          />
        ))}
      </View>
    </View>
  );
}

const colS = StyleSheet.create({
  col: { width: 130, alignItems: 'stretch' },
  label: {
    fontSize: 9, fontWeight: FontWeights.bold, color: Colors.accentGold,
    textTransform: 'uppercase', letterSpacing: 0.8, textAlign: 'center', marginBottom: 8,
  },
  cards: { gap: 8 },
});

// ── Componente principal ──────────────────────────────────────────────────────

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const AUTOSAVE_MS = 1500;

export function PrevisaoChaveamento(): React.JSX.Element {
  const [bracket, setBracket] = useState<BracketMatch[]>([]);
  const [picks, setPicks] = useState<BracketPicks>({});
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestPicks = useRef<BracketPicks>({});

  // Carrega bracket e picks salvos
  const loadAll = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const [standings, saved] = await Promise.all([getStandingsData(), getBracketPrediction()]);
      setBracket(standings.bracket);
      setPicks(saved.picks ?? {});
      latestPicks.current = saved.picks ?? {};
    } catch {
      setError('Erro ao carregar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [loadAll]);

  // Autosave com debounce
  function triggerSave(newPicks: BracketPicks): void {
    latestPicks.current = newPicks;
    setSaveState('saving');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void saveBracketPrediction(latestPicks.current)
        .then(() => setSaveState('saved'))
        .catch(() => setSaveState('error'));
    }, AUTOSAVE_MS);
  }

  function handlePick(matchId: string, teamId: string | null): void {
    // Quando escolhe/desfaz um time, invalida todos os picks dependentes
    const newPicks = { ...latestPicks.current };

    // Função para limpar picks de uma fase a partir de um matchId
    function clearDownstream(srcMatchId: string): void {
      for (const m of bracket) {
        if (picks[m.id] === undefined) continue;
        const hSrc = matchIdFromSlot(m.homeSlot);
        const aSrc = matchIdFromSlot(m.awaySlot);
        const srcM = bracket.find((x) => x.id === srcMatchId);
        if (!srcM) continue;
        const srcExtId = srcM.externalId;
        if (hSrc === srcExtId || aSrc === srcExtId) {
          delete newPicks[m.id];
          clearDownstream(m.id);
        }
      }
    }

    if (teamId === null) {
      delete newPicks[matchId];
    } else {
      newPicks[matchId] = teamId;
    }
    clearDownstream(matchId);

    setPicks(newPicks);
    triggerSave(newPicks);
  }

  // Conta picks feitos vs total possível
  const total = bracket.filter((m) => m.round !== 'terceiro').length;
  const done  = Object.keys(picks).filter((k) => picks[k] !== null).length;

  if (loading) {
    return (
      <View style={pS.center}>
        <ActivityIndicator size="large" color={Colors.accentGold} />
        <Text style={pS.loadingTxt}>Carregando bracket...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={pS.center}>
        <Text style={pS.errorTxt}>{error}</Text>
        <TouchableOpacity style={pS.retryBtn} onPress={() => void loadAll()} activeOpacity={0.8}>
          <Text style={pS.retryTxt}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const columns = PHASE_ORDER
    .map((r) => ({ round: r, matches: bracket.filter((m) => m.round === r) }))
    .filter((c) => c.matches.length > 0);

  return (
    <View style={pS.container}>
      {/* Header de progresso + status de save */}
      <View style={pS.headerBar}>
        <Text style={pS.progress}>{done}/{total} escolhas feitas</Text>
        <View style={pS.saveRow}>
          {saveState === 'saving' && (
            <>
              <ActivityIndicator size={10} color={Colors.textSecondary} />
              <Text style={pS.saveTxt}>Salvando...</Text>
            </>
          )}
          {saveState === 'saved' && (
            <>
              <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
              <Text style={[pS.saveTxt, { color: Colors.success }]}>Salvo ✓</Text>
            </>
          )}
          {saveState === 'error' && (
            <>
              <Ionicons name="alert-circle" size={12} color={Colors.error} />
              <Text style={[pS.saveTxt, { color: Colors.error }]}>Erro ao salvar</Text>
            </>
          )}
        </View>
      </View>

      <Text style={pS.hint}>
        Toque em uma seleção para avançá-la ao próximo confronto. Toque novamente para desfazer.
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        style={{ flex: 1 }}
        contentContainerStyle={pS.bracketRow}
      >
        {columns.map((col) => (
          <BracketColumn
            key={col.round}
            round={col.round}
            matches={col.matches}
            allMatches={bracket}
            picks={picks}
            onPick={handlePick}
            disabled={false}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const pS = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundAlt },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.xl },
  loadingTxt: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  errorTxt: { fontSize: FontSizes.sm, color: Colors.error, textAlign: 'center' },
  retryBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: Colors.accentGold },
  retryTxt: { color: Colors.background, fontWeight: FontWeights.bold, fontSize: FontSizes.sm },
  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  progress: { fontSize: 12, fontWeight: FontWeights.semibold, color: Colors.textSecondary },
  saveRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  saveTxt: { fontSize: 11, color: Colors.textSecondary },
  hint: {
    fontSize: 10, color: Colors.textSecondary, textAlign: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundAlt,
  },
  bracketRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: Spacing.sm, paddingBottom: Spacing.xxl, paddingTop: Spacing.xs, gap: 20,
  },
});
