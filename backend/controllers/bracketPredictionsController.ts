import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthenticatedRequest } from '../middleware/auth';
import { isBracketLocked, KNOCKOUT_MATCH_COUNT } from '../config/bracket';
import { buildStandings, type DbMatch } from './standingsController';
import { computeBracketPoints } from '../config/bracketScoring';

const prisma = new PrismaClient();

function countPicks(picks: Record<string, string | null>): number {
  return Object.values(picks).filter(Boolean).length;
}

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
 * GET /api/bracket-prediction/all
 * Lista as previsões de TODOS os participantes — liberada apenas APÓS a trava
 * (início do mata-mata). Antes disso responde 403 para ninguém copiar.
 */
export async function getAllBracketPredictions(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!isBracketLocked()) {
      res.status(403).json({ error: 'As previsões dos participantes só ficam visíveis após o encerramento.' });
      return;
    }
    const all = await prisma.bracketPrediction.findMany({
      include: { user: { select: { id: true, nickname: true } } },
      orderBy: { user: { nickname: 'asc' } },
    });
    res.json({
      predictions: all.map((bp) => ({
        userId: bp.userId,
        nickname: bp.user.nickname,
        picks: bp.picks as Record<string, string | null>,
      })),
    });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar previsões dos participantes.' });
  }
}

/**
 * GET /api/bracket-prediction/ranking
 * Ranking específico da Previsão: pontos de cada participante conforme os
 * resultados oficiais (escala por fase). Não expõe os picks, só os pontos.
 */
export async function getBracketRanking(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const [preds, matches] = await Promise.all([
      prisma.bracketPrediction.findMany({ include: { user: { select: { id: true, nickname: true } } } }),
      prisma.match.findMany({ include: { homeTeam: true, awayTeam: true }, orderBy: { matchDate: 'asc' } }),
    ]);
    const { bracket } = buildStandings(matches as DbMatch[]);
    const ranking = preds
      .map((bp) => {
        const picks = bp.picks as Record<string, string | null>;
        return {
          userId: bp.userId,
          nickname: bp.user.nickname,
          points: computeBracketPoints(picks, bracket).total,
          done: countPicks(picks),
        };
      })
      .sort((a, b) => b.points - a.points || b.done - a.done || a.nickname.localeCompare(b.nickname));
    res.json({ ranking });
  } catch {
    res.status(500).json({ error: 'Erro ao montar o ranking da previsão.' });
  }
}

/**
 * GET /api/bracket-prediction/admin/status  (gerência)
 * Situação de preenchimento da Previsão por usuário — inclusive quem ainda não
 * começou. Não expõe os picks, só a contagem.
 */
export async function getBracketAdminStatus(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, nickname: true, bracketPrediction: { select: { picks: true, updatedAt: true } } },
      orderBy: { nickname: 'asc' },
    });
    res.json({
      users: users.map((u) => {
        const picks = (u.bracketPrediction?.picks as Record<string, string | null> | undefined) ?? {};
        const done = countPicks(picks);
        return {
          userId: u.id,
          nickname: u.nickname,
          done,
          total: KNOCKOUT_MATCH_COUNT,
          complete: done >= KNOCKOUT_MATCH_COUNT,
          updatedAt: u.bracketPrediction?.updatedAt ?? null,
        };
      }),
    });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar a situação das previsões.' });
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
