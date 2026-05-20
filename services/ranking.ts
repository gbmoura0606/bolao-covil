import type { Player } from '@/types';

const MOCK_PLAYERS: Player[] = [
  { id: 'user-003', name: 'Carlos Mendonça', points: 142, exactMatches: 8, winRate: 78, isCurrentUser: false },
  { id: 'user-007', name: 'Fernanda Lima', points: 135, exactMatches: 7, winRate: 74, isCurrentUser: false },
  { id: 'user-002', name: 'Rafael Souza', points: 128, exactMatches: 6, winRate: 70, isCurrentUser: false },
  { id: 'user-001', name: 'Admin Bolão', points: 115, exactMatches: 5, winRate: 63, isCurrentUser: true },
  { id: 'user-005', name: 'Mariana Costa', points: 108, exactMatches: 5, winRate: 59, isCurrentUser: false },
  { id: 'user-009', name: 'Bruno Alves', points: 97, exactMatches: 4, winRate: 53, isCurrentUser: false },
  { id: 'user-006', name: 'Tatiana Rocha', points: 89, exactMatches: 3, winRate: 48, isCurrentUser: false },
  { id: 'user-008', name: 'Leandro Ferreira', points: 76, exactMatches: 3, winRate: 41, isCurrentUser: false },
  { id: 'user-010', name: 'Juliana Martins', points: 64, exactMatches: 2, winRate: 35, isCurrentUser: false },
  { id: 'user-004', name: 'Diego Nascimento', points: 51, exactMatches: 1, winRate: 28, isCurrentUser: false },
];

export async function getRanking(): Promise<Player[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return MOCK_PLAYERS;
}

export async function getRankingForUser(userId: string): Promise<Player | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return MOCK_PLAYERS.find((p) => p.id === userId);
}
