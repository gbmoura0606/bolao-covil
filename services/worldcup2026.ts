// ─── FONTE DE VERDADE ─────────────────────────────────────────────────────────
//
// Este arquivo contém APENAS dados brutos: times, grupos e resultados de partidas.
// NENHUM dado derivado (pontuação, classificação, saldo) é armazenado aqui.
//
// Como atualizar:
//   • Ao apitar uma partida, edite homeScore/awayScore no objeto WCMatch correspondente.
//   • Todos os cálculos (standings, classificação de terceiros, bracket) são feitos
//     automaticamente por services/computed.ts — não há mais nada a fazer.
//
// Quem atualiza: qualquer dev ou administrador com acesso ao repositório.
// Futuramente: um endpoint de admin que grava os scores e revalida tudo.
// ──────────────────────────────────────────────────────────────────────────────

export interface WCTeam {
  id: string;
  name: string;
  flag: string;
  confederation: string;
}

export type MatchResult = 'HOME' | 'AWAY' | 'DRAW' | null;

export interface WCMatch {
  id: string;
  round: 1 | 2 | 3;
  home: WCTeam;
  away: WCTeam;
  date: string;
  time: string;
  venue: string;
  city: string;
  homeScore: number | null;
  awayScore: number | null;
}

export interface WCGroup {
  id: string;
  name: string;
  teams: WCTeam[];      // ordem original do sorteio
  matches: WCMatch[];   // todos os jogos da fase de grupos
}

export type KnockoutRound = 'r32' | 'r16' | 'qf' | 'sf' | 'final' | 'terceiro';

export interface KnockoutMatch {
  id: string;
  round: KnockoutRound;
  matchNumber: number;
  homeSlot: string;
  awaySlot: string;
  date?: string;
  venue?: string;
  city?: string;
  homeScore: number | null;
  awayScore: number | null;
}

export interface ClassificationCriteria {
  order: number;
  title: string;
  description: string;
}

// ─── Registro de times ────────────────────────────────────────────────────────

const T = (id: string, name: string, flag: string, confederation: string): WCTeam => ({
  id, name, flag, confederation,
});

const USA = T('usa', 'Estados Unidos', '🇺🇸', 'CONCACAF');
const MEX = T('mex', 'México', '🇲🇽', 'CONCACAF');
const CAN = T('can', 'Canadá', '🇨🇦', 'CONCACAF');
const ARG = T('arg', 'Argentina', '🇦🇷', 'CONMEBOL');
const BRA = T('bra', 'Brasil', '🇧🇷', 'CONMEBOL');
const FRA = T('fra', 'França', '🇫🇷', 'UEFA');
const ENG = T('eng', 'Inglaterra', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'UEFA');
const ESP = T('esp', 'Espanha', '🇪🇸', 'UEFA');
const POR = T('por', 'Portugal', '🇵🇹', 'UEFA');
const GER = T('ger', 'Alemanha', '🇩🇪', 'UEFA');
const NED = T('ned', 'Holanda', '🇳🇱', 'UEFA');
const BEL = T('bel', 'Bélgica', '🇧🇪', 'UEFA');
const URU = T('uru', 'Uruguai', '🇺🇾', 'CONMEBOL');
const COL = T('col', 'Colômbia', '🇨🇴', 'CONMEBOL');
const ECU = T('ecu', 'Equador', '🇪🇨', 'CONMEBOL');
const VEN = T('ven', 'Venezuela', '🇻🇪', 'CONMEBOL');
const ITA = T('ita', 'Itália', '🇮🇹', 'UEFA');
const CRO = T('cro', 'Croácia', '🇭🇷', 'UEFA');
const SUI = T('sui', 'Suíça', '🇨🇭', 'UEFA');
const DEN = T('den', 'Dinamarca', '🇩🇰', 'UEFA');
const SRB = T('srb', 'Sérvia', '🇷🇸', 'UEFA');
const AUT = T('aut', 'Áustria', '🇦🇹', 'UEFA');
const SCO = T('sco', 'Escócia', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'UEFA');
const TUR = T('tur', 'Turquia', '🇹🇷', 'UEFA');
const ALB = T('alb', 'Albânia', '🇦🇱', 'UEFA');
const PAN = T('pan', 'Panamá', '🇵🇦', 'CONCACAF');
const HON = T('hon', 'Honduras', '🇭🇳', 'CONCACAF');
const CRC = T('crc', 'Costa Rica', '🇨🇷', 'CONCACAF');
const MAR = T('mar', 'Marrocos', '🇲🇦', 'CAF');
const SEN = T('sen', 'Senegal', '🇸🇳', 'CAF');
const EGY = T('egy', 'Egito', '🇪🇬', 'CAF');
const NGA = T('nga', 'Nigéria', '🇳🇬', 'CAF');
const CMR = T('cmr', 'Camarões', '🇨🇲', 'CAF');
const CIV = T('civ', 'Costa do Marfim', '🇨🇮', 'CAF');
const COD = T('cod', 'Rep. D. Congo', '🇨🇩', 'CAF');
const RSA = T('rsa', 'África do Sul', '🇿🇦', 'CAF');
const TUN = T('tun', 'Tunísia', '🇹🇳', 'CAF');
const JPN = T('jpn', 'Japão', '🇯🇵', 'AFC');
const KOR = T('kor', 'Coreia do Sul', '🇰🇷', 'AFC');
const KSA = T('ksa', 'Arábia Saudita', '🇸🇦', 'AFC');
const IRN = T('irn', 'Irã', '🇮🇷', 'AFC');
const AUS = T('aus', 'Austrália', '🇦🇺', 'AFC');
const JOR = T('jor', 'Jordânia', '🇯🇴', 'AFC');
const IRQ = T('irq', 'Iraque', '🇮🇶', 'AFC');
const UZB = T('uzb', 'Uzbequistão', '🇺🇿', 'AFC');
const NZL = T('nzl', 'Nova Zelândia', '🇳🇿', 'OFC');
const IDN = T('idn', 'Indonésia', '🇮🇩', 'AFC');
const PAR = T('par', 'Paraguai', '🇵🇾', 'CONMEBOL');

// ─── Helper de partida ────────────────────────────────────────────────────────

let _mc = 0;
function wm(
  gid: string, round: 1 | 2 | 3,
  home: WCTeam, away: WCTeam,
  date: string, time: string, venue: string, city: string,
): WCMatch {
  _mc++;
  return {
    id: `${gid}-r${round}-${_mc}`, round, home, away,
    date, time, venue, city,
    homeScore: null, awayScore: null,
  };
}

function km(
  id: string, round: KnockoutRound, num: number,
  homeSlot: string, awaySlot: string,
  date?: string, venue?: string, city?: string,
): KnockoutMatch {
  return { id, round, matchNumber: num, homeSlot, awaySlot, date, venue, city, homeScore: null, awayScore: null };
}

// ─── Grupos (fonte de verdade dos grupos) ─────────────────────────────────────

export const GROUPS: WCGroup[] = [
  {
    id: 'A', name: 'Grupo A',
    teams: [USA, URU, EGY, JPN],
    matches: [
      wm('A', 1, USA, URU, '2026-06-12', '18:00', 'MetLife Stadium', 'East Rutherford, NJ'),
      wm('A', 1, EGY, JPN, '2026-06-12', '21:00', 'Levi\'s Stadium', 'Santa Clara, CA'),
      wm('A', 2, USA, EGY, '2026-06-17', '15:00', 'MetLife Stadium', 'East Rutherford, NJ'),
      wm('A', 2, JPN, URU, '2026-06-17', '21:00', 'Hard Rock Stadium', 'Miami, FL'),
      wm('A', 3, JPN, USA, '2026-06-22', '21:00', 'Gillette Stadium', 'Foxborough, MA'),
      wm('A', 3, URU, EGY, '2026-06-22', '21:00', 'AT&T Stadium', 'Arlington, TX'),
    ],
  },
  {
    id: 'B', name: 'Grupo B',
    teams: [MEX, COL, MAR, KOR],
    matches: [
      wm('B', 1, MEX, COL, '2026-06-13', '18:00', 'Estadio Azteca', 'Cidade do México, MEX'),
      wm('B', 1, MAR, KOR, '2026-06-13', '15:00', 'SoFi Stadium', 'Los Angeles, CA'),
      wm('B', 2, MEX, MAR, '2026-06-18', '21:00', 'Estadio Azteca', 'Cidade do México, MEX'),
      wm('B', 2, KOR, COL, '2026-06-18', '18:00', 'Levi\'s Stadium', 'Santa Clara, CA'),
      wm('B', 3, KOR, MEX, '2026-06-23', '21:00', 'AT&T Stadium', 'Arlington, TX'),
      wm('B', 3, COL, MAR, '2026-06-23', '21:00', 'Hard Rock Stadium', 'Miami, FL'),
    ],
  },
  {
    id: 'C', name: 'Grupo C',
    teams: [CAN, ECU, SEN, AUS],
    matches: [
      wm('C', 1, CAN, ECU, '2026-06-13', '21:00', 'BC Place', 'Vancouver, CAN'),
      wm('C', 1, SEN, AUS, '2026-06-13', '18:00', 'Lincoln Financial', 'Filadélfia, PA'),
      wm('C', 2, CAN, SEN, '2026-06-18', '15:00', 'BC Place', 'Vancouver, CAN'),
      wm('C', 2, AUS, ECU, '2026-06-18', '12:00', 'Arrowhead Stadium', 'Kansas City, MO'),
      wm('C', 3, AUS, CAN, '2026-06-23', '18:00', 'BMO Field', 'Toronto, CAN'),
      wm('C', 3, ECU, SEN, '2026-06-23', '18:00', 'Camping World', 'Orlando, FL'),
    ],
  },
  {
    id: 'D', name: 'Grupo D',
    teams: [ARG, CRC, NGA, KSA],
    matches: [
      wm('D', 1, ARG, CRC, '2026-06-14', '21:00', 'MetLife Stadium', 'East Rutherford, NJ'),
      wm('D', 1, NGA, KSA, '2026-06-14', '18:00', 'SoFi Stadium', 'Los Angeles, CA'),
      wm('D', 2, ARG, NGA, '2026-06-19', '21:00', 'Gillette Stadium', 'Foxborough, MA'),
      wm('D', 2, KSA, CRC, '2026-06-19', '15:00', 'Camping World', 'Orlando, FL'),
      wm('D', 3, KSA, ARG, '2026-06-25', '22:00', 'Hard Rock Stadium', 'Miami, FL'),
      wm('D', 3, CRC, NGA, '2026-06-25', '22:00', 'Lincoln Financial', 'Filadélfia, PA'),
    ],
  },
  {
    id: 'E', name: 'Grupo E',
    teams: [BRA, PAN, CMR, IRN],
    matches: [
      wm('E', 1, BRA, PAN, '2026-06-14', '15:00', 'AT&T Stadium', 'Arlington, TX'),
      wm('E', 1, CMR, IRN, '2026-06-14', '12:00', 'Arrowhead Stadium', 'Kansas City, MO'),
      wm('E', 2, BRA, CMR, '2026-06-19', '18:00', 'Levi\'s Stadium', 'Santa Clara, CA'),
      wm('E', 2, IRN, PAN, '2026-06-19', '12:00', 'SoFi Stadium', 'Los Angeles, CA'),
      wm('E', 3, IRN, BRA, '2026-06-25', '18:00', 'MetLife Stadium', 'East Rutherford, NJ'),
      wm('E', 3, PAN, CMR, '2026-06-25', '18:00', 'Estadio Akron', 'Guadalajara, MEX'),
    ],
  },
  {
    id: 'F', name: 'Grupo F',
    teams: [FRA, VEN, CIV, JOR],
    matches: [
      wm('F', 1, FRA, VEN, '2026-06-15', '21:00', 'MetLife Stadium', 'East Rutherford, NJ'),
      wm('F', 1, CIV, JOR, '2026-06-15', '15:00', 'Camping World', 'Orlando, FL'),
      wm('F', 2, FRA, CIV, '2026-06-20', '21:00', 'AT&T Stadium', 'Arlington, TX'),
      wm('F', 2, JOR, VEN, '2026-06-20', '15:00', 'Hard Rock Stadium', 'Miami, FL'),
      wm('F', 3, JOR, FRA, '2026-06-26', '22:00', 'Gillette Stadium', 'Foxborough, MA'),
      wm('F', 3, VEN, CIV, '2026-06-26', '22:00', 'Lincoln Financial', 'Filadélfia, PA'),
    ],
  },
  {
    id: 'G', name: 'Grupo G',
    teams: [ENG, HON, RSA, IRQ],
    matches: [
      wm('G', 1, ENG, HON, '2026-06-15', '18:00', 'Hard Rock Stadium', 'Miami, FL'),
      wm('G', 1, RSA, IRQ, '2026-06-15', '12:00', 'Arrowhead Stadium', 'Kansas City, MO'),
      wm('G', 2, ENG, RSA, '2026-06-20', '18:00', 'MetLife Stadium', 'East Rutherford, NJ'),
      wm('G', 2, IRQ, HON, '2026-06-20', '12:00', 'Camping World', 'Orlando, FL'),
      wm('G', 3, IRQ, ENG, '2026-06-26', '18:00', 'SoFi Stadium', 'Los Angeles, CA'),
      wm('G', 3, HON, RSA, '2026-06-26', '18:00', 'Estadio BBVA', 'Monterrey, MEX'),
    ],
  },
  {
    id: 'H', name: 'Grupo H',
    teams: [ESP, CRO, COD, UZB],
    matches: [
      wm('H', 1, ESP, CRO, '2026-06-16', '21:00', 'SoFi Stadium', 'Los Angeles, CA'),
      wm('H', 1, COD, UZB, '2026-06-16', '15:00', 'Lincoln Financial', 'Filadélfia, PA'),
      wm('H', 2, ESP, COD, '2026-06-21', '21:00', 'AT&T Stadium', 'Arlington, TX'),
      wm('H', 2, UZB, CRO, '2026-06-21', '15:00', 'Camping World', 'Orlando, FL'),
      wm('H', 3, UZB, ESP, '2026-06-27', '22:00', 'Arrowhead Stadium', 'Kansas City, MO'),
      wm('H', 3, CRO, COD, '2026-06-27', '22:00', 'Gillette Stadium', 'Foxborough, MA'),
    ],
  },
  {
    id: 'I', name: 'Grupo I',
    teams: [POR, ITA, TUN, IDN],
    matches: [
      wm('I', 1, POR, ITA, '2026-06-16', '18:00', 'Levi\'s Stadium', 'Santa Clara, CA'),
      wm('I', 1, TUN, IDN, '2026-06-16', '12:00', 'BC Place', 'Vancouver, CAN'),
      wm('I', 2, POR, TUN, '2026-06-21', '18:00', 'Hard Rock Stadium', 'Miami, FL'),
      wm('I', 2, IDN, ITA, '2026-06-21', '12:00', 'Estadio Azteca', 'Cidade do México, MEX'),
      wm('I', 3, IDN, POR, '2026-06-28', '22:00', 'Lincoln Financial', 'Filadélfia, PA'),
      wm('I', 3, ITA, TUN, '2026-06-28', '22:00', 'MetLife Stadium', 'East Rutherford, NJ'),
    ],
  },
  {
    id: 'J', name: 'Grupo J',
    teams: [GER, SUI, NZL, SRB],
    matches: [
      wm('J', 1, GER, SUI, '2026-06-17', '21:00', 'AT&T Stadium', 'Arlington, TX'),
      wm('J', 1, NZL, SRB, '2026-06-17', '15:00', 'Hard Rock Stadium', 'Miami, FL'),
      wm('J', 2, GER, NZL, '2026-06-22', '18:00', 'SoFi Stadium', 'Los Angeles, CA'),
      wm('J', 2, SRB, SUI, '2026-06-22', '15:00', 'Estadio Akron', 'Guadalajara, MEX'),
      wm('J', 3, SRB, GER, '2026-06-28', '18:00', 'Camping World', 'Orlando, FL'),
      wm('J', 3, SUI, NZL, '2026-06-28', '18:00', 'Arrowhead Stadium', 'Kansas City, MO'),
    ],
  },
  {
    id: 'K', name: 'Grupo K',
    teams: [NED, DEN, TUR, SCO],
    matches: [
      wm('K', 1, NED, DEN, '2026-06-17', '18:00', 'MetLife Stadium', 'East Rutherford, NJ'),
      wm('K', 1, TUR, SCO, '2026-06-17', '12:00', 'Gillette Stadium', 'Foxborough, MA'),
      wm('K', 2, NED, TUR, '2026-06-23', '21:00', 'Levi\'s Stadium', 'Santa Clara, CA'),
      wm('K', 2, SCO, DEN, '2026-06-23', '15:00', 'Estadio BBVA', 'Monterrey, MEX'),
      wm('K', 3, SCO, NED, '2026-06-29', '22:00', 'SoFi Stadium', 'Los Angeles, CA'),
      wm('K', 3, DEN, TUR, '2026-06-29', '22:00', 'BC Place', 'Vancouver, CAN'),
    ],
  },
  {
    id: 'L', name: 'Grupo L',
    teams: [BEL, ALB, AUT, PAR],
    matches: [
      wm('L', 1, BEL, ALB, '2026-06-18', '21:00', 'AT&T Stadium', 'Arlington, TX'),
      wm('L', 1, AUT, PAR, '2026-06-18', '18:00', 'Gillette Stadium', 'Foxborough, MA'),
      wm('L', 2, BEL, AUT, '2026-06-24', '21:00', 'Hard Rock Stadium', 'Miami, FL'),
      wm('L', 2, PAR, ALB, '2026-06-24', '15:00', 'Camping World', 'Orlando, FL'),
      wm('L', 3, PAR, BEL, '2026-06-30', '22:00', 'MetLife Stadium', 'East Rutherford, NJ'),
      wm('L', 3, ALB, AUT, '2026-06-30', '22:00', 'Levi\'s Stadium', 'Santa Clara, CA'),
    ],
  },
];

// ─── Bracket do mata-mata ─────────────────────────────────────────────────────
// Slots são strings que computed.ts resolve em times reais via computeKnockoutBracket().
// Formato dos slots:
//   "1º Grupo A"   → 1º colocado do Grupo A (calculado de GROUPS)
//   "Vencedor M49" → vencedor da partida número 49
//   "Perdedor M77" → perdedor da partida número 77 (para 3º lugar)
//   "3º melhor (n)"→ n-ésimo melhor 3º colocado (computed.ts resolve a ordem)

export const KNOCKOUT_MATCHES: KnockoutMatch[] = [
  km('m49',  'r32', 49, '1º Grupo A', '2º Grupo B',    '2026-07-04', 'MetLife Stadium',    'East Rutherford, NJ'),
  km('m50',  'r32', 50, '1º Grupo C', '2º Grupo D',    '2026-07-04', 'AT&T Stadium',       'Arlington, TX'),
  km('m51',  'r32', 51, '1º Grupo E', '2º Grupo F',    '2026-07-05', 'SoFi Stadium',       'Los Angeles, CA'),
  km('m52',  'r32', 52, '1º Grupo G', '2º Grupo H',    '2026-07-05', 'Hard Rock Stadium',  'Miami, FL'),
  km('m53',  'r32', 53, '1º Grupo I', '2º Grupo J',    '2026-07-06', 'Levi\'s Stadium',     'Santa Clara, CA'),
  km('m54',  'r32', 54, '1º Grupo K', '2º Grupo L',    '2026-07-06', 'Gillette Stadium',   'Foxborough, MA'),
  km('m55',  'r32', 55, '1º Grupo B', '3º melhor (1)', '2026-07-07', 'Arrowhead Stadium',  'Kansas City, MO'),
  km('m56',  'r32', 56, '1º Grupo D', '3º melhor (2)', '2026-07-07', 'Camping World',      'Orlando, FL'),
  km('m57',  'r32', 57, '1º Grupo F', '3º melhor (3)', '2026-07-08', 'Lincoln Financial',  'Filadélfia, PA'),
  km('m58',  'r32', 58, '1º Grupo H', '3º melhor (4)', '2026-07-08', 'BC Place',           'Vancouver, CAN'),
  km('m59',  'r32', 59, '1º Grupo J', '3º melhor (5)', '2026-07-09', 'Estadio Azteca',     'Cidade do México'),
  km('m60',  'r32', 60, '1º Grupo L', '3º melhor (6)', '2026-07-09', 'Estadio Akron',      'Guadalajara, MEX'),
  km('m61',  'r32', 61, '2º Grupo A', '3º melhor (7)', '2026-07-10', 'AT&T Stadium',       'Arlington, TX'),
  km('m62',  'r32', 62, '2º Grupo C', '3º melhor (8)', '2026-07-10', 'MetLife Stadium',    'East Rutherford, NJ'),
  km('m63',  'r32', 63, '2º Grupo E', '2º Grupo G',    '2026-07-11', 'SoFi Stadium',       'Los Angeles, CA'),
  km('m64',  'r32', 64, '2º Grupo I', '2º Grupo K',    '2026-07-11', 'Hard Rock Stadium',  'Miami, FL'),

  km('m65', 'r16', 65, 'Vencedor M49', 'Vencedor M50', '2026-07-14', 'MetLife Stadium',   'East Rutherford, NJ'),
  km('m66', 'r16', 66, 'Vencedor M51', 'Vencedor M52', '2026-07-14', 'AT&T Stadium',      'Arlington, TX'),
  km('m67', 'r16', 67, 'Vencedor M53', 'Vencedor M54', '2026-07-15', 'SoFi Stadium',      'Los Angeles, CA'),
  km('m68', 'r16', 68, 'Vencedor M55', 'Vencedor M56', '2026-07-15', 'Hard Rock Stadium', 'Miami, FL'),
  km('m69', 'r16', 69, 'Vencedor M57', 'Vencedor M58', '2026-07-16', 'Levi\'s Stadium',    'Santa Clara, CA'),
  km('m70', 'r16', 70, 'Vencedor M59', 'Vencedor M60', '2026-07-16', 'Gillette Stadium',  'Foxborough, MA'),
  km('m71', 'r16', 71, 'Vencedor M61', 'Vencedor M62', '2026-07-17', 'BC Place',          'Vancouver, CAN'),
  km('m72', 'r16', 72, 'Vencedor M63', 'Vencedor M64', '2026-07-17', 'Estadio Azteca',    'Cidade do México'),

  km('m73', 'qf', 73, 'Vencedor M65', 'Vencedor M66', '2026-07-21', 'MetLife Stadium',   'East Rutherford, NJ'),
  km('m74', 'qf', 74, 'Vencedor M67', 'Vencedor M68', '2026-07-21', 'AT&T Stadium',      'Arlington, TX'),
  km('m75', 'qf', 75, 'Vencedor M69', 'Vencedor M70', '2026-07-22', 'SoFi Stadium',      'Los Angeles, CA'),
  km('m76', 'qf', 76, 'Vencedor M71', 'Vencedor M72', '2026-07-22', 'Hard Rock Stadium', 'Miami, FL'),

  km('m77', 'sf', 77, 'Vencedor M73', 'Vencedor M74', '2026-07-26', 'MetLife Stadium',   'East Rutherford, NJ'),
  km('m78', 'sf', 78, 'Vencedor M75', 'Vencedor M76', '2026-07-27', 'AT&T Stadium',      'Arlington, TX'),

  km('m79', 'terceiro', 79, 'Perdedor M77', 'Perdedor M78', '2026-07-30', 'Hard Rock Stadium', 'Miami, FL'),
  km('m80', 'final',    80, 'Vencedor M77', 'Vencedor M78', '2026-08-02', 'MetLife Stadium',   'East Rutherford, NJ'),
];

// ─── Critérios FIFA ───────────────────────────────────────────────────────────

export const CLASSIFICATION_CRITERIA: ClassificationCriteria[] = [
  { order: 1, title: 'Pontos', description: 'Maior número de pontos obtidos em todos os jogos do grupo.' },
  { order: 2, title: 'Saldo de Gols', description: 'Maior diferença entre gols marcados e sofridos em todos os jogos do grupo.' },
  { order: 3, title: 'Gols Marcados', description: 'Maior número de gols marcados em todos os jogos do grupo.' },
  { order: 4, title: 'Pontos (confronto direto)', description: 'Maior número de pontos obtidos nos jogos entre os times empatados.' },
  { order: 5, title: 'Saldo de Gols (confronto direto)', description: 'Maior saldo de gols nos jogos entre os times empatados.' },
  { order: 6, title: 'Gols Marcados (confronto direto)', description: 'Maior número de gols marcados nos jogos entre os times empatados.' },
  { order: 7, title: 'Fair Play', description: 'Maior número de pontos de fair play (menos cartões): amarelo = −1 pt, vermelho direto = −3 pts, amarelo + vermelho = −4 pts. Time com saldo mais próximo de zero é favorecido.' },
  { order: 8, title: 'Ranking FIFA', description: 'Melhor posição no ranking FIFA no momento do sorteio (dezembro/2024).' },
];
