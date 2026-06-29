import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlagImage } from '@/components/FlagImage';
import { getStandingsData } from '@/services/standings';
import {
  getBracketPrediction, saveBracketPrediction, getAllBracketPredictions,
  getBracketRanking, type BracketRankingEntry,
} from '@/services/bracketPredictions';
import type { BracketMatch, TeamInfo } from '@/services/standings';
import type { BracketPicks, UserBracketPrediction } from '@/services/bracketPredictions';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '@/constants/theme';
import {
  buildBracketLayout, CW, CH, COL_ORDER, COL_LABELS, type LineSegment,
} from '@/components/bracketLayout';
import { BracketCanvas } from '@/components/BracketCanvas';
import { isBracketLocked, BRACKET_LOCK_LABEL } from '@/constants/bracket';
import { matchPoints, totalBracketPoints } from '@/constants/bracketScoring';

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
  points = 0, finished = false, onInspect,
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
  /** Pontos ganhos neste confronto (se já encerrado). */
  points?: number;
  /** Confronto encerrado (resultado oficial saiu). */
  finished?: boolean;
  /** Abre o painel "quem palpitou o quê" neste confronto (após a trava). */
  onInspect?: (matchId: string) => void;
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

  const Wrapper: React.ComponentType<{ children: React.ReactNode }> = onInspect
    ? ({ children }) => (
        <TouchableOpacity activeOpacity={0.7} onPress={() => onInspect(match.id)}
          style={[pcS.card, cardStyle, compareState === 'same' && pcS.cardSame, compareState === 'diff' && pcS.cardDiff]}>
          {children}
        </TouchableOpacity>
      )
    : ({ children }) => (
        <View style={[pcS.card, cardStyle, compareState === 'same' && pcS.cardSame, compareState === 'diff' && pcS.cardDiff]}>
          {children}
        </View>
      );

  return (
    <Wrapper>
      <View style={pcS.header}>
        <Text style={pcS.num}>J{match.matchNumber}</Text>
        {finished && points > 0 && (
          <View style={pcS.ptsBadge}><Text style={pcS.ptsTxt}>+{points}</Text></View>
        )}
        {finished && points === 0 && pickedId !== null && (
          <Ionicons name="close" size={11} color={Colors.error} />
        )}
        {onInspect && <Ionicons name="people-outline" size={11} color={Colors.textSecondary} />}
      </View>
      <Slot team={homeTeam} slot={match.homeSlot} side="home" />
      <View style={pcS.divider} />
      <Slot team={awayTeam} slot={match.awaySlot} side="away" />
    </Wrapper>
  );
}

const pcS = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.sm,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...Shadows.sm,
  },
  cardSame: { borderColor: Colors.success, borderWidth: 2 },
  cardDiff: { borderColor: Colors.error, borderWidth: 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingTop: 4, paddingBottom: 2 },
  num: { fontSize: 9, fontWeight: FontWeights.bold, color: Colors.accentGold, flex: 1 },
  ptsBadge: { backgroundColor: Colors.success, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 },
  ptsTxt: { fontSize: 9, fontWeight: FontWeights.bold, color: Colors.background },
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
  const [teamById,  setTeamById]  = useState<Map<string, TeamInfo>>(new Map());
  const [inspectId, setInspectId] = useState<string | null>(null); // confronto sob inspeção
  const [ranking,   setRanking]   = useState<BracketRankingEntry[] | null>(null);
  const [showRanking, setShowRanking] = useState(false);
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
      // Mapa teamId → time (todos os 48), para resolver picks na inspeção.
      const tmap = new Map<string, TeamInfo>();
      for (const g of standings.groups) for (const t of g.teams) tmap.set(t.id, t);
      for (const m of standings.bracket) {
        if (m.homeTeam) tmap.set(m.homeTeam.id, m.homeTeam);
        if (m.awayTeam) tmap.set(m.awayTeam.id, m.awayTeam);
      }
      setTeamById(tmap);
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
    // Confronto que já começou (status ≠ OPEN) fica travado individualmente.
    const target = bracket.find(x => x.id === matchId);
    if (target && target.status !== 'OPEN') return;
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

  // ── Pontuação ao vivo (do usuário exibido) ─────────────────────────────────
  const displayPoints = totalBracketPoints(displayPicks, bracket);
  const anyFinished   = bracket.some(m => m.status === 'FINISHED');
  // Inspeção ("quem palpitou o quê") só após a trava, com previsões dos outros.
  const inspectable   = locked && others.length > 0;

  const openRanking = useCallback(async () => {
    setShowRanking(true);
    if (ranking === null) {
      try { setRanking(await getBracketRanking()); } catch { setRanking([]); }
    }
  }, [ranking]);

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
        <Text style={pS.progress}>
          {done}/{total} escolhas
          {anyFinished && <Text style={pS.progressPts}>  ·  {displayPoints} pts{isViewingOther ? ` (${selected.label})` : ''}</Text>}
        </Text>
        <View style={pS.saveRow}>
          {anyFinished && (
            <TouchableOpacity style={pS.rankBtn} onPress={() => void openRanking()} activeOpacity={0.8}>
              <Ionicons name="podium-outline" size={13} color={Colors.accentGold} />
              <Text style={pS.rankBtnTxt}>Ranking</Text>
            </TouchableOpacity>
          )}
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
          {`Previsão encerrada em ${BRACKET_LOCK_LABEL}. Suas escolhas estão salvas.`}
        </Text>
      ) : done < total ? (
        <View style={pS.warnBanner}>
          <Ionicons name="alert-circle" size={16} color={Colors.accentGold} />
          <Text style={pS.warnTxt}>
            <Text style={pS.warnStrong}>Previsão reaberta!</Text> Faltam {total - done} de {total}.
            Toque em uma seleção para avançá-la fase a fase até a final (e o 3º lugar).
            Jogos que já começaram ficam travados. Salva automaticamente. Encerra de vez em {BRACKET_LOCK_LABEL}.
          </Text>
        </View>
      ) : (
        <Text style={pS.hint}>
          Previsão completa ✓ — ajustes liberados (exceto jogos já iniciados) até {BRACKET_LOCK_LABEL}.
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
            locked={cardLocked || c.match.status !== 'OPEN'}
            compareState={compareState(c.match.id)}
            points={matchPoints(c.match, displayPicks[c.match.id])}
            finished={c.match.status === 'FINISHED'}
            onInspect={inspectable ? setInspectId : undefined}
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
              locked={cardLocked || thirdCard.match.status !== 'OPEN'}
              compareState={compareState(thirdCard.match.id)}
              points={matchPoints(thirdCard.match, displayPicks[thirdCard.match.id])}
              finished={thirdCard.match.status === 'FINISHED'}
              onInspect={inspectable ? setInspectId : undefined}
              cardStyle={{ width: CW }}
            />
          </View>
        )}
      </BracketCanvas>

      {/* Ranking da Previsão */}
      <RankingModal
        visible={showRanking}
        onClose={() => setShowRanking(false)}
        ranking={ranking}
        myId={myId}
      />

      {/* Painel "quem palpitou o quê" num confronto */}
      <InspectModal
        matchId={inspectId}
        bracket={bracket}
        viewers={viewers}
        teamById={teamById}
        myId={myId}
        onClose={() => setInspectId(null)}
      />
    </View>
  );
}

// ── Modal: Ranking da Previsão ─────────────────────────────────────────────────

function RankingModal({
  visible, onClose, ranking, myId,
}: {
  visible: boolean;
  onClose: () => void;
  ranking: BracketRankingEntry[] | null;
  myId: string;
}): React.JSX.Element {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={mS.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={mS.sheet}>
          <View style={mS.sheetHeader}>
            <Text style={mS.sheetTitle}>Ranking da Previsão</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={20} color={Colors.textSecondary} /></TouchableOpacity>
          </View>
          {ranking === null ? (
            <ActivityIndicator color={Colors.accentGold} style={{ padding: Spacing.lg }} />
          ) : ranking.length === 0 ? (
            <Text style={mS.empty}>Sem pontos ainda — aparece conforme os jogos do mata-mata são encerrados.</Text>
          ) : (
            <ScrollView style={{ maxHeight: 380 }}>
              {ranking.map((r, i) => (
                <View key={r.userId} style={[mS.rankRow, r.userId === myId && mS.rankRowMe]}>
                  <Text style={mS.rankPos}>{i + 1}º</Text>
                  <Text style={[mS.rankName, r.userId === myId && mS.rankNameMe]} numberOfLines={1}>
                    {r.nickname}{r.userId === myId ? ' (você)' : ''}
                  </Text>
                  <Text style={mS.rankPts}>{r.points} pts</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Modal: palpites de cada participante num confronto ──────────────────────────

function InspectModal({
  matchId, bracket, viewers, teamById, myId, onClose,
}: {
  matchId: string | null;
  bracket: BracketMatch[];
  viewers: { id: string; label: string; picks: BracketPicks }[];
  teamById: Map<string, TeamInfo>;
  myId: string;
  onClose: () => void;
}): React.JSX.Element {
  const match = matchId ? bracket.find(m => m.id === matchId) ?? null : null;

  // Conta quantos escolheram cada time, e lista por participante.
  const rows = viewers.map(v => ({
    id: v.id, label: v.label, team: v.picks[matchId ?? ''] ? teamById.get(v.picks[matchId ?? '']!) ?? null : null,
  }));
  const counts = new Map<string, number>();
  for (const r of rows) if (r.team) counts.set(r.team.id, (counts.get(r.team.id) ?? 0) + 1);

  return (
    <Modal visible={matchId !== null} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={mS.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={mS.sheet}>
          <View style={mS.sheetHeader}>
            <Text style={mS.sheetTitle}>Palpites — J{match?.matchNumber ?? ''}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={20} color={Colors.textSecondary} /></TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 400 }}>
            {rows.map(r => (
              <View key={r.id} style={[mS.inspRow, r.id === myId && mS.rankRowMe]}>
                <Text style={[mS.inspUser, r.id === myId && mS.rankNameMe]} numberOfLines={1}>
                  {r.label}
                </Text>
                <View style={mS.inspTeam}>
                  {r.team ? (
                    <>
                      <FlagImage country={r.team.country} height={13} />
                      <Text style={mS.inspTeamTxt} numberOfLines={1}>{r.team.name}</Text>
                    </>
                  ) : (
                    <Text style={mS.inspNone}>sem palpite</Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const mS = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  sheet: {
    width: '100%', maxWidth: 420, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 2, borderBottomColor: Colors.accentGold, backgroundColor: Colors.backgroundAlt,
  },
  sheetTitle: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.accentGold },
  empty: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', padding: Spacing.lg, lineHeight: 18 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: 'rgba(55,65,81,0.4)' },
  rankRowMe: { backgroundColor: 'rgba(245,158,11,0.08)' },
  rankPos: { width: 32, fontSize: 12, fontWeight: FontWeights.bold, color: Colors.textSecondary },
  rankName: { flex: 1, fontSize: 13, color: Colors.textPrimary, fontWeight: FontWeights.medium },
  rankNameMe: { color: Colors.accentGold, fontWeight: FontWeights.bold },
  rankPts: { fontSize: 13, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  inspRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(55,65,81,0.4)' },
  inspUser: { width: 110, fontSize: 12, color: Colors.textSecondary, fontWeight: FontWeights.medium },
  inspTeam: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  inspTeamTxt: { fontSize: 13, color: Colors.textPrimary, fontWeight: FontWeights.semibold, flex: 1 },
  inspNone: { fontSize: 12, color: Colors.textSecondary, fontStyle: 'italic' },
});

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
  progress: { fontSize: 12, fontWeight: FontWeights.semibold, color: Colors.textSecondary, flex: 1 },
  progressPts: { color: Colors.accentGold, fontWeight: FontWeights.bold },
  saveRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveTxt: { fontSize: 11, color: Colors.textSecondary },
  rankBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999, borderWidth: 1, borderColor: Colors.accentGold,
  },
  rankBtnTxt: { fontSize: 11, fontWeight: FontWeights.bold, color: Colors.accentGold },
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
