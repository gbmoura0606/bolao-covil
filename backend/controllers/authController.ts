import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import type { AuthenticatedRequest } from '../middleware/auth';
import { KNOCKOUT_MATCH_COUNT } from '../config/bracket';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET ?? 'bolao-covil-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

interface UserConfig {
  nickname: string;
  canAccessGerencia: boolean;
}

const INITIAL_USERS: UserConfig[] = [
  { nickname: 'Du',      canAccessGerencia: true  },
  { nickname: 'Manetta', canAccessGerencia: false },
  { nickname: 'Sunset',  canAccessGerencia: false },
  { nickname: 'Jhow',    canAccessGerencia: false },
  { nickname: 'Nathan',  canAccessGerencia: false },
  { nickname: 'Lorenzo', canAccessGerencia: false },
  { nickname: 'Rubens',  canAccessGerencia: false },
  { nickname: 'Peter',   canAccessGerencia: false },
  { nickname: 'Vini',    canAccessGerencia: false },
];
const DEFAULT_PASSWORD = '123';

function generateToken(userId: string, nickname: string): string {
  return jwt.sign({ userId, nickname }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export async function seedUsers(): Promise<void> {
  const defaultHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  for (const { nickname, canAccessGerencia } of INITIAL_USERS) {
    await prisma.user.upsert({
      where: { nickname },
      update: { canAccessGerencia },
      create: { nickname, passwordHash: defaultHash, mustChangePassword: true, canAccessGerencia },
    });
  }
  console.log(`[seed] ${INITIAL_USERS.length} users ensured.`);
}

export async function login(req: Request, res: Response): Promise<void> {
  const { nickname, password } = req.body as { nickname?: string; password?: string };

  if (!nickname || !password) {
    res.status(400).json({ error: 'Nickname e senha são obrigatórios.' });
    return;
  }

  try {
    const user = await prisma.user.findFirst({
      where: { nickname: { equals: nickname.trim(), mode: 'insensitive' } },
    });
    if (!user) {
      res.status(401).json({ error: 'Usuário não encontrado.' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Senha incorreta.' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = generateToken(user.id, user.nickname);
    res.json({
      token,
      user: {
        id: user.id,
        nickname: user.nickname,
        canAccessGerencia: user.canAccessGerencia,
        createdAt: user.createdAt,
      },
      mustChangePassword: user.mustChangePassword,
    });
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}

export async function changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { newPassword } = req.body as { newPassword?: string };

  if (!newPassword || newPassword.length < 4) {
    res.status(400).json({ error: 'Nova senha deve ter ao menos 4 caracteres.' });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.userId },
      data: { passwordHash, mustChangePassword: false },
    });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}

/** Painel da gerência: situação de senha e último login de cada usuário. */
export async function listUsersStatus(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nickname: true,
        mustChangePassword: true,
        canAccessGerencia: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { predictions: true } },
        bracketPrediction: { select: { picks: true } },
      },
      orderBy: { nickname: 'asc' },
    });
    res.json(users.map((u) => {
      const picks = (u.bracketPrediction?.picks as Record<string, string | null> | undefined) ?? {};
      const bracketDone = Object.values(picks).filter(Boolean).length;
      return {
        id: u.id,
        nickname: u.nickname,
        passwordChanged: !u.mustChangePassword,
        canAccessGerencia: u.canAccessGerencia,
        lastLoginAt: u.lastLoginAt,
        predictionCount: u._count.predictions,
        bracketDone,
        bracketComplete: bracketDone >= KNOCKOUT_MATCH_COUNT,
        createdAt: u.createdAt,
      };
    }));
  } catch {
    res.status(500).json({ error: 'Erro ao listar usuários.' });
  }
}

/**
 * Reset administrativo: volta a senha do usuário para a padrão ('123')
 * e força a troca no próximo login.
 */
export async function resetUserPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
    await prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: true },
    });
    console.log(`[admin] senha de "${target.nickname}" resetada por ${req.userNickname}`);
    res.json({ success: true, nickname: target.nickname });
  } catch {
    res.status(500).json({ error: 'Erro ao resetar senha.' });
  }
}

export async function createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { nickname } = req.body as { nickname?: string };

  if (!nickname || nickname.trim().length < 2) {
    res.status(400).json({ error: 'Nickname deve ter pelo menos 2 caracteres.' });
    return;
  }

  const clean = nickname.trim();
  if (!/^[A-Za-zÀ-ÿ0-9_-]+$/.test(clean)) {
    res.status(400).json({ error: 'Nickname só pode conter letras, números, _ e -.' });
    return;
  }

  try {
    const existing = await prisma.user.findFirst({
      where: { nickname: { equals: clean, mode: 'insensitive' } },
    });
    if (existing) {
      res.status(409).json({ error: `Já existe um usuário com o nickname "${clean}".` });
      return;
    }

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
    const user = await prisma.user.create({
      data: { nickname: clean, passwordHash, mustChangePassword: true, canAccessGerencia: false },
    });

    // Auto-enroll in the default "Covil da Liga"
    const covilLeague = await prisma.league.findUnique({ where: { code: 'COVILCVL' } });
    if (covilLeague) {
      await prisma.userLeague.create({ data: { userId: user.id, leagueId: covilLeague.id } });
    }

    console.log(`[admin] ${req.userNickname} criou usuário "${clean}"`);
    res.status(201).json({ id: user.id, nickname: user.nickname });
  } catch {
    res.status(500).json({ error: 'Erro ao criar usuário.' });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }
    res.json({
      id: user.id,
      nickname: user.nickname,
      canAccessGerencia: user.canAccessGerencia,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt,
    });
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}
