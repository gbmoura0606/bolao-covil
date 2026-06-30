import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthenticatedRequest } from '../middleware/auth';
import { SCORING } from '../config/scoring';
import { buildStandings, type DbMatch } from './standingsController';
import { computeBracketPoints } from '../config/bracketScoring';

const prisma = new PrismaClient();

interface RankingEntry {
  id: string;
  nickname: string;
  /** Total geral = palpites de placar + Previsão de Chaveamento. */
  points: number;
  exactMatches: number;
  /** Acertos de saldo (diferença de gols) — só ranking de liga. */
  goalDiffMatches?: number;
  /** Acertos de vencedor/empate — só ranking de liga. */
  resultMatches?: number;
  totalPredictions: number;
  winRate: number;
  /** Pontos da Previsão de Chaveamento (mata-mata), componente do total. */
  bracketPoints?: number;
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
  let exactMatches = 0;   // placar exato
  let goalDiffMatches = 0; // saldo de gols
  let resultMatches = 0;   // vencedor/empate
  const totalPredictions = user.predictions.length;

  for (const p of user.predictions) {
    const rh = p.match.homeScore, ra = p.match.awayScore;
    if (rh === null || ra === null) continue;
    const ph = p.homeScore, pa = p.awayScore;
    // Hierarquia: exato > saldo > vencedor (cada palpite conta em uma categoria).
    if (ph === rh && pa === ra) { exactMatches++; points += config.scoreExact; }
    else if (ph - pa === rh - ra) { goalDiffMatches++; points += config.scoreGoalDiff; }
    else if (Math.sign(ph - pa) === Math.sign(rh - ra)) { resultMatches++; points += config.scoreResult; }
  }

  const correct = exactMatches + goalDiffMatches + resultMatches;
  const winRate = totalPredictions > 0 ? Math.round((correct / totalPredictions) * 100) : 0;
  return { id: user.id, nickname: user.nickname, points, exactMatches, goalDiffMatches, resultMatches, totalPredictions, winRate };
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

    // Total global agora inclui a Previsão de Chaveamento.
    const [matches, bracketPreds] = await Promise.all([
      prisma.match.findMany({ include: { homeTeam: true, awayTeam: true }, orderBy: { matchDate: 'asc' } }),
      prisma.bracketPrediction.findMany(),
    ]);
    const { bracket } = buildStandings(matches as DbMatch[]);
    const bracketByUser = new Map<string, number>();
    for (const bp of bracketPreds) {
      bracketByUser.set(bp.userId, computeBracketPoints(bp.picks as Record<string, string | null>, bracket).total);
    }

    const ranking = users
      .map((u) => {
        const e = buildEntry(u);
        const bpts = bracketByUser.get(u.id) ?? 0;
        return { ...e, bracketPoints: bpts, points: e.points + bpts };
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

    // Pontos da Previsão de Chaveamento por usuário (coluna separada).
    const [matches, bracketPreds] = await Promise.all([
      prisma.match.findMany({ include: { homeTeam: true, awayTeam: true }, orderBy: { matchDate: 'asc' } }),
      prisma.bracketPrediction.findMany(),
    ]);
    const { bracket } = buildStandings(matches as DbMatch[]);
    const bracketByUser = new Map<string, number>();
    for (const bp of bracketPreds) {
      bracketByUser.set(bp.userId, computeBracketPoints(bp.picks as Record<string, string | null>, bracket).total);
    }

    const ranking = userLeagues
      .map(({ user }) => {
        const e = buildLeagueEntry(user, config);
        const bpts = bracketByUser.get(user.id) ?? 0;
        // Total da liga inclui a Previsão (mostrada também na coluna "Prev.").
        return { ...e, bracketPoints: bpts, points: e.points + bpts };
      })
      .sort((a, b) => b.points - a.points || b.exactMatches - a.exactMatches);

    res.json(ranking);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar ranking da liga.' });
  }
}
