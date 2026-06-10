import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthenticatedRequest } from '../middleware/auth';
import { SCORING } from '../config/scoring';

const prisma = new PrismaClient();

interface RankingEntry {
  id: string;
  nickname: string;
  points: number;
  exactMatches: number;
  totalPredictions: number;
  winRate: number;
}

function buildEntry(user: {
  id: string;
  nickname: string;
  predictions: { points: number | null }[];
}): RankingEntry {
  const totalPredictions = user.predictions.length;
  const points = user.predictions.reduce((sum, p) => sum + (p.points ?? 0), 0);
  const exactMatches = user.predictions.filter((p) => p.points === SCORING.exactScore).length;
  const winRate =
    totalPredictions > 0
      ? Math.round(
          (user.predictions.filter((p) => (p.points ?? 0) > 0).length / totalPredictions) * 100
        )
      : 0;
  return { id: user.id, nickname: user.nickname, points, exactMatches, totalPredictions, winRate };
}

function computeLeaguePoints(
  predHome: number, predAway: number,
  realHome: number, realAway: number,
  config: { scoreExact: number; scoreGoalDiff: number; scoreResult: number },
): number {
  if (predHome === realHome && predAway === realAway) return config.scoreExact;
  if ((predHome - predAway) === (realHome - realAway)) return config.scoreGoalDiff;
  if (Math.sign(predHome - predAway) === Math.sign(realHome - realAway)) return config.scoreResult;
  return 0;
}

function buildLeagueEntry(
  user: {
    id: string;
    nickname: string;
    predictions: {
      homeScore: number;
      awayScore: number;
      match: { homeScore: number | null; awayScore: number | null };
    }[];
  },
  config: { scoreExact: number; scoreGoalDiff: number; scoreResult: number },
): RankingEntry {
  let points = 0;
  let exactMatches = 0;
  let correctResults = 0;
  const totalPredictions = user.predictions.length;

  for (const p of user.predictions) {
    if (p.match.homeScore === null || p.match.awayScore === null) continue;
    const pts = computeLeaguePoints(p.homeScore, p.awayScore, p.match.homeScore, p.match.awayScore, config);
    points += pts;
    if (pts === config.scoreExact) exactMatches++;
    if (pts > 0) correctResults++;
  }

  const winRate = totalPredictions > 0 ? Math.round((correctResults / totalPredictions) * 100) : 0;
  return { id: user.id, nickname: user.nickname, points, exactMatches, totalPredictions, winRate };
}

export async function getGlobalRanking(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nickname: true,
        predictions: {
          where: { points: { not: null } },
          select: { points: true },
        },
      },
    });

    const ranking = users
      .map(buildEntry)
      .sort((a, b) => b.points - a.points || b.exactMatches - a.exactMatches);

    res.json(ranking);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar ranking.' });
  }
}

export async function getLeagueRanking(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { leagueId } = req.params;

  try {
    const league = await prisma.league.findUnique({ where: { id: leagueId } });
    if (!league) {
      res.status(404).json({ error: 'Liga não encontrada.' });
      return;
    }

    const config = {
      scoreExact: league.scoreExact,
      scoreGoalDiff: league.scoreGoalDiff,
      scoreResult: league.scoreResult,
    };

    const userLeagues = await prisma.userLeague.findMany({
      where: { leagueId },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            predictions: {
              where: { match: { status: 'FINISHED' } },
              select: {
                homeScore: true,
                awayScore: true,
                match: { select: { homeScore: true, awayScore: true } },
              },
            },
          },
        },
      },
    });

    const ranking = userLeagues
      .map(({ user }) => buildLeagueEntry(user, config))
      .sort((a, b) => b.points - a.points || b.exactMatches - a.exactMatches);

    res.json(ranking);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar ranking da liga.' });
  }
}
