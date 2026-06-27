import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

/**
 * GET /api/bracket-prediction
 * Retorna a previsão de chaveamento do usuário autenticado.
 */
export async function getBracketPrediction(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const bp = await prisma.bracketPrediction.findUnique({
      where: { userId: req.userId! },
    });
    if (!bp) {
      res.json({ picks: {} });
      return;
    }
    res.json({ picks: bp.picks as Record<string, string | null> });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar previsão de chaveamento.' });
  }
}

/**
 * PUT /api/bracket-prediction
 * Upsert da previsão de chaveamento do usuário autenticado.
 * Body: { picks: { [matchId]: teamId | null } }
 */
export async function upsertBracketPrediction(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { picks } = req.body as { picks?: Record<string, string | null> };

  if (!picks || typeof picks !== 'object') {
    res.status(400).json({ error: 'picks é obrigatório e deve ser um objeto.' });
    return;
  }

  try {
    const bp = await prisma.bracketPrediction.upsert({
      where: { userId: req.userId! },
      update: { picks },
      create: { userId: req.userId!, picks },
    });
    res.json({ picks: bp.picks as Record<string, string | null> });
  } catch {
    res.status(500).json({ error: 'Erro ao salvar previsão de chaveamento.' });
  }
}
