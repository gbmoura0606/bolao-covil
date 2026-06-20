import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthenticatedRequest } from '../middleware/auth';
import { allocateThirds } from '../config/thirdPlaceAllocation';

const prisma = new PrismaClient();

export interface TeamInfo { id: string; name: string; flagEmoji: string; country: string; }

interface StandingRow {
  team: TeamInfo;
  groupId: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  lastResults: string[];
}

export type DbMatch = {
  id: string;
  externalId: string | null;
  round: string;
  group: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  homePenalty: number | null;
  awayPenalty: number | null;
  status: string;
  matchDate: Date;
  venue: string | null;
  homeSlot: string | null;
  awaySlot: string | null;
  homeTeam: TeamInfo | null;
  awayTeam: TeamInfo | null;
};

function compareStandings(a: StandingRow, b: StandingRow): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
  return a.team.name.localeCompare(b.team.name);
}

function breakTieH2H(teams: StandingRow[], groupMatches: DbMatch[]): StandingRow[] {
  if (teams.length === 1) return teams;
  const ids = new Set(teams.map((t) => t.team.id));
  const h2h = groupMatches.filter(
    (m) =>
      m.homeScore !== null &&
      m.awayScore !== null &&
      m.homeTeamId !== null && ids.has(m.homeTeamId) &&
      m.awayTeamId !== null && ids.has(m.awayTeamId),
  );
  const pts = new Map<string, number>();
  const gd  = new Map<string, number>();
  const gf  = new Map<string, number>();
  for (const t of teams) { pts.set(t.team.id, 0); gd.set(t.team.id, 0); gf.set(t.team.id, 0); }
  for (const m of h2h) {
    const ho = m.homeTeamId!, aw = m.awayTeamId!, hs = m.homeScore!, as_ = m.awayScore!;
    gf.set(ho, gf.get(ho)! + hs); gf.set(aw, gf.get(aw)! + as_);
    gd.set(ho, gd.get(ho)! + (hs - as_)); gd.set(aw, gd.get(aw)! + (as_ - hs));
    if (hs > as_)       pts.set(ho, pts.get(ho)! + 3);
    else if (hs === as_) { pts.set(ho, pts.get(ho)! + 1); pts.set(aw, pts.get(aw)! + 1); }
    else                pts.set(aw, pts.get(aw)! + 3);
  }
  return [...teams].sort((a, b) => {
    const ap = pts.get(a.team.id)!, bp = pts.get(b.team.id)!;
    if (bp !== ap) return bp - ap;
    const agd = gd.get(a.team.id)!, bgd = gd.get(b.team.id)!;
    if (bgd !== agd) return bgd - agd;
    const agf = gf.get(a.team.id)!, bgf = gf.get(b.team.id)!;
    if (bgf !== agf) return bgf - agf;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.team.name.localeCompare(b.team.name);
  });
}

function computeStandings(matches: DbMatch[], groupId: string): StandingRow[] {
  const map = new Map<string, StandingRow>();

  function ensure(team: TeamInfo): StandingRow {
    if (!map.has(team.id)) {
      map.set(team.id, {
        team, groupId,
        points: 0, played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, goalDiff: 0, lastResults: [],
      });
    }
    return map.get(team.id)!;
  }

  // Initialize all teams even if no matches played yet
  for (const m of matches) {
    if (m.homeTeam) ensure(m.homeTeam);
    if (m.awayTeam) ensure(m.awayTeam);
  }

  // Process finished matches
  for (const m of matches) {
    if (!m.homeTeam || !m.awayTeam) continue;
    if (m.homeScore === null || m.awayScore === null) continue;

    const home = ensure(m.homeTeam);
    const away = ensure(m.awayTeam);

    home.played++;
    away.played++;
    home.goalsFor += m.homeScore;
    home.goalsAgainst += m.awayScore;
    away.goalsFor += m.awayScore;
    away.goalsAgainst += m.homeScore;

    if (m.homeScore > m.awayScore) {
      home.points += 3; home.won++; home.lastResults.push('W');
      away.lost++; away.lastResults.push('L');
    } else if (m.homeScore === m.awayScore) {
      home.points += 1; home.drawn++; home.lastResults.push('D');
      away.points += 1; away.drawn++; away.lastResults.push('D');
    } else {
      away.points += 3; away.won++; away.lastResults.push('W');
      home.lost++; home.lastResults.push('L');
    }
  }

  for (const s of map.values()) {
    s.goalDiff = s.goalsFor - s.goalsAgainst;
  }

  // Sort: points first, then H2H within tied groups, then overall GD/GF/alpha
  const rows = Array.from(map.values()).sort(compareStandings);
  const result: StandingRow[] = [];
  let i = 0;
  while (i < rows.length) {
    let j = i + 1;
    while (j < rows.length && rows[j].points === rows[i].points) j++;
    result.push(...breakTieH2H(rows.slice(i, j), matches));
    i = j;
  }
  return result;
}

function resolveSlot(
  slot: string | null,
  groupStandings: Map<string, StandingRow[]>,
  knockoutResults: Map<string, TeamInfo | null>,
  /** Anexo C: { grupo do vencedor -> grupo do 3º adversário }. null até a fase de grupos terminar. */
  thirdAllocation: Record<string, string> | null,
  /** Grupo do vencedor adversário neste confronto, usado para resolver o slot de 3º. */
  pairedWinnerGroup: string | null,
): TeamInfo | null {
  if (!slot) return null;

  const groupSlot = slot.match(/^(\d)º Grupo ([A-L])$/);
  if (groupSlot) {
    const pos = parseInt(groupSlot[1]) - 1;
    return groupStandings.get(groupSlot[2])?.[pos]?.team ?? null;
  }

  // 3º colocado: a alocação exata vem do Anexo C, em função do grupo do vencedor
  // adversário e do conjunto dos 8 grupos cujos 3os se classificaram.
  if (/^3º \(/.test(slot)) {
    if (!thirdAllocation || !pairedWinnerGroup) return null;
    const thirdGroup = thirdAllocation[pairedWinnerGroup];
    if (!thirdGroup) return null;
    return groupStandings.get(thirdGroup)?.[2]?.team ?? null;
  }

  const winnerSlot = slot.match(/^Vencedor M(\d+)$/);
  if (winnerSlot) {
    return knockoutResults.get(`W-M${winnerSlot[1]}`) ?? null;
  }

  const loserSlot = slot.match(/^Perdedor M(\d+)$/);
  if (loserSlot) {
    return knockoutResults.get(`L-M${loserSlot[1]}`) ?? null;
  }

  return null;
}

/** Grupo do vencedor ("1º Grupo X") presente em um dos slots do confronto. */
function winnerGroupOf(slot: string | null): string | null {
  const m = slot?.match(/^1º Grupo ([A-L])$/);
  return m ? m[1] : null;
}

export async function getStandings(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const allMatches = await prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchDate: 'asc' },
    }) as DbMatch[];

    res.json(buildStandings(allMatches));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao computar classificações.' });
  }
}

/**
 * Núcleo puro (sem Prisma) que transforma a lista de partidas no payload de
 * classificações + bracket resolvido. Separado de getStandings para ser testável.
 * Espera `allMatches` ordenado por data (mata-mata depende dessa ordem para
 * propagar vencedores das fases anteriores).
 */
export function buildStandings(allMatches: DbMatch[]) {
  const groupMatches = allMatches.filter((m) => m.group !== null);
  const knockoutMatches = allMatches.filter((m) => m.group === null && m.externalId !== null);

  // Group matches by group ID
  const byGroup = new Map<string, DbMatch[]>();
  for (const m of groupMatches) {
    const g = m.group!;
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g)!.push(m);
  }

  // Compute group standings
  const groupStandings = new Map<string, StandingRow[]>();
  const groups = Array.from(byGroup.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([groupId, matches]) => {
      const standings = computeStandings(matches, groupId);
      groupStandings.set(groupId, standings);

      const teamsSeen = new Set<string>();
      const teams: TeamInfo[] = [];
      for (const m of matches) {
        if (m.homeTeam && !teamsSeen.has(m.homeTeam.id)) {
          teamsSeen.add(m.homeTeam.id);
          teams.push(m.homeTeam);
        }
        if (m.awayTeam && !teamsSeen.has(m.awayTeam.id)) {
          teamsSeen.add(m.awayTeam.id);
          teams.push(m.awayTeam);
        }
      }

      return {
        id: groupId,
        name: `Grupo ${groupId}`,
        teams,
        standings,
        matches: matches.map((m) => ({
          id: m.id,
          externalId: m.externalId,
          round: m.round,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          status: m.status,
          matchDate: m.matchDate.toISOString(),
          venue: m.venue,
        })),
      };
    });

  // Thirds ranking: 3rd-place team from each group
  const thirds = groups
    .filter((g) => g.standings.length >= 3)
    .map((g) => g.standings[2])
    .sort(compareStandings);

  // Overall ranking: all teams sorted globally
  const overall = groups
    .flatMap((g) => g.standings)
    .sort(compareStandings);

  // Alocação dos 3os colocados (Anexo C). Só é definida quando a fase de grupos
  // termina (12 grupos, todos os jogos com placar) — antes disso os slots de 3º
  // permanecem como rótulo de grupos possíveis (ex.: "3º (A/B/C/D/F)").
  const groupStageDone =
    groups.length === 12 &&
    groupMatches.every((m) => m.homeScore !== null && m.awayScore !== null);
  let thirdAllocation: Record<string, string> | null = null;
  if (groupStageDone && thirds.length >= 8) {
    thirdAllocation = allocateThirds(thirds.slice(0, 8).map((t) => t.groupId));
  }

  // Knockout bracket with slot resolution
  const knockoutResults = new Map<string, TeamInfo | null>();
  const bracket = knockoutMatches.map((m) => {
    // O grupo do vencedor adversário define qual 3º colocado (Anexo C) entra no slot.
    const pairedForHome = winnerGroupOf(m.awaySlot);
    const pairedForAway = winnerGroupOf(m.homeSlot);
    const homeTeam =
      m.homeTeam ?? resolveSlot(m.homeSlot, groupStandings, knockoutResults, thirdAllocation, pairedForHome);
    const awayTeam =
      m.awayTeam ?? resolveSlot(m.awaySlot, groupStandings, knockoutResults, thirdAllocation, pairedForAway);

    // Vencedor por placar; empate decidido nos pênaltis (mata-mata).
    if (m.homeScore !== null && m.awayScore !== null && m.externalId) {
      let winner: TeamInfo | null = null;
      let loser: TeamInfo | null = null;
      if (m.homeScore > m.awayScore) { winner = homeTeam; loser = awayTeam; }
      else if (m.awayScore > m.homeScore) { winner = awayTeam; loser = homeTeam; }
      else if (m.homePenalty !== null && m.awayPenalty !== null && m.homePenalty !== m.awayPenalty) {
        if (m.homePenalty > m.awayPenalty) { winner = homeTeam; loser = awayTeam; }
        else { winner = awayTeam; loser = homeTeam; }
      }
      if (winner) {
        knockoutResults.set(`W-${m.externalId}`, winner);
        knockoutResults.set(`L-${m.externalId}`, loser);
      }
    }

    const numMatch = m.externalId?.match(/^M(\d+)$/);
    return {
      id: m.id,
      externalId: m.externalId,
      matchNumber: numMatch ? parseInt(numMatch[1]) : null,
      round: m.round,
      status: m.status,
      homeSlot: m.homeSlot,
      awaySlot: m.awaySlot,
      homeTeam,
      awayTeam,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      homePenalty: m.homePenalty,
      awayPenalty: m.awayPenalty,
      matchDate: m.matchDate.toISOString(),
      venue: m.venue,
    };
  });

  return { groups, thirds, overall, bracket };
}
