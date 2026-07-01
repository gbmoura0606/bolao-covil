import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthenticatedRequest } from '../middleware/auth';
import { hasKickedOff } from '../config/time';
import { isDelayedMatch } from '../config/delayedMatches';

const prisma = new PrismaClient();

type MatchWithTeams = {
  status: string;
  matchDate: Date;
  homeTeam: { country: string } | null;
  awayTeam: { country: string } | null;
};

/**
 * Palpites fecham quando o status sai de OPEN **ou** quando o horário do
 * jogo chega — o que vier primeiro. O horário protege contra o caso de a
 * gerência esquecer de fechar a partida manualmente.
 *
 * Exceção: jogos em DELAYED_MATCH_TEAM_PAIRS (atraso real, ex.: clima) ignoram
 * o fallback por horário — só fecham quando a gerência mudar o status. Isso
 * também mantém os palpites dos outros escondidos até lá (mesma condição).
 */
function predictionsClosed(match: MatchWithTeams): boolean {
  if (match.status !== 'OPEN') return true;
  if (isDelayedMatch(match.homeTeam?.country, match.awayTeam?.country)) return false;
  return hasKickedOff(match.matchDate);
}

/**
 * Palpites de TODOS os usuários para uma partida.
 * Só liberados depois que a partida fecha (status ≠ OPEN ou horário do jogo
 * atingido) — antes disso ninguém pode copiar o palpite dos outros.
 */
export async function listMatchPredictions(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { matchId } = req.params;

  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { homeTeam: true, awayTeam: true },
    });
    if (!match) { res.status(404).json({ error: 'Partida não encontrada.' }); return; }
    if (!predictionsClosed(match)) {
      res.status(403).json({ error: 'Os palpites do grupo ficam visíveis quando a partida começa.' });
      return;
    }

    const predictions = await prisma.prediction.findMany({
      where: { matchId },
      include: { user: { select: { id: true, nickname: true } } },
      orderBy: { user: { nickname: 'asc' } },
    });
    res.json(predictions.map((p) => ({
      userId: p.user.id,
      nickname: p.user.nickname,
      homeScore: p.homeScore,
      awayScore: p.awayScore,
      points: p.points,
    })));
  } catch {
    res.status(500).json({ error: 'Erro ao buscar palpites da partida.' });
  }
}

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
    matchId?: string; homeScore?: number; awayScore?: number;
  };

  if (!matchId || homeScore === undefined || awayScore === undefined) {
    res.status(400).json({ error: 'matchId, homeScore e awayScore são obrigatórios.' }); return;
  }
  if (homeScore < 0 || awayScore < 0 || homeScore > 9 || awayScore > 9) {
    res.status(400).json({ error: 'Placar deve ser entre 0 e 9.' }); return;
  }

  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { homeTeam: true, awayTeam: true },
    });
    if (!match) { res.status(404).json({ error: 'Partida não encontrada.' }); return; }
    if (predictionsClosed(match)) {
      res.status(400).json({ error: 'Esta partida não aceita mais palpites.' }); return;
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
  const { homeScore, awayScore } = req.body as { homeScore?: number; awayScore?: number };

  if (homeScore === undefined || awayScore === undefined) {
    res.status(400).json({ error: 'homeScore e awayScore são obrigatórios.' }); return;
  }

  try {
    const existing = await prisma.prediction.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.userId) {
      res.status(404).json({ error: 'Palpite não encontrado.' }); return;
    }

    const match = await prisma.match.findUnique({
      where: { id: existing.matchId },
      include: { homeTeam: true, awayTeam: true },
    });
    if (!match || predictionsClosed(match)) {
      res.status(400).json({ error: 'Esta partida não aceita mais alterações.' }); return;
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

/**
 * Upsert: cria ou atualiza o palpite do usuário autenticado para uma partida.
 * Endpoint principal do autosave — idempotente, seguro para disparar múltiplas vezes.
 */
export async function upsertPrediction(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { matchId } = req.params;
  const { homeScore, awayScore } = req.body as { homeScore?: number; awayScore?: number };

  if (homeScore === undefined || awayScore === undefined) {
    res.status(400).json({ error: 'homeScore e awayScore são obrigatórios.' }); return;
  }
  if (homeScore < 0 || awayScore < 0 || homeScore > 9 || awayScore > 9) {
    res.status(400).json({ error: 'Placar deve ser entre 0 e 9.' }); return;
  }

  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { homeTeam: true, awayTeam: true },
    });
    if (!match) { res.status(404).json({ error: 'Partida não encontrada.' }); return; }
    if (predictionsClosed(match)) {
      res.status(400).json({ error: 'Esta partida não aceita mais palpites.' }); return;
    }

    const prediction = await prisma.prediction.upsert({
      where: { userId_matchId: { userId: req.userId!, matchId } },
      update: { homeScore, awayScore },
      create: { userId: req.userId!, matchId, homeScore, awayScore },
    });
    res.json(prediction);
  } catch {
    res.status(500).json({ error: 'Erro ao salvar palpite.' });
  }
}
