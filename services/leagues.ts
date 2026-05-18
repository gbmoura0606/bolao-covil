import type { League } from '@/types';

const MOCK_LEAGUES: League[] = [
  {
    id: 'league-001',
    name: 'Covil da Miga',
    code: 'COVIL2026',
    ownerId: 'user-001',
    participantCount: 10,
    userPosition: 4,
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'league-002',
    name: 'Família Bolão',
    code: 'FAMILIA26',
    ownerId: 'user-003',
    participantCount: 6,
    userPosition: 2,
    createdAt: '2026-02-15T14:00:00Z',
  },
  {
    id: 'league-003',
    name: 'Copa do Trampo',
    code: 'TRAMPO26',
    ownerId: 'user-007',
    participantCount: 18,
    userPosition: 7,
    createdAt: '2026-03-01T09:00:00Z',
  },
];

export async function getUserLeagues(): Promise<League[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return MOCK_LEAGUES;
}

export async function joinLeague(code: string): Promise<{ success: boolean; leagueName: string }> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const existing = MOCK_LEAGUES.find((l) => l.code === code.toUpperCase());
  if (existing) {
    return { success: true, leagueName: existing.name };
  }

  if (code.length >= 4) {
    return { success: true, leagueName: `Liga ${code.toUpperCase()}` };
  }

  throw new Error('Código de liga inválido.');
}
