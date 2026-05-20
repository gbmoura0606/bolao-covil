import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Teams ─────────────────────────────────────────────────────────────────────
const TEAMS: [string, string, string, string][] = [
  ['usa', 'Estados Unidos', '🇺🇸', 'CONCACAF'],
  ['mex', 'México', '🇲🇽', 'CONCACAF'],
  ['can', 'Canadá', '🇨🇦', 'CONCACAF'],
  ['arg', 'Argentina', '🇦🇷', 'CONMEBOL'],
  ['bra', 'Brasil', '🇧🇷', 'CONMEBOL'],
  ['fra', 'França', '🇫🇷', 'UEFA'],
  ['eng', 'Inglaterra', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'UEFA'],
  ['esp', 'Espanha', '🇪🇸', 'UEFA'],
  ['por', 'Portugal', '🇵🇹', 'UEFA'],
  ['ger', 'Alemanha', '🇩🇪', 'UEFA'],
  ['ned', 'Holanda', '🇳🇱', 'UEFA'],
  ['bel', 'Bélgica', '🇧🇪', 'UEFA'],
  ['uru', 'Uruguai', '🇺🇾', 'CONMEBOL'],
  ['col', 'Colômbia', '🇨🇴', 'CONMEBOL'],
  ['ecu', 'Equador', '🇪🇨', 'CONMEBOL'],
  ['ven', 'Venezuela', '🇻🇪', 'CONMEBOL'],
  ['ita', 'Itália', '🇮🇹', 'UEFA'],
  ['cro', 'Croácia', '🇭🇷', 'UEFA'],
  ['sui', 'Suíça', '🇨🇭', 'UEFA'],
  ['den', 'Dinamarca', '🇩🇰', 'UEFA'],
  ['srb', 'Sérvia', '🇷🇸', 'UEFA'],
  ['aut', 'Áustria', '🇦🇹', 'UEFA'],
  ['sco', 'Escócia', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'UEFA'],
  ['tur', 'Turquia', '🇹🇷', 'UEFA'],
  ['alb', 'Albânia', '🇦🇱', 'UEFA'],
  ['pan', 'Panamá', '🇵🇦', 'CONCACAF'],
  ['hon', 'Honduras', '🇭🇳', 'CONCACAF'],
  ['crc', 'Costa Rica', '🇨🇷', 'CONCACAF'],
  ['mar', 'Marrocos', '🇲🇦', 'CAF'],
  ['sen', 'Senegal', '🇸🇳', 'CAF'],
  ['egy', 'Egito', '🇪🇬', 'CAF'],
  ['nga', 'Nigéria', '🇳🇬', 'CAF'],
  ['cmr', 'Camarões', '🇨🇲', 'CAF'],
  ['civ', 'Costa do Marfim', '🇨🇮', 'CAF'],
  ['cod', 'Rep. D. Congo', '🇨🇩', 'CAF'],
  ['rsa', 'África do Sul', '🇿🇦', 'CAF'],
  ['tun', 'Tunísia', '🇹🇳', 'CAF'],
  ['jpn', 'Japão', '🇯🇵', 'AFC'],
  ['kor', 'Coreia do Sul', '🇰🇷', 'AFC'],
  ['ksa', 'Arábia Saudita', '🇸🇦', 'AFC'],
  ['irn', 'Irã', '🇮🇷', 'AFC'],
  ['aus', 'Austrália', '🇦🇺', 'AFC'],
  ['jor', 'Jordânia', '🇯🇴', 'AFC'],
  ['irq', 'Iraque', '🇮🇶', 'AFC'],
  ['uzb', 'Uzbequistão', '🇺🇿', 'AFC'],
  ['nzl', 'Nova Zelândia', '🇳🇿', 'OFC'],
  ['idn', 'Indonésia', '🇮🇩', 'AFC'],
  ['par', 'Paraguai', '🇵🇾', 'CONMEBOL'],
];

// ── Group matches: [extId, group, round, home, away, date, time, venue] ────────
type GM = [string, string, string, string, string, string, string, string];
const GROUP_MATCHES: GM[] = [
  // Grupo A
  ['GRP-A-R1-1','A','R1','usa','uru','2026-06-12','18:00','MetLife Stadium, East Rutherford NJ'],
  ['GRP-A-R1-2','A','R1','egy','jpn','2026-06-12','21:00','Levi\'s Stadium, Santa Clara CA'],
  ['GRP-A-R2-3','A','R2','usa','egy','2026-06-17','15:00','MetLife Stadium, East Rutherford NJ'],
  ['GRP-A-R2-4','A','R2','jpn','uru','2026-06-17','21:00','Hard Rock Stadium, Miami FL'],
  ['GRP-A-R3-5','A','R3','jpn','usa','2026-06-22','21:00','Gillette Stadium, Foxborough MA'],
  ['GRP-A-R3-6','A','R3','uru','egy','2026-06-22','21:00','AT&T Stadium, Arlington TX'],
  // Grupo B
  ['GRP-B-R1-1','B','R1','mex','col','2026-06-13','18:00','Estadio Azteca, Cidade do México'],
  ['GRP-B-R1-2','B','R1','mar','kor','2026-06-13','15:00','SoFi Stadium, Los Angeles CA'],
  ['GRP-B-R2-3','B','R2','mex','mar','2026-06-18','21:00','Estadio Azteca, Cidade do México'],
  ['GRP-B-R2-4','B','R2','kor','col','2026-06-18','18:00','Levi\'s Stadium, Santa Clara CA'],
  ['GRP-B-R3-5','B','R3','kor','mex','2026-06-23','21:00','AT&T Stadium, Arlington TX'],
  ['GRP-B-R3-6','B','R3','col','mar','2026-06-23','21:00','Hard Rock Stadium, Miami FL'],
  // Grupo C
  ['GRP-C-R1-1','C','R1','can','ecu','2026-06-13','21:00','BC Place, Vancouver CAN'],
  ['GRP-C-R1-2','C','R1','sen','aus','2026-06-13','18:00','Lincoln Financial, Filadélfia PA'],
  ['GRP-C-R2-3','C','R2','can','sen','2026-06-18','15:00','BC Place, Vancouver CAN'],
  ['GRP-C-R2-4','C','R2','aus','ecu','2026-06-18','12:00','Arrowhead Stadium, Kansas City MO'],
  ['GRP-C-R3-5','C','R3','aus','can','2026-06-23','18:00','BMO Field, Toronto CAN'],
  ['GRP-C-R3-6','C','R3','ecu','sen','2026-06-23','18:00','Camping World, Orlando FL'],
  // Grupo D
  ['GRP-D-R1-1','D','R1','arg','crc','2026-06-14','21:00','MetLife Stadium, East Rutherford NJ'],
  ['GRP-D-R1-2','D','R1','nga','ksa','2026-06-14','18:00','SoFi Stadium, Los Angeles CA'],
  ['GRP-D-R2-3','D','R2','arg','nga','2026-06-19','21:00','Gillette Stadium, Foxborough MA'],
  ['GRP-D-R2-4','D','R2','ksa','crc','2026-06-19','15:00','Camping World, Orlando FL'],
  ['GRP-D-R3-5','D','R3','ksa','arg','2026-06-25','22:00','Hard Rock Stadium, Miami FL'],
  ['GRP-D-R3-6','D','R3','crc','nga','2026-06-25','22:00','Lincoln Financial, Filadélfia PA'],
  // Grupo E
  ['GRP-E-R1-1','E','R1','bra','pan','2026-06-14','15:00','AT&T Stadium, Arlington TX'],
  ['GRP-E-R1-2','E','R1','cmr','irn','2026-06-14','12:00','Arrowhead Stadium, Kansas City MO'],
  ['GRP-E-R2-3','E','R2','bra','cmr','2026-06-19','18:00','Levi\'s Stadium, Santa Clara CA'],
  ['GRP-E-R2-4','E','R2','irn','pan','2026-06-19','12:00','SoFi Stadium, Los Angeles CA'],
  ['GRP-E-R3-5','E','R3','irn','bra','2026-06-25','18:00','MetLife Stadium, East Rutherford NJ'],
  ['GRP-E-R3-6','E','R3','pan','cmr','2026-06-25','18:00','Estadio Akron, Guadalajara MEX'],
  // Grupo F
  ['GRP-F-R1-1','F','R1','fra','ven','2026-06-15','21:00','MetLife Stadium, East Rutherford NJ'],
  ['GRP-F-R1-2','F','R1','civ','jor','2026-06-15','15:00','Camping World, Orlando FL'],
  ['GRP-F-R2-3','F','R2','fra','civ','2026-06-20','21:00','AT&T Stadium, Arlington TX'],
  ['GRP-F-R2-4','F','R2','jor','ven','2026-06-20','15:00','Hard Rock Stadium, Miami FL'],
  ['GRP-F-R3-5','F','R3','jor','fra','2026-06-26','22:00','Gillette Stadium, Foxborough MA'],
  ['GRP-F-R3-6','F','R3','ven','civ','2026-06-26','22:00','Lincoln Financial, Filadélfia PA'],
  // Grupo G
  ['GRP-G-R1-1','G','R1','eng','hon','2026-06-15','18:00','Hard Rock Stadium, Miami FL'],
  ['GRP-G-R1-2','G','R1','rsa','irq','2026-06-15','12:00','Arrowhead Stadium, Kansas City MO'],
  ['GRP-G-R2-3','G','R2','eng','rsa','2026-06-20','18:00','MetLife Stadium, East Rutherford NJ'],
  ['GRP-G-R2-4','G','R2','irq','hon','2026-06-20','12:00','Camping World, Orlando FL'],
  ['GRP-G-R3-5','G','R3','irq','eng','2026-06-26','18:00','SoFi Stadium, Los Angeles CA'],
  ['GRP-G-R3-6','G','R3','hon','rsa','2026-06-26','18:00','Estadio BBVA, Monterrey MEX'],
  // Grupo H
  ['GRP-H-R1-1','H','R1','esp','cro','2026-06-16','21:00','SoFi Stadium, Los Angeles CA'],
  ['GRP-H-R1-2','H','R1','cod','uzb','2026-06-16','15:00','Lincoln Financial, Filadélfia PA'],
  ['GRP-H-R2-3','H','R2','esp','cod','2026-06-21','21:00','AT&T Stadium, Arlington TX'],
  ['GRP-H-R2-4','H','R2','uzb','cro','2026-06-21','15:00','Camping World, Orlando FL'],
  ['GRP-H-R3-5','H','R3','uzb','esp','2026-06-27','22:00','Arrowhead Stadium, Kansas City MO'],
  ['GRP-H-R3-6','H','R3','cro','cod','2026-06-27','22:00','Gillette Stadium, Foxborough MA'],
  // Grupo I
  ['GRP-I-R1-1','I','R1','por','ita','2026-06-16','18:00','Levi\'s Stadium, Santa Clara CA'],
  ['GRP-I-R1-2','I','R1','tun','idn','2026-06-16','12:00','BC Place, Vancouver CAN'],
  ['GRP-I-R2-3','I','R2','por','tun','2026-06-21','18:00','Hard Rock Stadium, Miami FL'],
  ['GRP-I-R2-4','I','R2','idn','ita','2026-06-21','12:00','Estadio Azteca, Cidade do México'],
  ['GRP-I-R3-5','I','R3','idn','por','2026-06-28','22:00','Lincoln Financial, Filadélfia PA'],
  ['GRP-I-R3-6','I','R3','ita','tun','2026-06-28','22:00','MetLife Stadium, East Rutherford NJ'],
  // Grupo J
  ['GRP-J-R1-1','J','R1','ger','sui','2026-06-17','21:00','AT&T Stadium, Arlington TX'],
  ['GRP-J-R1-2','J','R1','nzl','srb','2026-06-17','15:00','Hard Rock Stadium, Miami FL'],
  ['GRP-J-R2-3','J','R2','ger','nzl','2026-06-22','18:00','SoFi Stadium, Los Angeles CA'],
  ['GRP-J-R2-4','J','R2','srb','sui','2026-06-22','15:00','Estadio Akron, Guadalajara MEX'],
  ['GRP-J-R3-5','J','R3','srb','ger','2026-06-28','18:00','Camping World, Orlando FL'],
  ['GRP-J-R3-6','J','R3','sui','nzl','2026-06-28','18:00','Arrowhead Stadium, Kansas City MO'],
  // Grupo K
  ['GRP-K-R1-1','K','R1','ned','den','2026-06-17','18:00','MetLife Stadium, East Rutherford NJ'],
  ['GRP-K-R1-2','K','R1','tur','sco','2026-06-17','12:00','Gillette Stadium, Foxborough MA'],
  ['GRP-K-R2-3','K','R2','ned','tur','2026-06-23','21:00','Levi\'s Stadium, Santa Clara CA'],
  ['GRP-K-R2-4','K','R2','sco','den','2026-06-23','15:00','Estadio BBVA, Monterrey MEX'],
  ['GRP-K-R3-5','K','R3','sco','ned','2026-06-29','22:00','SoFi Stadium, Los Angeles CA'],
  ['GRP-K-R3-6','K','R3','den','tur','2026-06-29','22:00','BC Place, Vancouver CAN'],
  // Grupo L
  ['GRP-L-R1-1','L','R1','bel','alb','2026-06-18','21:00','AT&T Stadium, Arlington TX'],
  ['GRP-L-R1-2','L','R1','aut','par','2026-06-18','18:00','Gillette Stadium, Foxborough MA'],
  ['GRP-L-R2-3','L','R2','bel','aut','2026-06-24','21:00','Hard Rock Stadium, Miami FL'],
  ['GRP-L-R2-4','L','R2','par','alb','2026-06-24','15:00','Camping World, Orlando FL'],
  ['GRP-L-R3-5','L','R3','par','bel','2026-06-30','22:00','MetLife Stadium, East Rutherford NJ'],
  ['GRP-L-R3-6','L','R3','alb','aut','2026-06-30','22:00','Levi\'s Stadium, Santa Clara CA'],
];

// ── Knockout matches: [extId, round, num, homeSlot, awaySlot, date, venue] ───
type KM = [string, string, number, string, string, string, string];
const KNOCKOUT_MATCHES: KM[] = [
  ['M49','r32',49,'1º Grupo A','2º Grupo B','2026-07-04','MetLife Stadium, East Rutherford NJ'],
  ['M50','r32',50,'1º Grupo C','2º Grupo D','2026-07-04','AT&T Stadium, Arlington TX'],
  ['M51','r32',51,'1º Grupo E','2º Grupo F','2026-07-05','SoFi Stadium, Los Angeles CA'],
  ['M52','r32',52,'1º Grupo G','2º Grupo H','2026-07-05','Hard Rock Stadium, Miami FL'],
  ['M53','r32',53,'1º Grupo I','2º Grupo J','2026-07-06','Levi\'s Stadium, Santa Clara CA'],
  ['M54','r32',54,'1º Grupo K','2º Grupo L','2026-07-06','Gillette Stadium, Foxborough MA'],
  ['M55','r32',55,'1º Grupo B','3º melhor (1)','2026-07-07','Arrowhead Stadium, Kansas City MO'],
  ['M56','r32',56,'1º Grupo D','3º melhor (2)','2026-07-07','Camping World, Orlando FL'],
  ['M57','r32',57,'1º Grupo F','3º melhor (3)','2026-07-08','Lincoln Financial, Filadélfia PA'],
  ['M58','r32',58,'1º Grupo H','3º melhor (4)','2026-07-08','BC Place, Vancouver CAN'],
  ['M59','r32',59,'1º Grupo J','3º melhor (5)','2026-07-09','Estadio Azteca, Cidade do México'],
  ['M60','r32',60,'1º Grupo L','3º melhor (6)','2026-07-09','Estadio Akron, Guadalajara MEX'],
  ['M61','r32',61,'2º Grupo A','3º melhor (7)','2026-07-10','AT&T Stadium, Arlington TX'],
  ['M62','r32',62,'2º Grupo C','3º melhor (8)','2026-07-10','MetLife Stadium, East Rutherford NJ'],
  ['M63','r32',63,'2º Grupo E','2º Grupo G','2026-07-11','SoFi Stadium, Los Angeles CA'],
  ['M64','r32',64,'2º Grupo I','2º Grupo K','2026-07-11','Hard Rock Stadium, Miami FL'],
  ['M65','r16',65,'Vencedor M49','Vencedor M50','2026-07-14','MetLife Stadium, East Rutherford NJ'],
  ['M66','r16',66,'Vencedor M51','Vencedor M52','2026-07-14','AT&T Stadium, Arlington TX'],
  ['M67','r16',67,'Vencedor M53','Vencedor M54','2026-07-15','SoFi Stadium, Los Angeles CA'],
  ['M68','r16',68,'Vencedor M55','Vencedor M56','2026-07-15','Hard Rock Stadium, Miami FL'],
  ['M69','r16',69,'Vencedor M57','Vencedor M58','2026-07-16','Levi\'s Stadium, Santa Clara CA'],
  ['M70','r16',70,'Vencedor M59','Vencedor M60','2026-07-16','Gillette Stadium, Foxborough MA'],
  ['M71','r16',71,'Vencedor M61','Vencedor M62','2026-07-17','BC Place, Vancouver CAN'],
  ['M72','r16',72,'Vencedor M63','Vencedor M64','2026-07-17','Estadio Azteca, Cidade do México'],
  ['M73','qf',73,'Vencedor M65','Vencedor M66','2026-07-21','MetLife Stadium, East Rutherford NJ'],
  ['M74','qf',74,'Vencedor M67','Vencedor M68','2026-07-21','AT&T Stadium, Arlington TX'],
  ['M75','qf',75,'Vencedor M69','Vencedor M70','2026-07-22','SoFi Stadium, Los Angeles CA'],
  ['M76','qf',76,'Vencedor M71','Vencedor M72','2026-07-22','Hard Rock Stadium, Miami FL'],
  ['M77','sf',77,'Vencedor M73','Vencedor M74','2026-07-26','MetLife Stadium, East Rutherford NJ'],
  ['M78','sf',78,'Vencedor M75','Vencedor M76','2026-07-27','AT&T Stadium, Arlington TX'],
  ['M79','terceiro',79,'Perdedor M77','Perdedor M78','2026-07-30','Hard Rock Stadium, Miami FL'],
  ['M80','final',80,'Vencedor M77','Vencedor M78','2026-08-02','MetLife Stadium, East Rutherford NJ'],
];

export async function seedWorldCup(): Promise<void> {
  // 1. Upsert all teams
  for (const [country, name, flagEmoji] of TEAMS) {
    await prisma.team.upsert({
      where: { country },
      update: { name, flagEmoji },
      create: { country, name, flagEmoji },
    });
  }

  // Build country → DB id map
  const dbTeams = await prisma.team.findMany({ select: { id: true, country: true } });
  const teamId: Record<string, string> = {};
  for (const t of dbTeams) teamId[t.country] = t.id;

  // 2. Upsert group matches (time is index 6, venue is index 7)
  for (const [extId, group, round, home, away, date, time, venue] of GROUP_MATCHES) {
    await prisma.match.upsert({
      where: { externalId: extId },
      update: {},
      create: {
        externalId: extId,
        group,
        round,
        homeTeamId: teamId[home],
        awayTeamId: teamId[away],
        matchDate: new Date(`${date}T${time}:00.000Z`),
        venue,
        status: 'OPEN',
      },
    });
  }

  // 3. Upsert knockout matches (teams resolved dynamically via homeSlot/awaySlot)
  for (const [extId, round, , homeSlot, awaySlot, date, venue] of KNOCKOUT_MATCHES) {
    await prisma.match.upsert({
      where: { externalId: extId },
      update: {},
      create: {
        externalId: extId,
        round,
        group: null,
        homeSlot,
        awaySlot,
        matchDate: new Date(`${date}T18:00:00.000Z`),
        venue,
        status: 'OPEN',
      },
    });
  }

  console.log(`[seed] World Cup 2026: ${TEAMS.length} teams, ${GROUP_MATCHES.length} group matches, ${KNOCKOUT_MATCHES.length} knockout matches.`);
}
