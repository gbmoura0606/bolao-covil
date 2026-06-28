import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlagImage } from '@/components/FlagImage';
import { getStandingsData } from '@/services/standings';
import { getBracketPrediction, saveBracketPrediction, getAllBracketPredictions } from '@/services/bracketPredictions';
import type { BracketMatch, TeamInfo } from '@/services/standings';
import type { BracketPicks, UserBracketPrediction } from '@/services/bracketPredictions';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '@/constants/theme';
import {
  buildBracketLayout, CW, CH, COL_ORDER, COL_LABELS, type LineSegment,
} from '@/components/bracketLayout';
import { BracketCanvas } from '@/components/BracketCanvas';
import { isBracketLocked, BRACKET_LOCK_LABEL } from '@/constants/bracket';

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
  // "Perdedor M.." (disputa de 3º lugar) → devolve quem o usuário NÃO escolheu.
  const isLoser = !!slot && slot.startsWith('Perdedor');
  const srcMatch = byExtId.get(srcExt);
  if (!srcMatch) return null;

  const pickedId = picks[srcMatch.id];
  if (!pickedId) return null;

  // Os dois participantes do jogo-fonte (recursivamente, se preciso).
  const h = srcMatch.homeTeam ?? resolveTeam(srcMatch, 'home', picks, byExtId);
  const a = srcMatch.awayTeam ?? resolveTeam(srcMatch, 'away', picks, byExtId);
  const winner = h?.id === pickedId ? h : a?.id === pickedId ? a : null;
  const loser  = h?.id === pickedId ? a : a?.id === pickedId ? h : null;
  return isLoser ? loser : winner;
}

// Layout do chaveamento (dimensões, ordem da árvore e linhas) vem de
// components/bracketLayout.ts — mesma fonte usada na aba Tabelas › Mata-Mata.

// ── Card de previsão ──────────────────────────────────────────────────────────

function PredCard({
  match, picks, byExtId, allMatches, onPick, cardStyle, locked = false, compareState = null,
}: {
  match: BracketMatch;
  picks: BracketPicks;
  byExtId: Map<string, BracketMatch>;
  allMatches: BracketMatch[];
  onPick: (matchId: string, teamId: string | null) => void;
  cardStyle?: object;
  locked?: boolean;
  /** Comparação com a minha previsão: 'same' (igual), 'diff' (diverge) ou null. */
  compareState?: 'same' | 'diff' | null;
}): React.JSX.Element {
  const homeTeam = resolveTeam(match, 'home', picks, byExtId);
  const awayTeam = resolveTeam(match, 'away', picks, byExtId);
  const pickedId = picks[match.id] ?? null;

  function handleTap(team: TeamInfo | null): void {
    if (!team || locked) return;
    onPick(match.id, pickedId === team.id ? null : team.id);
  }

  function Slot({ team, slot, side }: { team: TeamInfo|null; slot: string|null; side:'home'|'away' }): React.JSX.Element {
    const picked  = !!team && pickedId === team.id;
    const looser  = !!team && pickedId !== null && pickedId !== team.id;
    return (
      <TouchableOpacity
        activeOpacity={team && !locked ? 0.7 : 1}
        disabled={!team || locked}
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
    <View style={[
      pcS.card, cardStyle,
      compareState === 'same' && pcS.cardSame,
      compareState === 'diff' && pcS.cardDiff,
    ]}>
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
  cardSame: { borderColor: Colors.success, borderWidth: 2 },
  cardDiff: { borderColor: Colors.error, borderWidth: 2 },
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

export function PrevisaoChaveamento({ onProgress }: { onProgress?: (done: number) => void } = {}): React.JSX.Element {
  const { user } = useAuth();
  const [bracket,   setBracket]   = useState<BracketMatch[]>([]);
  const [picks,     setPicks]     = useState<BracketPicks>({});
  const [others,    setOthers]    = useState<UserBracketPrediction[]>([]);
  const [viewerId,  setViewerId]  = useState<string | null>(null); // null = minha previsão
  const [compare,   setCompare]   = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [error,     setError]     = useState('');
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestPicks  = useRef<BracketPicks>({});
  const locked = isBracketLocked();

  const loadAll = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [standings, saved] = await Promise.all([getStandingsData(), getBracketPrediction()]);
      setBracket(standings.bracket);
      setPicks(saved.picks ?? {});
      latestPicks.current = saved.picks ?? {};
      // Após a trava, carrega as previsões de todos para comparação.
      if (isBracketLocked()) {
        try { setOthers(await getAllBracketPredictions()); } catch { setOthers([]); }
      }
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

  // Informa o nº de escolhas ao pai (ícone de atenção na aba Previsão).
  useEffect(() => {
    onProgress?.(Object.values(picks).filter(Boolean).length);
  }, [picks, onProgress]);

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
    if (locked) return;
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
  const [availW, setAvailW] = useState(0);
  const { cards, lines, thirdCard, canvasW, canvasH, colXs } = buildBracketLayout(bracket, { width: availW });
  const totalH = canvasH + (thirdCard ? CH + 52 : 0);

  const done  = Object.values(picks).filter(Boolean).length;
  // 32 jogos do mata-mata = R32(16)+Oitavas(8)+Quartas(4)+Semis(2)+3º(1)+Final(1).
  const total = bracket.length;

  // ── Comparação entre participantes (somente após a trava) ──────────────────
  const myId = user?.id ?? '__me__';
  const viewers = React.useMemo(() => {
    const list: { id: string; label: string; picks: BracketPicks }[] = [
      { id: myId, label: 'Você', picks },
    ];
    for (const o of others) if (o.userId !== myId) list.push({ id: o.userId, label: o.nickname, picks: o.picks });
    return list;
  }, [others, picks, myId]);
  const selected      = viewers.find(v => v.id === viewerId) ?? viewers[0];
  const isViewingOther = selected.id !== myId;
  const displayPicks  = selected.picks;
  const compareActive = compare && isViewingOther;
  const cardLocked    = locked || isViewingOther; // previsão de outro é sempre read-only
  const showSelector  = locked && viewers.length > 1;

  function compareState(matchId: string): 'same' | 'diff' | null {
    if (!compareActive) return null;
    const mine = picks[matchId];
    const theirs = selected.picks[matchId];
    if (!mine || !theirs) return null;
    return mine === theirs ? 'same' : 'diff';
  }

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
          {locked ? (
            <><Ionicons name="lock-closed" size={12} color={Colors.textSecondary} /><Text style={pS.saveTxt}> Previsão encerrada</Text></>
          ) : (
            <>
              {saveState === 'saving' && (
                <><ActivityIndicator size={10} color={Colors.textSecondary} /><Text style={pS.saveTxt}> Salvando...</Text></>
              )}
              {saveState === 'saved' && (
                <><Ionicons name="checkmark-circle" size={12} color={Colors.success} /><Text style={[pS.saveTxt,{color:Colors.success}]}> Salvo ✓</Text></>
              )}
              {saveState === 'error' && (
                <><Ionicons name="alert-circle" size={12} color={Colors.error} /><Text style={[pS.saveTxt,{color:Colors.error}]}> Erro ao salvar</Text></>
              )}
            </>
          )}
        </View>
      </View>
      {locked ? (
        <Text style={pS.hint}>
          {`Previsão encerrada (mata-mata começou em ${BRACKET_LOCK_LABEL}). Suas escolhas estão salvas.`}
        </Text>
      ) : done < total ? (
        <View style={pS.warnBanner}>
          <Ionicons name="alert-circle" size={16} color={Colors.accentGold} />
          <Text style={pS.warnTxt}>
            <Text style={pS.warnStrong}>Faça sua previsão!</Text> Faltam {total - done} de {total}.
            Toque em uma seleção para avançá-la fase a fase até a final (e a disputa de 3º lugar).
            Salva automaticamente. Encerra em {BRACKET_LOCK_LABEL}.
          </Text>
        </View>
      ) : (
        <Text style={pS.hint}>
          Previsão completa ✓ — você ainda pode ajustá-la até {BRACKET_LOCK_LABEL}.
        </Text>
      )}

      {/* Seletor de participantes (após a trava) */}
      {showSelector && (
        <View style={pS.selectorWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={pS.chipsRow}>
            {viewers.map(v => {
              const active = v.id === selected.id;
              return (
                <TouchableOpacity
                  key={v.id}
                  style={[pS.chip, active && pS.chipActive]}
                  onPress={() => { setViewerId(v.id === myId ? null : v.id); }}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={v.id === myId ? 'person' : 'eye-outline'}
                    size={12}
                    color={active ? Colors.background : Colors.textSecondary}
                  />
                  <Text style={[pS.chipTxt, active && pS.chipTxtActive]} numberOfLines={1}>{v.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {isViewingOther && (
            <TouchableOpacity
              style={[pS.cmpBtn, compare && pS.cmpBtnOn]}
              onPress={() => setCompare(c => !c)}
              activeOpacity={0.8}
            >
              <Ionicons name="git-compare" size={13} color={compare ? Colors.background : Colors.accentGold} />
              <Text style={[pS.cmpTxt, compare && pS.cmpTxtOn]}>Comparar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Indicação clara de que estou vendo a previsão de outro participante */}
      {isViewingOther && (
        <View style={pS.viewingBar}>
          <Ionicons name="eye" size={14} color={Colors.accentGold} />
          <Text style={pS.viewingTxt}>
            Vendo a previsão de <Text style={pS.viewingName}>{selected.label}</Text> (somente leitura)
            {compareActive ? '  ·  🟩 igual à sua  🟥 diferente' : ''}
          </Text>
          <TouchableOpacity onPress={() => { setViewerId(null); setCompare(false); }} activeOpacity={0.8}>
            <Text style={pS.viewingBack}>Ver a minha</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Canvas: faixa de títulos fixa + zoom (ver BracketCanvas) */}
      <BracketCanvas
        canvasW={canvasW}
        bodyH={totalH}
        onWidth={setAvailW}
        labels={COL_ORDER.map((round, idx) => bracket.some(m => m.round === round) && (
          <Text key={round} style={[pS.colLabel, {
            position: 'absolute', left: colXs[idx], top: 14, width: CW, textAlign: 'center',
          }]}>
            {COL_LABELS[round]}
          </Text>
        ))}
      >
        {/* Linhas */}
        <Lines lines={lines} />

        {/* Cards */}
        {cards.map(c => (
          <PredCard
            key={c.match.id}
            match={c.match}
            picks={displayPicks}
            byExtId={byExtId}
            allMatches={bracket}
            onPick={handlePick}
            locked={cardLocked}
            compareState={compareState(c.match.id)}
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
              picks={displayPicks}
              byExtId={byExtId}
              allMatches={bracket}
              onPick={handlePick}
              locked={cardLocked}
              compareState={compareState(thirdCard.match.id)}
              cardStyle={{ width: CW }}
            />
          </View>
        )}
      </BracketCanvas>
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
  warnBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    marginHorizontal: Spacing.md, marginVertical: 6,
    paddingHorizontal: Spacing.sm, paddingVertical: 8,
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderWidth: 1, borderColor: Colors.accentGold, borderRadius: BorderRadius.md,
  },
  warnTxt: { flex: 1, fontSize: 11, color: Colors.textPrimary, lineHeight: 16 },
  warnStrong: { fontWeight: FontWeights.bold, color: Colors.accentGold },
  selectorWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.sm, paddingVertical: 6,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  chipsRow: { gap: 6, paddingRight: 6, alignItems: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.backgroundAlt, maxWidth: 140,
  },
  chipActive: { backgroundColor: Colors.accentGold, borderColor: Colors.accentGold },
  chipTxt: { fontSize: 11, color: Colors.textSecondary, fontWeight: FontWeights.medium },
  chipTxtActive: { color: Colors.background, fontWeight: FontWeights.bold },
  cmpBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999, borderWidth: 1, borderColor: Colors.accentGold,
  },
  cmpBtnOn: { backgroundColor: Colors.accentGold },
  cmpTxt: { fontSize: 11, color: Colors.accentGold, fontWeight: FontWeights.bold },
  cmpTxtOn: { color: Colors.background },
  viewingBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderBottomWidth: 1, borderBottomColor: Colors.accentGold,
  },
  viewingTxt: { flex: 1, fontSize: 11, color: Colors.textPrimary },
  viewingName: { fontWeight: FontWeights.bold, color: Colors.accentGold },
  viewingBack: { fontSize: 11, fontWeight: FontWeights.bold, color: Colors.accentGold, textDecorationLine: 'underline' },
  colLabel: {
    fontSize: 9, fontWeight: FontWeights.bold, color: Colors.accentGold,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  line: { position: 'absolute', height: 1, backgroundColor: Colors.border, opacity: 0.45 },
});
