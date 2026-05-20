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

app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

async function start(): Promise<void> {
  await seedUsers();
  await seedWorldCup();
  app.listen(PORT, () => {
    console.log(`Bolão Covil API running on port ${PORT}`);
  });
}

void start();

export default app;
