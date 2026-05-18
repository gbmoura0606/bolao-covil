import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

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
        owner: { select: { id: true, name: true } },
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

function generateLeagueCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
