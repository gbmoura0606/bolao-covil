import api from './api';

export type BracketPicks = Record<string, string | null>; // matchId -> teamId | null

export interface BracketPredictionData {
  picks: BracketPicks;
}

export async function getBracketPrediction(): Promise<BracketPredictionData> {
  const response = await api.get<BracketPredictionData>('/api/bracket-prediction');
  return response.data;
}

export async function saveBracketPrediction(picks: BracketPicks): Promise<BracketPredictionData> {
  const response = await api.put<BracketPredictionData>('/api/bracket-prediction', { picks });
  return response.data;
}

export interface UserBracketPrediction {
  userId: string;
  nickname: string;
  picks: BracketPicks;
}

/**
 * Previsões de todos os participantes. Só disponível após a trava (28/06 16h);
 * antes disso o backend responde 403.
 */
export async function getAllBracketPredictions(): Promise<UserBracketPrediction[]> {
  const response = await api.get<{ predictions: UserBracketPrediction[] }>('/api/bracket-prediction/all');
  return response.data.predictions;
}

export interface BracketRankingEntry {
  userId: string;
  nickname: string;
  points: number;
  done: number;
}

/** Ranking específico da Previsão (pontos por fase conforme os resultados). */
export async function getBracketRanking(): Promise<BracketRankingEntry[]> {
  const response = await api.get<{ ranking: BracketRankingEntry[] }>('/api/bracket-prediction/ranking');
  return response.data.ranking;
}

export interface BracketAdminStatus {
  userId: string;
  nickname: string;
  done: number;
  total: number;
  complete: boolean;
  updatedAt: string | null;
}

/** Situação de preenchimento da Previsão por usuário (gerência). */
export async function getBracketAdminStatus(): Promise<BracketAdminStatus[]> {
  const response = await api.get<{ users: BracketAdminStatus[] }>('/api/bracket-prediction/admin/status');
  return response.data.users;
}
