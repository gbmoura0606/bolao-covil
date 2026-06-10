import api from './api';
import type { Prediction } from '@/types';

export async function getUserPredictions(): Promise<Prediction[]> {
  const response = await api.get<Prediction[]>('/api/predictions');
  return response.data;
}

export async function upsertPrediction(
  matchId: string,
  homeScore: number,
  awayScore: number,
): Promise<Prediction> {
  const response = await api.put<Prediction>(`/api/predictions/match/${matchId}`, {
    homeScore,
    awayScore,
  });
  return response.data;
}

export interface GroupPrediction {
  userId: string;
  nickname: string;
  homeScore: number;
  awayScore: number;
  points: number | null;
}

export async function getMatchPredictions(matchId: string): Promise<GroupPrediction[]> {
  const response = await api.get<GroupPrediction[]>(`/api/predictions/match/${matchId}`);
  return response.data;
}
