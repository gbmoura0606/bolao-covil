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

// ─── Gerência do Setor ────────────────────────────────────────────────────────

export interface Resident {
  id: string;
  name: string;
  /** Multiplicador para divisão proporcional. Padrão: 1.0 */
  weight: number;
  active: boolean;
}

export type ExpenseCategory =
  | 'aluguel'
  | 'agua'
  | 'luz'
  | 'internet'
  | 'gas'
  | 'manutencao'
  | 'compra_coletiva'
  | 'extra';

export type ExpenseSplitType = 'igual' | 'proporcional';

export interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory;
  /** Valor em reais (float). Ex: 1800.00 */
  amount: number;
  /** Data do pagamento no formato YYYY-MM-DD */
  date: string;
  /** Mês de competência no formato YYYY-MM */
  competencyMonth: string;
  paidById: string;
  paidByName: string;
  splitType: ExpenseSplitType;
  createdAt: string;
  createdById: string;
}

export interface ResidentBalance {
  resident: Resident;
  /** Total que este morador efetivamente pagou no mês */
  paid: number;
  /** Total que este morador deveria pagar (cota calculada) */
  owes: number;
  /** paid − owes. Positivo = tem a receber. Negativo = ainda deve. */
  balance: number;
}

export interface Transfer {
  from: Resident;
  to: Resident;
  amount: number;
}

// ─── Lista de Compras ─────────────────────────────────────────────────────────

export type ShoppingItemStatus = 'pendente' | 'comprado' | 'cancelado';

export interface ShoppingItem {
  id: string;
  name: string;
  addedById: string;
  addedByName: string;
  status: ShoppingItemStatus;
  createdAt: string;
  updatedAt: string;
  updatedById?: string;
  updatedByName?: string;
}
