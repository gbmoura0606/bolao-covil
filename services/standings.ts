import api from './api';

export interface TeamInfo { id: string; name: string; flagEmoji: string; country: string; }

export interface StandingRow {
  team: TeamInfo;
  groupId: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  lastResults: string[];
}

export interface GroupMatch {
  id: string;
  externalId: string | null;
  round: string;
  homeTeam: TeamInfo | null;
  awayTeam: TeamInfo | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  matchDate: string;
  venue: string | null;
}

export interface ApiGroup {
  id: string;
  name: string;
  teams: TeamInfo[];
  standings: StandingRow[];
  matches: GroupMatch[];
}

export interface BracketMatch {
  id: string;
  externalId: string | null;
  matchNumber: number | null;
  round: string;
  homeSlot: string | null;
  awaySlot: string | null;
  homeTeam: TeamInfo | null;
  awayTeam: TeamInfo | null;
  homeScore: number | null;
  awayScore: number | null;
  matchDate: string;
  venue: string | null;
}

export interface StandingsData {
  groups: ApiGroup[];
  thirds: StandingRow[];
  overall: StandingRow[];
  bracket: BracketMatch[];
}

export async function getStandingsData(): Promise<StandingsData> {
  const response = await api.get<StandingsData>('/api/standings');
  return response.data;
}
