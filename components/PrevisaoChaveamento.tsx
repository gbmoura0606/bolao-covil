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
import {
  buildBracketLayout, CW, CH, CGAP, PAD, COL_ORDER, COL_LABELS, type LineSegment,
} from '@/components/bracketLayout';

// ── Helpers ───────────────────────────────────────────────────────────────────

function extIdFromSlot(slot: string | null): string | null {
  if (!slot) return null;
  const m = slot.match(/^(?:Vencedor|Perdedor) (M\d+)$/);
  return m ? m[1] : null;
}

function resolveTeam(
  match: BracketMatch,
  side: 'home' | 'away',
  picks: BracketPicks,
  byExtId: Map<string, BracketMatch>,
): TeamInfo | null {
  const direct = side === 'home' ? match.homeTeam : match.awayTeam;
  if (direct) return direct;

  const slot    = side === 'home' ? match.homeSlot : match.awaySlot;
  const srcExt  = extIdFromSlot(slot);
  if (!srcExt) return null;
  const srcMatch = byExtId.get(srcExt);
  if (!srcMatch) return null;

  const pickedId = picks[srcMatch.id];
  if (!pickedId) return null;

  // Tenta resolver o time diretamente
  if (srcMatch.homeTeam?.id === pickedId) return srcMatch.homeTeam;
  if (srcMatch.awayTeam?.id === pickedId) return srcMatch.awayTeam;

  // Resolve recursivamente
  const h = resolveTeam(srcMatch, 'home', picks, byExtId);
  const a = resolveTeam(srcMatch, 'away', picks, byExtId);
  if (h?.id === pickedId) return h;
  if (a?.id === pickedId) return a;
  return null;
}

// Layout do chaveamento (dimensões, ordem da árvore e linhas) vem de
// components/bracketLayout.ts — mesma fonte usada na aba Tabelas › Mata-Mata.

// ── Card de previsão ──────────────────────────────────────────────────────────

function PredCard({
  match, picks, byExtId, allMatches, onPick, cardStyle,
}: {
  match: BracketMatch;
  picks: BracketPicks;
  byExtId: Map<string, BracketMatch>;
  allMatches: BracketMatch[];
  onPick: (matchId: string, teamId: string | null) => void;
  cardStyle?: object;
}): React.JSX.Element {
  const homeTeam = resolveTeam(match, 'home', picks, byExtId);
  const awayTeam = resolveTeam(match, 'away', picks, byExtId);
  const pickedId = picks[match.id] ?? null;

  function handleTap(team: TeamInfo | null): void {
    if (!team) return;
    onPick(match.id, pickedId === team.id ? null : team.id);
  }

  function Slot({ team, slot, side }: { team: TeamInfo|null; slot: string|null; side:'home'|'away' }): React.JSX.Element {
    const picked  = !!team && pickedId === team.id;
    const looser  = !!team && pickedId !== null && pickedId !== team.id;
    return (
      <TouchableOpacity
        activeOpacity={team ? 0.7 : 1}
        disabled={!team}
        onPress={() => handleTap(team)}
        style={[pcS.slot, picked && pcS.slotPicked, looser && pcS.slotLooser, !team && pcS.slotEmpty]}
      >
        {team
          ? <FlagImage country={team.country} height={13} />
          : <View style={pcS.flagPh} />}
        <Text numberOfLines={1} style={[pcS.name, picked && pcS.namePicked, !team && pcS.nameEmpty]}>
          {team ? team.name : (slot ?? '?')}
        </Text>
        {picked && <Ionicons name="checkmark-circle" size={12} color={Colors.accentGold} />}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[pcS.card, cardStyle]}>
      <Text style={pcS.num}>J{match.matchNumber}</Text>
      <Slot team={homeTeam} slot={match.homeSlot} side="home" />
      <View style={pcS.divider} />
      <Slot team={awayTeam} slot={match.awaySlot} side="away" />
    </View>
  );
}

const pcS = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.sm,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...Shadows.sm,
  },
  num: { fontSize: 9, fontWeight: FontWeights.bold, color: Colors.accentGold, paddingHorizontal: 6, paddingTop: 4, paddingBottom: 2 },
  slot: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 5 },
  slotPicked: { backgroundColor: 'rgba(245,158,11,0.14)' },
  slotLooser: { opacity: 0.35 },
  slotEmpty: { opacity: 0.5 },
  name: { flex: 1, fontSize: 11, color: Colors.textSecondary, fontWeight: FontWeights.medium },
  namePicked: { color: Colors.textPrimary, fontWeight: FontWeights.bold },
  nameEmpty: { fontStyle: 'italic', fontSize: 10 },
  flagPh: { width: 13, height: 9, backgroundColor: Colors.border, borderRadius: 2 },
  divider: { height: 1, backgroundColor: Colors.border },
});

// ── Linhas ────────────────────────────────────────────────────────────────────

function Lines({ lines }: { lines: LineSegment[] }): React.JSX.Element {
  return (
    <>
      {lines.map((l, i) => {
        const vTop = Math.min(l.y1, l.y2);
        const vLen = Math.abs(l.y2 - l.y1);
        return (
          <React.Fragment key={i}>
            <View style={[pS.line, { left: l.x1, top: l.y1, width: l.xMid - l.x1 }]} />
            {vLen > 1 && <View style={[pS.line, { left: l.xMid, top: vTop, width: 1, height: vLen }]} />}
            <View style={[pS.line, { left: l.xMid, top: l.y2, width: l.x2 - l.xMid }]} />
          </React.Fragment>
        );
      })}
    </>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
const DEBOUNCE_MS = 1500;

export function PrevisaoChaveamento(): React.JSX.Element {
  const [bracket,   setBracket]   = useState<BracketMatch[]>([]);
  const [picks,     setPicks]     = useState<BracketPicks>({});
  const [loading,   setLoading]   = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [error,     setError]     = useState('');
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestPicks  = useRef<BracketPicks>({});

  const loadAll = useCallback(async () => {
    setLoading(true); setError('');
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

  function triggerSave(newPicks: BracketPicks): void {
    latestPicks.current = newPicks;
    setSaveState('saving');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void saveBracketPrediction(latestPicks.current)
        .then(() => setSaveState('saved'))
        .catch(() => setSaveState('error'));
    }, DEBOUNCE_MS);
  }

  // Map externalId → match (para resolução de picks)
  const byExtId = React.useMemo(() => {
    const m = new Map<string, BracketMatch>();
    for (const match of bracket) if (match.externalId) m.set(match.externalId, match);
    return m;
  }, [bracket]);

  function handlePick(matchId: string, teamId: string | null): void {
    const newPicks = { ...latestPicks.current };

    // Invalida picks downstream
    function clearDownstream(srcMatchId: string): void {
      for (const m of bracket) {
        if (picks[m.id] === undefined) continue;
        const srcM = bracket.find(x => x.id === srcMatchId);
        if (!srcM?.externalId) continue;
        const hSrc = extIdFromSlot(m.homeSlot);
        const aSrc = extIdFromSlot(m.awaySlot);
        if (hSrc === srcM.externalId || aSrc === srcM.externalId) {
          delete newPicks[m.id];
          clearDownstream(m.id);
        }
      }
    }

    if (teamId === null) delete newPicks[matchId];
    else newPicks[matchId] = teamId;
    clearDownstream(matchId);

    setPicks(newPicks);
    triggerSave(newPicks);
  }

  // Layout
  const { cards, lines, thirdCard, canvasW, canvasH } = buildBracketLayout(bracket);
  const totalH = canvasH + (thirdCard ? CH + 52 : 0);

  const done  = Object.values(picks).filter(Boolean).length;
  const total = bracket.filter(m => m.round !== 'terceiro').length;

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
        <TouchableOpacity style={pS.retryBtn} onPress={() => void loadAll()}>
          <Text style={pS.retryTxt}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={pS.container}>
      {/* Barra de status */}
      <View style={pS.bar}>
        <Text style={pS.progress}>{done}/{total} escolhas</Text>
        <View style={pS.saveRow}>
          {saveState === 'saving' && (
            <><ActivityIndicator size={10} color={Colors.textSecondary} /><Text style={pS.saveTxt}> Salvando...</Text></>
          )}
          {saveState === 'saved' && (
            <><Ionicons name="checkmark-circle" size={12} color={Colors.success} /><Text style={[pS.saveTxt,{color:Colors.success}]}> Salvo ✓</Text></>
          )}
          {saveState === 'error' && (
            <><Ionicons name="alert-circle" size={12} color={Colors.error} /><Text style={[pS.saveTxt,{color:Colors.error}]}> Erro ao salvar</Text></>
          )}
        </View>
      </View>
      <Text style={pS.hint}>Toque em uma seleção para avançá-la. Toque novamente para desfazer.</Text>

      {/* Canvas com scroll livre */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        style={{ flex: 1 }}
        contentContainerStyle={{ width: canvasW }}
      >
        <ScrollView
          showsVerticalScrollIndicator
          contentContainerStyle={{ height: totalH, width: canvasW }}
          style={{ flex: 1 }}
        >
          {/* Labels */}
          {COL_ORDER.map((round, idx) => bracket.some(m => m.round === round) && (
            <Text key={round} style={[pS.colLabel, {
              position: 'absolute', left: PAD + idx * (CW + CGAP),
              top: PAD, width: CW, textAlign: 'center',
            }]}>
              {COL_LABELS[round]}
            </Text>
          ))}

          {/* Linhas */}
          <Lines lines={lines} />

          {/* Cards */}
          {cards.map(c => (
            <PredCard
              key={c.match.id}
              match={c.match}
              picks={picks}
              byExtId={byExtId}
              allMatches={bracket}
              onPick={handlePick}
              cardStyle={{ position: 'absolute', left: c.x, top: c.y, width: CW }}
            />
          ))}

          {/* 3º Lugar */}
          {thirdCard && (
            <View style={{ position: 'absolute', left: thirdCard.x, top: thirdCard.y }}>
              <Text style={[pS.colLabel, { textAlign: 'center', width: CW, marginBottom: 4 }]}>
                3º Lugar
              </Text>
              <PredCard
                match={thirdCard.match}
                picks={picks}
                byExtId={byExtId}
                allMatches={bracket}
                onPick={handlePick}
                cardStyle={{ width: CW }}
              />
            </View>
          )}
        </ScrollView>
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
  bar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  progress: { fontSize: 12, fontWeight: FontWeights.semibold, color: Colors.textSecondary },
  saveRow: { flexDirection: 'row', alignItems: 'center' },
  saveTxt: { fontSize: 11, color: Colors.textSecondary },
  hint: {
    fontSize: 10, color: Colors.textSecondary, textAlign: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 6,
  },
  colLabel: {
    fontSize: 9, fontWeight: FontWeights.bold, color: Colors.accentGold,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  line: { position: 'absolute', height: 1, backgroundColor: Colors.border, opacity: 0.45 },
});
