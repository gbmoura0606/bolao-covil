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

// ── Dimensões — idênticas ao MataMataView para visual consistente ─────────────
const CW      = 160;
const CH      = 76;
const CGAP    = 52;
const PAD     = 20;
const LABEL_H = 22;
const SLOT_H  = CH + 14;

// ── Chaveamento oficial ───────────────────────────────────────────────────────
const SLOT_INDEX: Record<string, number> = {
  M73:0,  M74:1,  M75:2,  M76:3,
  M77:4,  M78:5,  M79:6,  M80:7,
  M81:8,  M82:9,  M83:10, M84:11,
  M85:12, M86:13, M87:14, M88:15,
  M89:0,  M90:1,  M91:2,  M92:3,
  M93:4,  M94:5,  M95:6,  M96:7,
  M97:0,  M98:1,  M99:2,  M100:3,
  M101:0, M102:1,
  M104:0,
  M103:0,
};

const PHASE_SLOTS: Record<string, number> = {
  r32:16, r16:8, qf:4, sf:2, final:1,
};

const COL_ORDER  = ['r32','r16','qf','sf','final'] as const;
type MainRound   = typeof COL_ORDER[number];

const COL_LABELS: Record<MainRound, string> = {
  r32:'R32', r16:'Oitavas', qf:'Quartas', sf:'Semis', final:'Final',
};

const FEEDS: Array<[string, string, 'top'|'bot']> = [
  ['M74','M89','top'], ['M77','M89','bot'],
  ['M73','M90','top'], ['M75','M90','bot'],
  ['M76','M91','top'], ['M78','M91','bot'],
  ['M79','M92','top'], ['M80','M92','bot'],
  ['M83','M93','top'], ['M84','M93','bot'],
  ['M81','M94','top'], ['M82','M94','bot'],
  ['M86','M95','top'], ['M88','M95','bot'],
  ['M85','M96','top'], ['M87','M96','bot'],
  ['M89','M97','top'], ['M90','M97','bot'],
  ['M93','M98','top'], ['M94','M98','bot'],
  ['M91','M99','top'], ['M92','M99','bot'],
  ['M95','M100','top'],['M96','M100','bot'],
  ['M97','M101','top'],['M98','M101','bot'],
  ['M99','M102','top'],['M100','M102','bot'],
  ['M101','M104','top'],['M102','M104','bot'],
];

const THIRD_FEEDS: Array<[string,'top'|'bot']> = [
  ['M101','top'], ['M102','bot'],
];

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

// ── Layout ────────────────────────────────────────────────────────────────────

interface CardPos { x: number; y: number; match: BracketMatch; }
interface LineSeg { x1:number; y1:number; x2:number; y2:number; xMid:number; }

function buildLayout(bracket: BracketMatch[]): {
  cards: CardPos[]; lines: LineSeg[];
  thirdCard: CardPos | null; canvasW: number; canvasH: number;
} {
  const maxSlots = 16;
  const totalH   = maxSlots * SLOT_H;
  const canvasH  = LABEL_H + PAD + totalH + PAD;
  const canvasW  = PAD + COL_ORDER.length * (CW + CGAP) + PAD;

  const colX = (i: number) => PAD + i * (CW + CGAP);

  function centerY(round: string, slotIdx: number): number {
    const slots     = PHASE_SLOTS[round] ?? 1;
    const groupSize = maxSlots / slots;
    const topSlot   = slotIdx * groupSize;
    const botSlot   = topSlot + groupSize - 1;
    const topY      = LABEL_H + PAD + topSlot * SLOT_H + CH / 2;
    const botY      = LABEL_H + PAD + botSlot * SLOT_H + CH / 2;
    return (topY + botY) / 2;
  }

  const cards: CardPos[] = [];
  const byExtId = new Map<string, CardPos>();

  for (const m of bracket) {
    if (m.round === 'terceiro') continue;
    const extId   = m.externalId ?? '';
    const slotIdx = SLOT_INDEX[extId] ?? 0;
    const colIdx  = COL_ORDER.indexOf(m.round as MainRound);
    if (colIdx < 0) continue;
    const cy = centerY(m.round, slotIdx);
    const pos: CardPos = { x: colX(colIdx), y: cy - CH / 2, match: m };
    cards.push(pos);
    byExtId.set(extId, pos);
  }

  let thirdCard: CardPos | null = null;
  const thirdMatch = bracket.find(m => m.round === 'terceiro');
  const finalCard  = cards.find(c => c.match.round === 'final');
  if (thirdMatch) {
    const ty = finalCard ? finalCard.y + CH + 32 : centerY('sf', 0);
    thirdCard = { x: colX(COL_ORDER.indexOf('final')), y: ty, match: thirdMatch };
  }

  const lines: LineSeg[] = [];
  function addLine(srcExt: string, dstPos: CardPos, side: 'top'|'bot'): void {
    const src = byExtId.get(srcExt);
    if (!src) return;
    const x1   = src.x + CW;
    const y1   = src.y + CH / 2;
    const x2   = dstPos.x;
    const y2   = side === 'top' ? dstPos.y + CH * 0.27 : dstPos.y + CH * 0.73;
    lines.push({ x1, y1, x2, y2, xMid: x1 + CGAP / 2 });
  }

  for (const [src, dst, side] of FEEDS) {
    const dstPos = byExtId.get(dst);
    if (dstPos) addLine(src, dstPos, side);
  }
  if (thirdCard) {
    for (const [src, side] of THIRD_FEEDS) {
      const srcPos = byExtId.get(src);
      if (!srcPos) continue;
      const x1 = srcPos.x + CW, y1 = srcPos.y + CH / 2, x2 = thirdCard.x;
      const y2 = side === 'top' ? thirdCard.y + CH * 0.27 : thirdCard.y + CH * 0.73;
      lines.push({ x1, y1, x2, y2, xMid: x1 + CGAP / 2 });
    }
  }

  return { cards, lines, thirdCard, canvasW, canvasH };
}

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

function Lines({ lines }: { lines: LineSeg[] }): React.JSX.Element {
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
  const { cards, lines, thirdCard, canvasW, canvasH } = buildLayout(bracket);
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
