import { Response } from 'express';
import { PrismaClient, MatchStatus } from '@prisma/client';
import type { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

const matchInclude = {
  homeTeam: true,
  awayTeam: true,
} as const;

export async function listMatches(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const matches = await prisma.match.findMany({
      include: matchInclude,
      orderBy: { matchDate: 'asc' },
    });
    res.json(matches);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar partidas.' });
  }
}

export async function getMatch(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const match = await prisma.match.findUnique({ where: { id }, include: matchInclude });
    if (!match) {
      res.status(404).json({ error: 'Partida não encontrada.' });
      return;
    }
    res.json(match);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar partida.' });
  }
}

export async function createMatch(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { homeTeamId, awayTeamId, matchDate, round, group } = req.body as {
    homeTeamId?: string;
    awayTeamId?: string;
    matchDate?: string;
    round?: string;
    group?: string;
  };

  if (!homeTeamId || !awayTeamId || !matchDate || !round) {
    res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    return;
  }

  try {
    const match = await prisma.match.create({
      data: { homeTeamId, awayTeamId, matchDate: new Date(matchDate), round, group },
      include: matchInclude,
    });
    res.status(201).json(match);
  } catch {
    res.status(500).json({ error: 'Erro ao criar partida.' });
  }
}

export async function updateMatchScore(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { homeScore, awayScore, status } = req.body as {
    homeScore?: number;
    awayScore?: number;
    status?: MatchStatus;
  };

  try {
    const match = await prisma.match.update({
      where: { id },
      data: {
        ...(homeScore !== undefined && { homeScore }),
        ...(awayScore !== undefined && { awayScore }),
        ...(status !== undefined && { status }),
      },
      include: matchInclude,
    });
    res.json(match);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar partida.' });
  }
}
