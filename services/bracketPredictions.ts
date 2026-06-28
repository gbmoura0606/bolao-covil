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
