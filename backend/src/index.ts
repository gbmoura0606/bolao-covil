import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from '../routes/auth';
import { seedUsers } from '../controllers/authController';
import { seedWorldCup } from '../seed/worldcup';
import matchRoutes from '../routes/matches';
import predictionRoutes from '../routes/predictions';
import rankingRoutes from '../routes/ranking';
import leagueRoutes from '../routes/leagues';
import standingsRoutes from '../routes/standings';
import bracketPredictionRoutes from '../routes/bracketPredictions';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3001;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : true;

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/leagues', leagueRoutes);
app.use('/api/standings', standingsRoutes);
app.use('/api/bracket-prediction', bracketPredictionRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

async function runMigrations(): Promise<void> {
  const { PrismaClient } = await import('@prisma/client');
  const p = new PrismaClient();
  try {
    await p.$executeRaw`ALTER TABLE "League" ADD COLUMN IF NOT EXISTS "scoreResult" INTEGER NOT NULL DEFAULT 1`;
    await p.$executeRaw`ALTER TABLE "League" ADD COLUMN IF NOT EXISTS "scoreGoalDiff" INTEGER NOT NULL DEFAULT 3`;
    await p.$executeRaw`ALTER TABLE "League" ADD COLUMN IF NOT EXISTS "scoreExact" INTEGER NOT NULL DEFAULT 5`;
    await p.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3)`;
  } finally {
    await p.$disconnect();
  }
}

/**
 * Recalcula os pontos de todos os palpites de partidas FINISHED.
 * Garante que o ranking global sempre reflita a regra atual de SCORING,
 * mesmo que ela mude entre deploys.
 */
async function recalculateFinishedPoints(): Promise<void> {
  const { PrismaClient } = await import('@prisma/client');
  const { computePoints } = await import('../config/scoring');
  const p = new PrismaClient();
  try {
    const finished = await p.match.findMany({
      where: { status: 'FINISHED', homeScore: { not: null }, awayScore: { not: null } },
      include: { predictions: true },
    });
    let updated = 0;
    for (const m of finished) {
      for (const pred of m.predictions) {
        const points = computePoints(pred.homeScore, pred.awayScore, m.homeScore!, m.awayScore!);
        if (pred.points !== points) {
          await p.prediction.update({ where: { id: pred.id }, data: { points } });
          updated++;
        }
      }
    }
    console.log(`[recalc] ${finished.length} partidas encerradas verificadas, ${updated} palpites atualizados.`);
  } finally {
    await p.$disconnect();
  }
}

const COVIL_LEAGUE_CODE = 'COVILCVL';

async function seedDefaultLeague(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const du = await prisma.user.findFirst({ where: { nickname: 'Du' } });
    if (!du) return;

    let league = await prisma.league.findUnique({ where: { code: COVIL_LEAGUE_CODE } });
    if (!league) {
      league = await prisma.league.create({
        data: { name: 'Covil da Liga', code: COVIL_LEAGUE_CODE, ownerId: du.id },
      });
      console.log('[seed] Liga "Covil da Liga" criada.');
    }

    const allUsers = await prisma.user.findMany({ select: { id: true } });
    let added = 0;
    for (const user of allUsers) {
      const entry = await prisma.userLeague.upsert({
        where: { userId_leagueId: { userId: user.id, leagueId: league.id } },
        update: {},
        create: { userId: user.id, leagueId: league.id },
      });
      if (entry) added++;
    }
    console.log(`[seed] "Covil da Liga": ${allUsers.length} usuários garantidos.`);
  } finally {
    await prisma.$disconnect();
  }
}

async function start(): Promise<void> {
  await runMigrations();
  await seedUsers();
  await seedWorldCup();
  await seedDefaultLeague();
  await recalculateFinishedPoints();
  app.listen(PORT, () => {
    console.log(`Bolão Covil API running on port ${PORT}`);
  });
}

void start();

export default app;
