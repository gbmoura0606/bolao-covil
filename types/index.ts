export type MatchStatus = 'OPEN' | 'CLOSED' | 'FINISHED';

export interface User {
  id: string;
  nickname: string;
  canAccessGerencia: boolean;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  flagEmoji: string;
  country: string;
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  matchDate: string;
  matchTime: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  round: string;
  group?: string;
}

export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  points?: number;
  createdAt: string;
}

export interface Player {
  id: string;
  name: string;
  points: number;
  exactMatches: number;
  winRate: number;
  isCurrentUser?: boolean;
}

export interface League {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  participantCount: number;
  userPosition?: number;
  userPoints?: number;
  firstPlacePoints?: number;
  firstPlaceName?: string;
  emoji?: string;
  createdAt: string;
}

export interface UserLeague {
  id: string;
  userId: string;
  leagueId: string;
  joinedAt: string;
  league: League;
}

export interface LoginCredentials {
  nickname: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  canAccessGerencia: boolean;
}

export interface UserAuthData {
  passwordHash: string;
  salt: string;
  mustChangePassword: boolean;
}

export interface PredictionState {
  [matchId: string]: {
    homeScore: string;
    awayScore: string;
    submitted: boolean;
  };
}
