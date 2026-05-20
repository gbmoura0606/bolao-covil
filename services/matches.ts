import api from './api';
import type { Match } from '@/types';

interface DbMatch {
  id: string;
  externalId: string | null;
  round: string;
  group: string | null;
  homeTeam: { id: string; name: string; flagEmoji: string; country: string } | null;
  awayTeam: { id: string; name: string; flagEmoji: string; country: string } | null;
  homeScore: number | null;
  awayScore: number | null;
  matchDate: string;
  status: string;
  venue: string | null;
}

function mapMatch(m: DbMatch): Match {
  return {
    id: m.id,
    homeTeam: m.homeTeam ?? { id: '', name: '?', flagEmoji: '', country: '' },
    awayTeam: m.awayTeam ?? { id: '', name: '?', flagEmoji: '', country: '' },
    matchDate: m.matchDate.substring(0, 10),
    matchTime: m.matchDate.substring(11, 16),
    status: m.status as Match['status'],
    homeScore: m.homeScore ?? undefined,
    awayScore: m.awayScore ?? undefined,
    round: m.round,
    group: m.group ?? undefined,
  };
}

export async function getMatches(): Promise<Match[]> {
  const response = await api.get<DbMatch[]>('/api/matches');
  return response.data
    .filter((m) => m.homeTeam !== null && m.awayTeam !== null)
    .map(mapMatch);
}

export async function getMatchById(id: string): Promise<Match | undefined> {
  try {
    const response = await api.get<DbMatch>(`/api/matches/${id}`);
    return mapMatch(response.data);
  } catch {
    return undefined;
  }
}
