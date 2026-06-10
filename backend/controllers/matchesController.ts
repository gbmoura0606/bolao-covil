import { Response } from 'express';
import { PrismaClient, MatchStatus } from '@prisma/client';
import type { AuthenticatedRequest } from '../middleware/auth';
import { computePoints } from '../config/scoring';
import { hasKickedOff } from '../config/time';

const prisma = new PrismaClient();

const matchInclude = { homeTeam: true, awayTeam: true } as const;

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
    if (!match) { res.status(404).json({ error: 'Partida não encontrada.' }); return; }
    res.json(match);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar partida.' });
  }
}

export async function createMatch(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { homeTeamId, awayTeamId, matchDate, round, group } = req.body as {
    homeTeamId?: string; awayTeamId?: string; matchDate?: string; round?: string; group?: string;
  };
  if (!homeTeamId || !awayTeamId || !matchDate || !round) {
    res.status(400).json({ error: 'Campos obrigatórios ausentes.' }); return;
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
    homeScore?: number; awayScore?: number; status?: MatchStatus;
  };

  const validScore = (v: number | undefined): boolean =>
    v === undefined || (Number.isInteger(v) && v >= 0 && v <= 99);
  if (!validScore(homeScore) || !validScore(awayScore)) {
    res.status(400).json({ error: 'Placar deve ser um inteiro entre 0 e 99.' });
    return;
  }

  try {
    const existing = await prisma.match.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Partida não encontrada.' });
      return;
    }
    // Jogo encerrado é imutável — correções só via banco de dados.
    if (existing.status === 'FINISHED') {
      res.status(409).json({ error: 'Partida encerrada não pode mais ser alterada.' });
      return;
    }
    // Encerrar exige placar completo, senão os pontos nunca seriam calculados.
    if (status === 'FINISHED') {
      const finalHome = homeScore ?? existing.homeScore;
      const finalAway = awayScore ?? existing.awayScore;
      if (finalHome === null || finalHome === undefined || finalAway === null || finalAway === undefined) {
        res.status(400).json({ error: 'Informe o placar antes de encerrar a partida.' });
        return;
      }
    }

    const match = await prisma.match.update({
      where: { id },
      data: {
        ...(homeScore !== undefined && { homeScore }),
        ...(awayScore !== undefined && { awayScore }),
        ...(status !== undefined && { status }),
      },
      include: matchInclude,
    });

    // Recalculate all prediction points when match reaches FINISHED status
    if (status === 'FINISHED' && match.homeScore !== null && match.awayScore !== null) {
      const predictions = await prisma.prediction.findMany({ where: { matchId: id } });
      await Promise.all(
        predictions.map((p) =>
          prisma.prediction.update({
            where: { id: p.id },
            data: {
              points: computePoints(p.homeScore, p.awayScore, match.homeScore!, match.awayScore!),
            },
          }),
        ),
      );
    }

    console.log(
      `[gerencia] ${req.userNickname ?? req.userId} atualizou partida ${existing.externalId ?? id}: ` +
      `${match.homeScore ?? '-'}x${match.awayScore ?? '-'} (${match.status})`,
    );

    res.json(match);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar partida.' });
  }
}

/** Limpa o placar e volta o status para OPEN. Só permitido antes do início. */
export async function resetMatch(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const existing = await prisma.match.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Partida não encontrada.' });
      return;
    }
    if (existing.status === 'FINISHED') {
      res.status(409).json({ error: 'Partida encerrada não pode ser resetada.' });
      return;
    }
    if (hasKickedOff(existing.matchDate)) {
      res.status(409).json({ error: 'Partida já iniciada — só é possível resetar antes do início.' });
      return;
    }
    await prisma.match.update({
      where: { id },
      data: { homeScore: null, awayScore: null, status: 'OPEN' },
    });
    console.log(`[gerencia] ${req.userNickname ?? req.userId} resetou partida ${existing.externalId ?? id}`);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Erro ao resetar partida.' });
  }
}
