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
