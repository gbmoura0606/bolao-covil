import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import type { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET ?? 'bolao-covil-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

interface UserConfig {
  nickname: string;
  canAccessGerencia: boolean;
}

const INITIAL_USERS: UserConfig[] = [
  { nickname: 'Du',      canAccessGerencia: true  },
  { nickname: 'Manetta', canAccessGerencia: true  },
  { nickname: 'Sunset',  canAccessGerencia: true  },
  { nickname: 'Jhow',    canAccessGerencia: true  },
  { nickname: 'Nathan',  canAccessGerencia: false },
  { nickname: 'Lorenzo', canAccessGerencia: true  },
  { nickname: 'Rubens',  canAccessGerencia: true  },
  { nickname: 'Peter',   canAccessGerencia: true  },
  { nickname: 'Vini',    canAccessGerencia: true  },
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
