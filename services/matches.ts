import type { Match } from '@/types';

const MOCK_MATCHES: Match[] = [
  {
    id: 'match-001',
    homeTeam: { id: 'team-bra', name: 'Brasil', flagEmoji: '🇧🇷', country: 'Brasil' },
    awayTeam: { id: 'team-arg', name: 'Argentina', flagEmoji: '🇦🇷', country: 'Argentina' },
    matchDate: '2026-06-15',
    matchTime: '21:00',
    status: 'OPEN',
    round: 'Fase de Grupos',
    group: 'Grupo C',
  },
  {
    id: 'match-002',
    homeTeam: { id: 'team-fra', name: 'França', flagEmoji: '🇫🇷', country: 'França' },
    awayTeam: { id: 'team-esp', name: 'Espanha', flagEmoji: '🇪🇸', country: 'Espanha' },
    matchDate: '2026-06-16',
    matchTime: '18:00',
    status: 'OPEN',
    round: 'Fase de Grupos',
    group: 'Grupo A',
  },
  {
    id: 'match-003',
    homeTeam: { id: 'team-ale', name: 'Alemanha', flagEmoji: '🇩🇪', country: 'Alemanha' },
    awayTeam: { id: 'team-ing', name: 'Inglaterra', flagEmoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', country: 'Inglaterra' },
    matchDate: '2026-06-17',
    matchTime: '15:00',
    status: 'OPEN',
    round: 'Fase de Grupos',
    group: 'Grupo B',
  },
  {
    id: 'match-004',
    homeTeam: { id: 'team-por', name: 'Portugal', flagEmoji: '🇵🇹', country: 'Portugal' },
    awayTeam: { id: 'team-uru', name: 'Uruguai', flagEmoji: '🇺🇾', country: 'Uruguai' },
    matchDate: '2026-06-18',
    matchTime: '21:00',
    status: 'OPEN',
    round: 'Fase de Grupos',
    group: 'Grupo D',
  },
  {
    id: 'match-005',
    homeTeam: { id: 'team-ned', name: 'Holanda', flagEmoji: '🇳🇱', country: 'Holanda' },
    awayTeam: { id: 'team-bel', name: 'Bélgica', flagEmoji: '🇧🇪', country: 'Bélgica' },
    matchDate: '2026-06-10',
    matchTime: '17:00',
    status: 'FINISHED',
    homeScore: 2,
    awayScore: 1,
    round: 'Fase de Grupos',
    group: 'Grupo E',
  },
  {
    id: 'match-006',
    homeTeam: { id: 'team-ita', name: 'Itália', flagEmoji: '🇮🇹', country: 'Itália' },
    awayTeam: { id: 'team-cro', name: 'Croácia', flagEmoji: '🇭🇷', country: 'Croácia' },
    matchDate: '2026-06-11',
    matchTime: '14:00',
    status: 'FINISHED',
    homeScore: 1,
    awayScore: 1,
    round: 'Fase de Grupos',
    group: 'Grupo F',
  },
  {
    id: 'match-007',
    homeTeam: { id: 'team-mex', name: 'México', flagEmoji: '🇲🇽', country: 'México' },
    awayTeam: { id: 'team-col', name: 'Colômbia', flagEmoji: '🇨🇴', country: 'Colômbia' },
    matchDate: '2026-06-12',
    matchTime: '20:00',
    status: 'CLOSED',
    round: 'Fase de Grupos',
    group: 'Grupo G',
  },
  {
    id: 'match-008',
    homeTeam: { id: 'team-sen', name: 'Senegal', flagEmoji: '🇸🇳', country: 'Senegal' },
    awayTeam: { id: 'team-mar', name: 'Marrocos', flagEmoji: '🇲🇦', country: 'Marrocos' },
    matchDate: '2026-06-13',
    matchTime: '16:00',
    status: 'CLOSED',
    round: 'Fase de Grupos',
    group: 'Grupo H',
  },
];

export async function getMatches(): Promise<Match[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return MOCK_MATCHES;
}

export async function getMatchById(id: string): Promise<Match | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return MOCK_MATCHES.find((m) => m.id === id);
}
