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
    createdAt: string;
    _count: { userLeagues: number };
  };
}

function mapLeague(ul: UserLeagueResponse): League {
  return {
    id: ul.league.id,
    name: ul.league.name,
    code: ul.league.code,
    ownerId: ul.league.ownerId,
    participantCount: ul.league._count.userLeagues,
    createdAt: ul.league.createdAt,
  };
}

export async function getUserLeagues(): Promise<League[]> {
  const response = await api.get<UserLeagueResponse[]>('/api/leagues');
  return response.data.map(mapLeague);
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
