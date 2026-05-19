export interface WCTeam {
  id: string;
  name: string;
  flag: string;
  confederation: string;
}

export interface WCStanding {
  team: WCTeam;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
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
  result: MatchResult;
}

export interface WCGroup {
  id: string;
  name: string;
  standings: WCStanding[];
  matches: WCMatch[];
}

// ─── Team registry ────────────────────────────────────────────────────────────

const T = (id: string, name: string, flag: string, confederation: string): WCTeam => ({
  id, name, flag, confederation,
});

// Seeds (Pot 1)
const USA     = T('usa',     'Estados Unidos', '🇺🇸', 'CONCACAF');
const MEX     = T('mex',     'México',         '🇲🇽', 'CONCACAF');
const CAN     = T('can',     'Canadá',         '🇨🇦', 'CONCACAF');
const ARG     = T('arg',     'Argentina',      '🇦🇷', 'CONMEBOL');
const BRA     = T('bra',     'Brasil',         '🇧🇷', 'CONMEBOL');
const FRA     = T('fra',     'França',         '🇫🇷', 'UEFA');
const ENG     = T('eng',     'Inglaterra',     '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'UEFA');
const ESP     = T('esp',     'Espanha',        '🇪🇸', 'UEFA');
const POR     = T('por',     'Portugal',       '🇵🇹', 'UEFA');
const GER     = T('ger',     'Alemanha',       '🇩🇪', 'UEFA');
const NED     = T('ned',     'Holanda',        '🇳🇱', 'UEFA');
const BEL     = T('bel',     'Bélgica',        '🇧🇪', 'UEFA');

// Non-seeds
const URU     = T('uru',     'Uruguai',        '🇺🇾', 'CONMEBOL');
const COL     = T('col',     'Colômbia',       '🇨🇴', 'CONMEBOL');
const ECU     = T('ecu',     'Equador',        '🇪🇨', 'CONMEBOL');
const VEN     = T('ven',     'Venezuela',      '🇻🇪', 'CONMEBOL');
const ITA     = T('ita',     'Itália',         '🇮🇹', 'UEFA');
const CRO     = T('cro',     'Croácia',        '🇭🇷', 'UEFA');
const SUI     = T('sui',     'Suíça',          '🇨🇭', 'UEFA');
const DEN     = T('den',     'Dinamarca',      '🇩🇰', 'UEFA');
const SRB     = T('srb',     'Sérvia',         '🇷🇸', 'UEFA');
const AUT     = T('aut',     'Áustria',        '🇦🇹', 'UEFA');
const SCO     = T('sco',     'Escócia',        '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'UEFA');
const TUR     = T('tur',     'Turquia',        '🇹🇷', 'UEFA');
const ALB     = T('alb',     'Albânia',        '🇦🇱', 'UEFA');
const PAN     = T('pan',     'Panamá',         '🇵🇦', 'CONCACAF');
const HON     = T('hon',     'Honduras',       '🇭🇳', 'CONCACAF');
const CRC     = T('crc',     'Costa Rica',     '🇨🇷', 'CONCACAF');
const MAR     = T('mar',     'Marrocos',       '🇲🇦', 'CAF');
const SEN     = T('sen',     'Senegal',        '🇸🇳', 'CAF');
const EGY     = T('egy',     'Egito',          '🇪🇬', 'CAF');
const NGA     = T('nga',     'Nigéria',        '🇳🇬', 'CAF');
const CMR     = T('cmr',     'Camarões',       '🇨🇲', 'CAF');
const CIV     = T('civ',     'Costa do Marfim','🇨🇮', 'CAF');
const COD     = T('cod',     'Rep. D. Congo',  '🇨🇩', 'CAF');
const RSA     = T('rsa',     'África do Sul',  '🇿🇦', 'CAF');
const TUN     = T('tun',     'Tunísia',        '🇹🇳', 'CAF');
const JPN     = T('jpn',     'Japão',          '🇯🇵', 'AFC');
const KOR     = T('kor',     'Coreia do Sul',  '🇰🇷', 'AFC');
const KSA     = T('ksa',     'Arábia Saudita', '🇸🇦', 'AFC');
const IRN     = T('irn',     'Irã',            '🇮🇷', 'AFC');
const AUS     = T('aus',     'Austrália',      '🇦🇺', 'AFC');
const JOR     = T('jor',     'Jordânia',       '🇯🇴', 'AFC');
const IRQ     = T('irq',     'Iraque',         '🇮🇶', 'AFC');
const UZB     = T('uzb',     'Uzbequistão',    '🇺🇿', 'AFC');
const NZL     = T('nzl',     'Nova Zelândia',  '🇳🇿', 'OFC');
const IDN     = T('idn',     'Indonésia',      '🇮🇩', 'AFC');
const PAR     = T('par',     'Paraguai',       '🇵🇾', 'CONMEBOL');

// ─── Helper builders ─────────────────────────────────────────────────────────

function standing(team: WCTeam): WCStanding {
  return { team, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 };
}

let matchCounter = 0;
function match(
  groupId: string,
  round: 1 | 2 | 3,
  home: WCTeam,
  away: WCTeam,
  date: string,
  time: string,
  venue: string,
  city: string,
): WCMatch {
  matchCounter++;
  return {
    id: `${groupId}-r${round}-${matchCounter}`,
    round,
    home,
    away,
    date,
    time,
    venue,
    city,
    homeScore: null,
    awayScore: null,
    result: null,
  };
}

// ─── Groups ───────────────────────────────────────────────────────────────────
// Groups based on the FIFA World Cup 2026 draw (December 5, 2024)

const GROUPS: WCGroup[] = [
  {
    id: 'A',
    name: 'Grupo A',
    standings: [standing(USA), standing(URU), standing(EGY), standing(JPN)],
    matches: [
      match('A', 1, USA,  URU, '2026-06-12', '18:00', 'MetLife Stadium',      'East Rutherford, NJ'),
      match('A', 1, EGY,  JPN, '2026-06-12', '21:00', 'Levi\'s Stadium',       'Santa Clara, CA'),
      match('A', 2, USA,  EGY, '2026-06-17', '15:00', 'MetLife Stadium',      'East Rutherford, NJ'),
      match('A', 2, JPN,  URU, '2026-06-17', '21:00', 'Hard Rock Stadium',    'Miami, FL'),
      match('A', 3, JPN,  USA, '2026-06-22', '21:00', 'Gillette Stadium',     'Foxborough, MA'),
      match('A', 3, URU,  EGY, '2026-06-22', '21:00', 'AT&T Stadium',         'Arlington, TX'),
    ],
  },
  {
    id: 'B',
    name: 'Grupo B',
    standings: [standing(MEX), standing(COL), standing(MAR), standing(KOR)],
    matches: [
      match('B', 1, MEX,  COL, '2026-06-13', '18:00', 'Estadio Azteca',       'Cidade do México, MEX'),
      match('B', 1, MAR,  KOR, '2026-06-13', '15:00', 'SoFi Stadium',         'Los Angeles, CA'),
      match('B', 2, MEX,  MAR, '2026-06-18', '21:00', 'Estadio Azteca',       'Cidade do México, MEX'),
      match('B', 2, KOR,  COL, '2026-06-18', '18:00', 'Levi\'s Stadium',       'Santa Clara, CA'),
      match('B', 3, KOR,  MEX, '2026-06-23', '21:00', 'AT&T Stadium',         'Arlington, TX'),
      match('B', 3, COL,  MAR, '2026-06-23', '21:00', 'Hard Rock Stadium',    'Miami, FL'),
    ],
  },
  {
    id: 'C',
    name: 'Grupo C',
    standings: [standing(CAN), standing(ECU), standing(SEN), standing(AUS)],
    matches: [
      match('C', 1, CAN,  ECU, '2026-06-13', '21:00', 'BC Place',             'Vancouver, CAN'),
      match('C', 1, SEN,  AUS, '2026-06-13', '18:00', 'Lincoln Financial',    'Filadélfia, PA'),
      match('C', 2, CAN,  SEN, '2026-06-18', '15:00', 'BC Place',             'Vancouver, CAN'),
      match('C', 2, AUS,  ECU, '2026-06-18', '12:00', 'Arrowhead Stadium',    'Kansas City, MO'),
      match('C', 3, AUS,  CAN, '2026-06-23', '18:00', 'BMO Field',            'Toronto, CAN'),
      match('C', 3, ECU,  SEN, '2026-06-23', '18:00', 'Camping World',        'Orlando, FL'),
    ],
  },
  {
    id: 'D',
    name: 'Grupo D',
    standings: [standing(ARG), standing(CRC), standing(NGA), standing(KSA)],
    matches: [
      match('D', 1, ARG,  CRC, '2026-06-14', '21:00', 'MetLife Stadium',      'East Rutherford, NJ'),
      match('D', 1, NGA,  KSA, '2026-06-14', '18:00', 'SoFi Stadium',         'Los Angeles, CA'),
      match('D', 2, ARG,  NGA, '2026-06-19', '21:00', 'Gillette Stadium',     'Foxborough, MA'),
      match('D', 2, KSA,  CRC, '2026-06-19', '15:00', 'Camping World',        'Orlando, FL'),
      match('D', 3, KSA,  ARG, '2026-06-25', '22:00', 'Hard Rock Stadium',    'Miami, FL'),
      match('D', 3, CRC,  NGA, '2026-06-25', '22:00', 'Lincoln Financial',    'Filadélfia, PA'),
    ],
  },
  {
    id: 'E',
    name: 'Grupo E',
    standings: [standing(BRA), standing(PAN), standing(CMR), standing(IRN)],
    matches: [
      match('E', 1, BRA,  PAN, '2026-06-14', '15:00', 'AT&T Stadium',         'Arlington, TX'),
      match('E', 1, CMR,  IRN, '2026-06-14', '12:00', 'Arrowhead Stadium',    'Kansas City, MO'),
      match('E', 2, BRA,  CMR, '2026-06-19', '18:00', 'Levi\'s Stadium',       'Santa Clara, CA'),
      match('E', 2, IRN,  PAN, '2026-06-19', '12:00', 'SoFi Stadium',         'Los Angeles, CA'),
      match('E', 3, IRN,  BRA, '2026-06-25', '18:00', 'MetLife Stadium',      'East Rutherford, NJ'),
      match('E', 3, PAN,  CMR, '2026-06-25', '18:00', 'Estadio Akron',        'Guadalajara, MEX'),
    ],
  },
  {
    id: 'F',
    name: 'Grupo F',
    standings: [standing(FRA), standing(VEN), standing(CIV), standing(JOR)],
    matches: [
      match('F', 1, FRA,  VEN, '2026-06-15', '21:00', 'MetLife Stadium',      'East Rutherford, NJ'),
      match('F', 1, CIV,  JOR, '2026-06-15', '15:00', 'Camping World',        'Orlando, FL'),
      match('F', 2, FRA,  CIV, '2026-06-20', '21:00', 'AT&T Stadium',         'Arlington, TX'),
      match('F', 2, JOR,  VEN, '2026-06-20', '15:00', 'Hard Rock Stadium',    'Miami, FL'),
      match('F', 3, JOR,  FRA, '2026-06-26', '22:00', 'Gillette Stadium',     'Foxborough, MA'),
      match('F', 3, VEN,  CIV, '2026-06-26', '22:00', 'Lincoln Financial',    'Filadélfia, PA'),
    ],
  },
  {
    id: 'G',
    name: 'Grupo G',
    standings: [standing(ENG), standing(HON), standing(RSA), standing(IRQ)],
    matches: [
      match('G', 1, ENG,  HON, '2026-06-15', '18:00', 'Hard Rock Stadium',    'Miami, FL'),
      match('G', 1, RSA,  IRQ, '2026-06-15', '12:00', 'Arrowhead Stadium',    'Kansas City, MO'),
      match('G', 2, ENG,  RSA, '2026-06-20', '18:00', 'MetLife Stadium',      'East Rutherford, NJ'),
      match('G', 2, IRQ,  HON, '2026-06-20', '12:00', 'Camping World',        'Orlando, FL'),
      match('G', 3, IRQ,  ENG, '2026-06-26', '18:00', 'SoFi Stadium',         'Los Angeles, CA'),
      match('G', 3, HON,  RSA, '2026-06-26', '18:00', 'Estadio BBVA',         'Monterrey, MEX'),
    ],
  },
  {
    id: 'H',
    name: 'Grupo H',
    standings: [standing(ESP), standing(CRO), standing(COD), standing(UZB)],
    matches: [
      match('H', 1, ESP,  CRO, '2026-06-16', '21:00', 'SoFi Stadium',         'Los Angeles, CA'),
      match('H', 1, COD,  UZB, '2026-06-16', '15:00', 'Lincoln Financial',    'Filadélfia, PA'),
      match('H', 2, ESP,  COD, '2026-06-21', '21:00', 'AT&T Stadium',         'Arlington, TX'),
      match('H', 2, UZB,  CRO, '2026-06-21', '15:00', 'Camping World',        'Orlando, FL'),
      match('H', 3, UZB,  ESP, '2026-06-27', '22:00', 'Arrowhead Stadium',    'Kansas City, MO'),
      match('H', 3, CRO,  COD, '2026-06-27', '22:00', 'Gillette Stadium',     'Foxborough, MA'),
    ],
  },
  {
    id: 'I',
    name: 'Grupo I',
    standings: [standing(POR), standing(ITA), standing(TUN), standing(IDN)],
    matches: [
      match('I', 1, POR,  ITA, '2026-06-16', '18:00', 'Levi\'s Stadium',       'Santa Clara, CA'),
      match('I', 1, TUN,  IDN, '2026-06-16', '12:00', 'BC Place',             'Vancouver, CAN'),
      match('I', 2, POR,  TUN, '2026-06-21', '18:00', 'Hard Rock Stadium',    'Miami, FL'),
      match('I', 2, IDN,  ITA, '2026-06-21', '12:00', 'Estadio Azteca',       'Cidade do México, MEX'),
      match('I', 3, IDN,  POR, '2026-06-28', '22:00', 'Lincoln Financial',    'Filadélfia, PA'),
      match('I', 3, ITA,  TUN, '2026-06-28', '22:00', 'MetLife Stadium',      'East Rutherford, NJ'),
    ],
  },
  {
    id: 'J',
    name: 'Grupo J',
    standings: [standing(GER), standing(SUI), standing(NZL), standing(SRB)],
    matches: [
      match('J', 1, GER,  SUI, '2026-06-17', '21:00', 'AT&T Stadium',         'Arlington, TX'),
      match('J', 1, NZL,  SRB, '2026-06-17', '15:00', 'Hard Rock Stadium',    'Miami, FL'),
      match('J', 2, GER,  NZL, '2026-06-22', '18:00', 'SoFi Stadium',         'Los Angeles, CA'),
      match('J', 2, SRB,  SUI, '2026-06-22', '15:00', 'Estadio Akron',        'Guadalajara, MEX'),
      match('J', 3, SRB,  GER, '2026-06-28', '18:00', 'Camping World',        'Orlando, FL'),
      match('J', 3, SUI,  NZL, '2026-06-28', '18:00', 'Arrowhead Stadium',    'Kansas City, MO'),
    ],
  },
  {
    id: 'K',
    name: 'Grupo K',
    standings: [standing(NED), standing(DEN), standing(TUR), standing(SCO)],
    matches: [
      match('K', 1, NED,  DEN, '2026-06-17', '18:00', 'MetLife Stadium',      'East Rutherford, NJ'),
      match('K', 1, TUR,  SCO, '2026-06-17', '12:00', 'Gillette Stadium',     'Foxborough, MA'),
      match('K', 2, NED,  TUR, '2026-06-23', '21:00', 'Levi\'s Stadium',       'Santa Clara, CA'),
      match('K', 2, SCO,  DEN, '2026-06-23', '15:00', 'Estadio BBVA',         'Monterrey, MEX'),
      match('K', 3, SCO,  NED, '2026-06-29', '22:00', 'SoFi Stadium',         'Los Angeles, CA'),
      match('K', 3, DEN,  TUR, '2026-06-29', '22:00', 'BC Place',             'Vancouver, CAN'),
    ],
  },
  {
    id: 'L',
    name: 'Grupo L',
    standings: [standing(BEL), standing(ALB), standing(AUT), standing(PAR)],
    matches: [
      match('L', 1, BEL,  ALB, '2026-06-18', '21:00', 'AT&T Stadium',         'Arlington, TX'),
      match('L', 1, AUT,  PAR, '2026-06-18', '18:00', 'Gillette Stadium',     'Foxborough, MA'),
      match('L', 2, BEL,  AUT, '2026-06-24', '21:00', 'Hard Rock Stadium',    'Miami, FL'),
      match('L', 2, PAR,  ALB, '2026-06-24', '15:00', 'Camping World',        'Orlando, FL'),
      match('L', 3, PAR,  BEL, '2026-06-30', '22:00', 'MetLife Stadium',      'East Rutherford, NJ'),
      match('L', 3, ALB,  AUT, '2026-06-30', '22:00', 'Levi\'s Stadium',       'Santa Clara, CA'),
    ],
  },
];

export function getWorldCupGroups(): WCGroup[] {
  return GROUPS;
}

export function getGroupById(id: string): WCGroup | undefined {
  return GROUPS.find((g) => g.id === id);
}
