import api from './api';
import type { League } from '@/types';

interface UserLeagueResponse {
  id: string;
  userId: string;
  leagueId: string;
  joinedAt: string;
  league: {
    id: string;
    name: string;
    code: string;
    ownerId: string;
    scoreResult: number;
    scoreGoalDiff: number;
    scoreExact: number;
    createdAt: string;
    _count: { userLeagues: number };
  };
}

interface LeagueDetailResponse {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  scoreResult: number;
  scoreGoalDiff: number;
  scoreExact: number;
  createdAt: string;
  _count: { userLeagues: number };
  owner: { id: string; nickname: string };
}

function mapLeague(ul: UserLeagueResponse): League {
  return {
    id: ul.league.id,
    name: ul.league.name,
    code: ul.league.code,
    ownerId: ul.league.ownerId,
    participantCount: ul.league._count.userLeagues,
    createdAt: ul.league.createdAt,
    scoreResult: ul.league.scoreResult ?? 1,
    scoreGoalDiff: ul.league.scoreGoalDiff ?? 3,
    scoreExact: ul.league.scoreExact ?? 5,
  };
}

export async function getUserLeagues(): Promise<League[]> {
  const response = await api.get<UserLeagueResponse[]>('/api/leagues');
  return response.data.map(mapLeague);
}

export async function getLeagueById(id: string): Promise<League & { ownerNickname: string }> {
  const response = await api.get<LeagueDetailResponse>(`/api/leagues/${id}`);
  const d = response.data;
  return {
    id: d.id,
    name: d.name,
    code: d.code,
    ownerId: d.ownerId,
    participantCount: d._count.userLeagues,
    createdAt: d.createdAt,
    scoreResult: d.scoreResult ?? 1,
    scoreGoalDiff: d.scoreGoalDiff ?? 3,
    scoreExact: d.scoreExact ?? 5,
    ownerNickname: d.owner.nickname,
  };
}

export async function joinLeague(code: string): Promise<{ success: boolean; leagueName: string }> {
  const response = await api.post<{ success: boolean; league: { name: string } }>(
    '/api/leagues/join',
    { code: code.trim().toUpperCase() },
  );
  return { success: true, leagueName: response.data.league.name };
}

export async function createLeague(name: string): Promise<{ id: string; name: string; code: string }> {
  const response = await api.post<{ id: string; name: string; code: string }>(
    '/api/leagues',
    { name },
  );
  return response.data;
}

export async function updateLeagueScoring(
  leagueId: string,
  scoring: { scoreResult?: number; scoreGoalDiff?: number; scoreExact?: number },
): Promise<void> {
  await api.patch(`/api/leagues/${leagueId}/scoring`, scoring);
}
