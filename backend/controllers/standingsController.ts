import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

interface TeamInfo { id: string; name: string; flagEmoji: string; country: string; }

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

type DbMatch = {
  id: string;
  externalId: string | null;
  round: string;
  group: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
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

  return Array.from(map.values()).sort(compareStandings);
}

function resolveSlot(
  slot: string | null,
  groupStandings: Map<string, StandingRow[]>,
  thirdsRanking: StandingRow[],
  knockoutResults: Map<string, TeamInfo | null>,
): TeamInfo | null {
  if (!slot) return null;

  const groupSlot = slot.match(/^(\d)º Grupo ([A-L])$/);
  if (groupSlot) {
    const pos = parseInt(groupSlot[1]) - 1;
    return groupStandings.get(groupSlot[2])?.[pos]?.team ?? null;
  }

  const thirdSlot = slot.match(/^3º melhor \((\d+)\)$/);
  if (thirdSlot) {
    return thirdsRanking[parseInt(thirdSlot[1]) - 1]?.team ?? null;
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

export async function getStandings(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const allMatches = await prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchDate: 'asc' },
    }) as DbMatch[];

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

    // Knockout bracket with slot resolution
    const knockoutResults = new Map<string, TeamInfo | null>();
    const bracket = knockoutMatches.map((m) => {
      const homeTeam =
        m.homeTeam ?? resolveSlot(m.homeSlot, groupStandings, thirds, knockoutResults);
      const awayTeam =
        m.awayTeam ?? resolveSlot(m.awaySlot, groupStandings, thirds, knockoutResults);

      if (m.homeScore !== null && m.awayScore !== null && m.externalId) {
        if (m.homeScore > m.awayScore) {
          knockoutResults.set(`W-${m.externalId}`, homeTeam);
          knockoutResults.set(`L-${m.externalId}`, awayTeam);
        } else if (m.awayScore > m.homeScore) {
          knockoutResults.set(`W-${m.externalId}`, awayTeam);
          knockoutResults.set(`L-${m.externalId}`, homeTeam);
        }
      }

      const numMatch = m.externalId?.match(/^M(\d+)$/);
      return {
        id: m.id,
        externalId: m.externalId,
        matchNumber: numMatch ? parseInt(numMatch[1]) : null,
        round: m.round,
        homeSlot: m.homeSlot,
        awaySlot: m.awaySlot,
        homeTeam,
        awayTeam,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        matchDate: m.matchDate.toISOString(),
        venue: m.venue,
      };
    });

    res.json({ groups, thirds, overall, bracket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao computar classificações.' });
  }
}
