import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export async function getUserPredictions(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const predictions = await prisma.prediction.findMany({
      where: { userId: req.userId },
      include: {
        match: { include: { homeTeam: true, awayTeam: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(predictions);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar palpites.' });
  }
}

export async function createPrediction(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { matchId, homeScore, awayScore } = req.body as {
    matchId?: string;
    homeScore?: number;
    awayScore?: number;
  };

  if (!matchId || homeScore === undefined || awayScore === undefined) {
    res.status(400).json({ error: 'matchId, homeScore e awayScore são obrigatórios.' });
    return;
  }

  if (homeScore < 0 || awayScore < 0 || homeScore > 9 || awayScore > 9) {
    res.status(400).json({ error: 'Placar deve ser entre 0 e 9.' });
    return;
  }

  try {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      res.status(404).json({ error: 'Partida não encontrada.' });
      return;
    }
    if (match.status !== 'OPEN') {
      res.status(400).json({ error: 'Esta partida não aceita mais palpites.' });
      return;
    }

    const prediction = await prisma.prediction.create({
      data: { userId: req.userId!, matchId, homeScore, awayScore },
    });
    res.status(201).json(prediction);
  } catch {
    res.status(500).json({ error: 'Erro ao salvar palpite.' });
  }
}

export async function updatePrediction(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { homeScore, awayScore } = req.body as {
    homeScore?: number;
    awayScore?: number;
  };

  if (homeScore === undefined || awayScore === undefined) {
    res.status(400).json({ error: 'homeScore e awayScore são obrigatórios.' });
    return;
  }

  try {
    const existing = await prisma.prediction.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.userId) {
      res.status(404).json({ error: 'Palpite não encontrado.' });
      return;
    }

    const match = await prisma.match.findUnique({ where: { id: existing.matchId } });
    if (match?.status !== 'OPEN') {
      res.status(400).json({ error: 'Esta partida não aceita mais alterações.' });
      return;
    }

    const prediction = await prisma.prediction.update({
      where: { id },
      data: { homeScore, awayScore },
    });
    res.json(prediction);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar palpite.' });
  }
}
