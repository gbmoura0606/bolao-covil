// ─── CAMADA DE COMPUTAÇÃO ─────────────────────────────────────────────────────
//
// REGRA: Nenhum componente calcula standings por conta própria.
//        Importe SEMPRE deste arquivo, nunca de worldcup2026.ts diretamente
//        para dados derivados.
//
// Fluxo de dados:
//   worldcup2026.ts  →  computed.ts  →  components
//   (scores brutos)     (pure fns)      (render only)
//
// Para atualizar um resultado: edite homeScore/awayScore em worldcup2026.ts.
// Todos os rankings, bracket e estatísticas se atualizam automaticamente.
// ──────────────────────────────────────────────────────────────────────────────

import {
  GROUPS, KNOCKOUT_MATCHES, CLASSIFICATION_CRITERIA,
  type WCTeam, type WCGroup, type WCMatch, type KnockoutMatch, type KnockoutRound,
} from './worldcup2026';

export type { WCTeam, WCGroup, WCMatch, KnockoutMatch, KnockoutRound };
export { GROUPS, KNOCKOUT_MATCHES, CLASSIFICATION_CRITERIA };

// ─── Tipo derivado: standing calculado ───────────────────────────────────────

export interface WCStanding {
  team: WCTeam;
  groupId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  lastResults: Array<'W' | 'D' | 'L'>;
}

// ─── computeGroupStandings ────────────────────────────────────────────────────
// Recalcula a tabela de um grupo a partir dos resultados brutos das partidas.

export function computeGroupStandings(group: WCGroup): WCStanding[] {
  const map = new Map<string, WCStanding>();

  for (const team of group.teams) {
    map.set(team.id, {
      team, groupId: group.id,
      played: 0, won: 0, drawn: 0, lost: 0,
      goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0,
      lastResults: [],
    });
  }

  for (const m of group.matches) {
    if (m.homeScore === null || m.awayScore === null) continue;

    const home = map.get(m.home.id)!;
    const away = map.get(m.away.id)!;

    home.played++; away.played++;
    home.goalsFor    += m.homeScore; home.goalsAgainst += m.awayScore;
    away.goalsFor    += m.awayScore; away.goalsAgainst += m.homeScore;
    home.goalDiff = home.goalsFor - home.goalsAgainst;
    away.goalDiff = away.goalsFor - away.goalsAgainst;

    if (m.homeScore > m.awayScore) {
      home.won++; home.points += 3; away.lost++;
      home.lastResults.push('W'); away.lastResults.push('L');
    } else if (m.homeScore < m.awayScore) {
      away.won++; away.points += 3; home.lost++;
      home.lastResults.push('L'); away.lastResults.push('W');
    } else {
      home.drawn++; home.points++; away.drawn++; away.points++;
      home.lastResults.push('D'); away.lastResults.push('D');
    }
  }

  return Array.from(map.values()).sort(standingComparator);
}

function standingComparator(a: WCStanding, b: WCStanding): number {
  if (b.points    !== a.points)    return b.points    - a.points;
  if (b.goalDiff  !== a.goalDiff)  return b.goalDiff  - a.goalDiff;
  if (b.goalsFor  !== a.goalsFor)  return b.goalsFor  - a.goalsFor;
  return 0;
}

// ─── computeAllGroupStandings ─────────────────────────────────────────────────

export function computeAllGroupStandings(): Map<string, WCStanding[]> {
  const result = new Map<string, WCStanding[]>();
  for (const g of GROUPS) result.set(g.id, computeGroupStandings(g));
  return result;
}

// ─── computeThirdPlaceRanking ─────────────────────────────────────────────────
// Classifica os 12 terceiros colocados para definir os 8 que avançam.

export function computeThirdPlaceRanking(): WCStanding[] {
  const all = computeAllGroupStandings();
  return Array.from(all.values())
    .map((standings) => standings[2])
    .filter((s): s is WCStanding => s !== undefined)
    .sort(standingComparator);
}

// ─── computeOverallRanking ────────────────────────────────────────────────────
// Classifica todos os 48 times globalmente (pontos → SG → GP).

export interface RankedStanding extends WCStanding {
  groupPos: number;
}

export function computeOverallRanking(): RankedStanding[] {
  const all = computeAllGroupStandings();
  const result: RankedStanding[] = [];
  for (const [, standings] of all) {
    standings.forEach((st, idx) => result.push({ ...st, groupPos: idx + 1 }));
  }
  return result.sort(standingComparator);
}

// ─── computeKnockoutBracket ───────────────────────────────────────────────────
// Preenche os slots do mata-mata com times reais onde possível.
// Slots textuais sem time resolvido ficam como null (exibidos como "A definir").

export interface ResolvedKnockoutMatch extends Omit<KnockoutMatch, 'homeScore' | 'awayScore'> {
  homeTeam: WCTeam | null;
  awayTeam: WCTeam | null;
  homeScore: number | null;
  awayScore: number | null;
}

export function computeKnockoutBracket(): ResolvedKnockoutMatch[] {
  const allStandings = computeAllGroupStandings();
  const thirds = computeThirdPlaceRanking();

  // Copia mutável das partidas com times resolvidos
  const resolved: ResolvedKnockoutMatch[] = KNOCKOUT_MATCHES.map((m) => ({
    ...m, homeTeam: null, awayTeam: null,
  }));

  const byNum = new Map<number, ResolvedKnockoutMatch>(
    resolved.map((m) => [m.matchNumber, m]),
  );

  // Resolve cada slot
  for (const m of resolved) {
    m.homeTeam = resolveSlot(m.homeSlot, allStandings, thirds, byNum);
    m.awayTeam = resolveSlot(m.awaySlot, allStandings, thirds, byNum);
  }

  return resolved;
}

function resolveSlot(
  slot: string,
  allStandings: Map<string, WCStanding[]>,
  thirds: WCStanding[],
  byNum: Map<number, ResolvedKnockoutMatch>,
): WCTeam | null {
  // "1º Grupo A" / "2º Grupo B"
  const groupMatch = slot.match(/^(\d+)[°º]\s+Grupo\s+([A-L])$/i);
  if (groupMatch) {
    const pos = parseInt(groupMatch[1], 10) - 1;
    const gid = groupMatch[2].toUpperCase();
    return allStandings.get(gid)?.[pos]?.team ?? null;
  }

  // "3º melhor (n)"
  const thirdMatch = slot.match(/^3[°º]\s+melhor\s+\((\d+)\)$/i);
  if (thirdMatch) {
    const idx = parseInt(thirdMatch[1], 10) - 1;
    return thirds[idx]?.team ?? null;
  }

  // "Vencedor M49"
  const winnerMatch = slot.match(/^Vencedor M(\d+)$/i);
  if (winnerMatch) {
    const src = byNum.get(parseInt(winnerMatch[1], 10));
    if (src?.homeScore !== null && src?.awayScore !== null && src.homeScore !== undefined && src.awayScore !== undefined) {
      if (src.homeScore > src.awayScore) return src.homeTeam;
      if (src.awayScore > src.homeScore) return src.awayTeam;
    }
    return null;
  }

  // "Perdedor M77" (3º lugar)
  const loserMatch = slot.match(/^Perdedor M(\d+)$/i);
  if (loserMatch) {
    const src = byNum.get(parseInt(loserMatch[1], 10));
    if (src?.homeScore !== null && src?.awayScore !== null && src.homeScore !== undefined && src.awayScore !== undefined) {
      if (src.homeScore < src.awayScore) return src.homeTeam;
      if (src.awayScore < src.homeScore) return src.awayTeam;
    }
    return null;
  }

  return null;
}

// ─── getKnockoutByRound (helper para componentes) ────────────────────────────

export function getKnockoutByRound(round: KnockoutRound): ResolvedKnockoutMatch[] {
  return computeKnockoutBracket().filter((m) => m.round === round);
}

export function getClassificationCriteria() {
  return CLASSIFICATION_CRITERIA;
}
