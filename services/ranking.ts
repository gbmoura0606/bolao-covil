import api from './api';
import type { Player } from '@/types';

interface RankingEntry {
  id: string;
  nickname: string;
  points: number;
  exactMatches: number;
  totalPredictions: number;
  winRate: number;
  bracketPoints?: number;
}

export async function getRanking(): Promise<Player[]> {
  const response = await api.get<RankingEntry[]>('/api/ranking');
  return response.data.map((r) => ({
    id: r.id,
    name: r.nickname,
    points: r.points,
    exactMatches: r.exactMatches,
    winRate: r.winRate,
  }));
}

export async function getRankingForUser(userId: string): Promise<Player | undefined> {
  const all = await getRanking();
  return all.find((p) => p.id === userId);
}

export async function getLeagueRanking(leagueId: string): Promise<Player[]> {
  const response = await api.get<RankingEntry[]>(`/api/ranking/league/${leagueId}`);
  return response.data.map((r) => ({
    id: r.id,
    name: r.nickname,
    points: r.points,
    exactMatches: r.exactMatches,
    winRate: r.winRate,
    bracketPoints: r.bracketPoints ?? 0,
  }));
}
