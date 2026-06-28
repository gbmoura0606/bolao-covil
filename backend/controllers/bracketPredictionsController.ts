import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthenticatedRequest } from '../middleware/auth';
import { isBracketLocked } from '../config/bracket';

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

  if (!picks || typeof picks !== 'object' || Array.isArray(picks)) {
    res.status(400).json({ error: 'picks é obrigatório e deve ser um objeto.' });
    return;
  }

  // Trava definitiva: depois do 1º jogo do mata-mata, a previsão não muda mais.
  if (isBracketLocked()) {
    res.status(403).json({ error: 'A previsão de chaveamento está encerrada e não pode mais ser alterada.' });
    return;
  }

  // Validação estrutural: chaves string, valores teamId (string) ou null, tamanho sensato.
  const entries = Object.entries(picks);
  if (entries.length > 64) {
    res.status(400).json({ error: 'picks inválido.' });
    return;
  }
  for (const [k, v] of entries) {
    if (typeof k !== 'string' || (v !== null && typeof v !== 'string')) {
      res.status(400).json({ error: 'picks inválido.' });
      return;
    }
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
