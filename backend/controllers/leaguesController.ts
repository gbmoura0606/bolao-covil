import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthenticatedRequest } from '../middleware/auth';
import { brtWallClockNow } from '../config/time';

const prisma = new PrismaClient();

/** A Copa começou se alguma partida já saiu de OPEN ou se o primeiro jogo já tem horário passado. */
async function tournamentStarted(): Promise<boolean> {
  const started = await prisma.match.findFirst({
    where: {
      OR: [
        { status: { not: 'OPEN' } },
        { matchDate: { lte: brtWallClockNow() } },
      ],
    },
    select: { id: true },
  });
  return started !== null;
}

export async function listUserLeagues(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userLeagues = await prisma.userLeague.findMany({
      where: { userId: req.userId },
      include: {
        league: {
          include: {
            _count: { select: { userLeagues: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });
    res.json(userLeagues);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar ligas.' });
  }
}

export async function getLeague(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const league = await prisma.league.findUnique({
      where: { id },
      include: {
        _count: { select: { userLeagues: true } },
        owner: { select: { id: true, nickname: true } },
      },
    });
    if (!league) {
      res.status(404).json({ error: 'Liga não encontrada.' });
      return;
    }
    res.json(league);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar liga.' });
  }
}

export async function createLeague(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { name } = req.body as { name?: string };

  if (!name || name.trim().length < 3) {
    res.status(400).json({ error: 'Nome da liga deve ter pelo menos 3 caracteres.' });
    return;
  }

  const code = generateLeagueCode();

  try {
    const league = await prisma.league.create({
      data: { name: name.trim(), code, ownerId: req.userId! },
    });

    await prisma.userLeague.create({
      data: { userId: req.userId!, leagueId: league.id },
    });

    res.status(201).json(league);
  } catch {
    res.status(500).json({ error: 'Erro ao criar liga.' });
  }
}

export async function joinLeague(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { code } = req.body as { code?: string };

  if (!code || code.trim().length < 4) {
    res.status(400).json({ error: 'Código de liga inválido.' });
    return;
  }

  try {
    const league = await prisma.league.findUnique({ where: { code: code.trim().toUpperCase() } });
    if (!league) {
      res.status(404).json({ error: 'Liga não encontrada com este código.' });
      return;
    }

    const existing = await prisma.userLeague.findUnique({
      where: { userId_leagueId: { userId: req.userId!, leagueId: league.id } },
    });
    if (existing) {
      res.status(409).json({ error: 'Você já participa desta liga.' });
      return;
    }

    await prisma.userLeague.create({
      data: { userId: req.userId!, leagueId: league.id },
    });

    res.json({ success: true, league });
  } catch {
    res.status(500).json({ error: 'Erro ao entrar na liga.' });
  }
}

export async function updateLeagueScoring(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { scoreResult, scoreGoalDiff, scoreExact } = req.body as {
    scoreResult?: number;
    scoreGoalDiff?: number;
    scoreExact?: number;
  };

  try {
    const league = await prisma.league.findUnique({ where: { id } });
    if (!league) {
      res.status(404).json({ error: 'Liga não encontrada.' });
      return;
    }
    if (league.ownerId !== req.userId) {
      res.status(403).json({ error: 'Apenas o dono da liga pode alterar a pontuação.' });
      return;
    }
    if (await tournamentStarted()) {
      res.status(409).json({ error: 'A Copa já começou — os critérios de pontuação não podem mais ser alterados.' });
      return;
    }

    const validate = (v: unknown): boolean =>
      v === undefined || (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 99);
    if (!validate(scoreResult) || !validate(scoreGoalDiff) || !validate(scoreExact)) {
      res.status(400).json({ error: 'Valores de pontuação devem ser inteiros entre 0 e 99.' });
      return;
    }

    const data: { scoreResult?: number; scoreGoalDiff?: number; scoreExact?: number } = {};
    if (scoreResult !== undefined) data.scoreResult = scoreResult;
    if (scoreGoalDiff !== undefined) data.scoreGoalDiff = scoreGoalDiff;
    if (scoreExact !== undefined) data.scoreExact = scoreExact;

    const updated = await prisma.league.update({ where: { id }, data });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar pontuação.' });
  }
}

function generateLeagueCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
