import { Response } from 'express';
import { PrismaClient, MatchStatus } from '@prisma/client';
import type { AuthenticatedRequest } from '../middleware/auth';
import { computePoints } from '../config/scoring';
import { buildStandings, type DbMatch } from './standingsController';

const prisma = new PrismaClient();

const matchInclude = { homeTeam: true, awayTeam: true } as const;

export async function listMatches(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const matches = await prisma.match.findMany({
      include: matchInclude,
      orderBy: { matchDate: 'asc' },
    });

    // Resolve os times do mata-mata (saem das fases anteriores) para que os
    // confrontos já definidos (ex.: Rodada de 32) apareçam nos palpites com os
    // times preenchidos, seguindo o mesmo fluxo da fase de grupos.
    const { bracket } = buildStandings(matches as unknown as DbMatch[]);
    const resolved = new Map(bracket.map((b) => [b.id, b]));
    const out = matches.map((m) => {
      if (m.group === null && (!m.homeTeam || !m.awayTeam)) {
        const r = resolved.get(m.id);
        if (r) return { ...m, homeTeam: m.homeTeam ?? r.homeTeam, awayTeam: m.awayTeam ?? r.awayTeam };
      }
      return m;
    });

    res.json(out);
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
  const { homeScore, awayScore, status, homePenalty, awayPenalty } = req.body as {
    homeScore?: number; awayScore?: number; status?: MatchStatus;
    homePenalty?: number | null; awayPenalty?: number | null;
  };

  const validScore = (v: number | undefined): boolean =>
    v === undefined || (Number.isInteger(v) && v >= 0 && v <= 99);
  const validPen = (v: number | null | undefined): boolean =>
    v === undefined || v === null || (Number.isInteger(v) && v >= 0 && v <= 99);
  if (!validScore(homeScore) || !validScore(awayScore)) {
    res.status(400).json({ error: 'Placar deve ser um inteiro entre 0 e 99.' });
    return;
  }
  if (!validPen(homePenalty) || !validPen(awayPenalty)) {
    res.status(400).json({ error: 'Pênaltis devem ser um inteiro entre 0 e 99.' });
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
      // Mata-mata empatado SÓ pode ser encerrado com os pênaltis (vencedor
      // definido) — senão o confronto fica sem vencedor e o chaveamento trava.
      const isKnockout = existing.group === null && existing.externalId !== null;
      if (isKnockout && finalHome === finalAway) {
        const finalHP = homePenalty !== undefined ? homePenalty : existing.homePenalty;
        const finalAP = awayPenalty !== undefined ? awayPenalty : existing.awayPenalty;
        if (finalHP === null || finalHP === undefined || finalAP === null || finalAP === undefined || finalHP === finalAP) {
          res.status(400).json({
            error: 'Empate no mata-mata: informe os pênaltis (com vencedor) antes de encerrar. Use a tela Tabelas › Mata-Mata.',
          });
          return;
        }
      }
    }

    const match = await prisma.match.update({
      where: { id },
      data: {
        ...(homeScore !== undefined && { homeScore }),
        ...(awayScore !== undefined && { awayScore }),
        ...(status !== undefined && { status }),
        ...(homePenalty !== undefined && { homePenalty }),
        ...(awayPenalty !== undefined && { awayPenalty }),
      },
      include: matchInclude,
    });

    // Recalculate points on every score update for non-open matches (live or finished)
    if (match.status !== 'OPEN' && match.homeScore !== null && match.awayScore !== null) {
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

/**
 * Limpa o placar e volta o status para OPEN — ação administrativa de correção.
 * Permitido inclusive em partidas JÁ ENCERRADAS (ex.: empate de mata-mata
 * encerrado sem pênaltis). Zera também os pontos dos palpites da partida, já
 * que ela deixa de estar pontuada.
 */
export async function resetMatch(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const existing = await prisma.match.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Partida não encontrada.' });
      return;
    }
    await prisma.$transaction([
      prisma.prediction.updateMany({ where: { matchId: id }, data: { points: null } }),
      prisma.match.update({
        where: { id },
        data: { homeScore: null, awayScore: null, homePenalty: null, awayPenalty: null, status: 'OPEN' },
      }),
    ]);
    console.log(
      `[gerencia] ${req.userNickname ?? req.userId} RESETOU partida ${existing.externalId ?? id} ` +
      `(era ${existing.status} ${existing.homeScore ?? '-'}x${existing.awayScore ?? '-'})`,
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Erro ao resetar partida.' });
  }
}
