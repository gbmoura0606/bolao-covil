import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

interface RankingEntry {
  id: string;
  name: string;
  email: string;
  points: number;
  exactMatches: number;
  totalPredictions: number;
  winRate: number;
}

export async function getGlobalRanking(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        predictions: {
          where: { points: { not: null } },
          select: { points: true },
        },
      },
    });

    const ranking: RankingEntry[] = users
      .map((user) => {
        const totalPredictions = user.predictions.length;
        const points = user.predictions.reduce((sum, p) => sum + (p.points ?? 0), 0);
        const exactMatches = user.predictions.filter((p) => p.points === 3).length;
        const winRate =
          totalPredictions > 0
            ? Math.round((user.predictions.filter((p) => (p.points ?? 0) > 0).length / totalPredictions) * 100)
            : 0;

        return { id: user.id, name: user.name, email: user.email, points, exactMatches, totalPredictions, winRate };
      })
      .sort((a, b) => b.points - a.points || b.exactMatches - a.exactMatches);

    res.json(ranking);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar ranking.' });
  }
}

export async function getLeagueRanking(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { leagueId } = req.params;

  try {
    const userLeagues = await prisma.userLeague.findMany({
      where: { leagueId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            predictions: {
              where: { points: { not: null } },
              select: { points: true },
            },
          },
        },
      },
    });

    const ranking: RankingEntry[] = userLeagues
      .map(({ user }) => {
        const totalPredictions = user.predictions.length;
        const points = user.predictions.reduce((sum, p) => sum + (p.points ?? 0), 0);
        const exactMatches = user.predictions.filter((p) => p.points === 3).length;
        const winRate =
          totalPredictions > 0
            ? Math.round((user.predictions.filter((p) => (p.points ?? 0) > 0).length / totalPredictions) * 100)
            : 0;

        return { id: user.id, name: user.name, email: user.email, points, exactMatches, totalPredictions, winRate };
      })
      .sort((a, b) => b.points - a.points || b.exactMatches - a.exactMatches);

    res.json(ranking);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar ranking da liga.' });
  }
}
