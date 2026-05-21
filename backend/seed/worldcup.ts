import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Teams ─────────────────────────────────────────────────────────────────────
const TEAMS: [string, string, string][] = [
  // Grupo A
  ['mex', 'México', '🇲🇽'],
  ['rsa', 'África do Sul', '🇿🇦'],
  ['kor', 'Coreia do Sul', '🇰🇷'],
  ['cze', 'Tchéquia', '🇨🇿'],
  // Grupo B
  ['can', 'Canadá', '🇨🇦'],
  ['bih', 'Bósnia e Herzegovina', '🇧🇦'],
  ['qat', 'Catar', '🇶🇦'],
  ['sui', 'Suíça', '🇨🇭'],
  // Grupo C
  ['bra', 'Brasil', '🇧🇷'],
  ['mar', 'Marrocos', '🇲🇦'],
  ['hai', 'Haiti', '🇭🇹'],
  ['sco', 'Escócia', '🏴󠁧󠁢󠁳󠁣󠁴󠁿'],
  // Grupo D
  ['usa', 'Estados Unidos', '🇺🇸'],
  ['par', 'Paraguai', '🇵🇾'],
  ['aus', 'Austrália', '🇦🇺'],
  ['tur', 'Turquia', '🇹🇷'],
  // Grupo E
  ['ger', 'Alemanha', '🇩🇪'],
  ['cur', 'Curaçao', '🇨🇼'],
  ['civ', 'Costa do Marfim', '🇨🇮'],
  ['ecu', 'Equador', '🇪🇨'],
  // Grupo F
  ['ned', 'Holanda', '🇳🇱'],
  ['jpn', 'Japão', '🇯🇵'],
  ['swe', 'Suécia', '🇸🇪'],
  ['tun', 'Tunísia', '🇹🇳'],
  // Grupo G
  ['bel', 'Bélgica', '🇧🇪'],
  ['egy', 'Egito', '🇪🇬'],
  ['irn', 'Irã', '🇮🇷'],
  ['nzl', 'Nova Zelândia', '🇳🇿'],
  // Grupo H
  ['esp', 'Espanha', '🇪🇸'],
  ['cpv', 'Cabo Verde', '🇨🇻'],
  ['ksa', 'Arábia Saudita', '🇸🇦'],
  ['uru', 'Uruguai', '🇺🇾'],
  // Grupo I
  ['fra', 'França', '🇫🇷'],
  ['sen', 'Senegal', '🇸🇳'],
  ['irq', 'Iraque', '🇮🇶'],
  ['nor', 'Noruega', '🇳🇴'],
  // Grupo J
  ['arg', 'Argentina', '🇦🇷'],
  ['alg', 'Argélia', '🇩🇿'],
  ['aut', 'Áustria', '🇦🇹'],
  ['jor', 'Jordânia', '🇯🇴'],
  // Grupo K
  ['por', 'Portugal', '🇵🇹'],
  ['cod', 'Rep. D. Congo', '🇨🇩'],
  ['uzb', 'Uzbequistão', '🇺🇿'],
  ['col', 'Colômbia', '🇨🇴'],
  // Grupo L
  ['eng', 'Inglaterra', '🏴󠁧󠁢󠁥󠁮󠁧󠁿'],
  ['cro', 'Croácia', '🇭🇷'],
  ['gha', 'Gana', '🇬🇭'],
  ['pan', 'Panamá', '🇵🇦'],
];

// ── Group matches ─────────────────────────────────────────────────────────────
// [extId, group, round, home, away, date, timeBRT, venue]
// Times stored as BRT display times (UTC-3 equivalent stored as UTC for direct display)
type GM = [string, string, string, string, string, string, string, string];
const GROUP_MATCHES: GM[] = [
  // Grupo A — mex, rsa, kor, cze
  ['GRP-A-R1-1','A','R1','mex','rsa','2026-06-11','16:00','Estadio Azteca, Cidade do México'],
  ['GRP-A-R1-2','A','R1','kor','cze','2026-06-11','23:00','Estadio Akron, Guadalajara MEX'],
  ['GRP-A-R2-3','A','R2','cze','rsa','2026-06-18','13:00','Mercedes-Benz Stadium, Atlanta GA'],
  ['GRP-A-R2-4','A','R2','mex','kor','2026-06-18','22:00','Estadio Akron, Guadalajara MEX'],
  ['GRP-A-R3-5','A','R3','cze','mex','2026-06-24','22:00','Estadio Azteca, Cidade do México'],
  ['GRP-A-R3-6','A','R3','rsa','kor','2026-06-24','22:00','Estadio BBVA, Monterrey MEX'],
  // Grupo B — can, bih, qat, sui
  ['GRP-B-R1-1','B','R1','can','bih','2026-06-12','16:00','BMO Field, Toronto CAN'],
  ['GRP-B-R1-2','B','R1','qat','sui','2026-06-13','16:00','Levi\'s Stadium, Santa Clara CA'],
  ['GRP-B-R2-3','B','R2','can','qat','2026-06-18','19:00','BC Place, Vancouver CAN'],
  ['GRP-B-R2-4','B','R2','sui','bih','2026-06-18','16:00','SoFi Stadium, Los Angeles CA'],
  ['GRP-B-R3-5','B','R3','sui','can','2026-06-24','16:00','BC Place, Vancouver CAN'],
  ['GRP-B-R3-6','B','R3','bih','qat','2026-06-24','16:00','Lumen Field, Seattle WA'],
  // Grupo C — bra, mar, hai, sco
  ['GRP-C-R1-1','C','R1','bra','mar','2026-06-13','19:00','MetLife Stadium, East Rutherford NJ'],
  ['GRP-C-R1-2','C','R1','hai','sco','2026-06-13','22:00','Gillette Stadium, Foxborough MA'],
  ['GRP-C-R2-3','C','R2','sco','mar','2026-06-19','19:00','Gillette Stadium, Foxborough MA'],
  ['GRP-C-R2-4','C','R2','bra','hai','2026-06-19','22:00','Lincoln Financial Field, Filadélfia PA'],
  ['GRP-C-R3-5','C','R3','sco','bra','2026-06-24','19:00','Hard Rock Stadium, Miami FL'],
  ['GRP-C-R3-6','C','R3','mar','hai','2026-06-24','19:00','Mercedes-Benz Stadium, Atlanta GA'],
  // Grupo D — usa, par, aus, tur
  ['GRP-D-R1-1','D','R1','usa','par','2026-06-12','22:00','SoFi Stadium, Los Angeles CA'],
  ['GRP-D-R1-2','D','R1','aus','tur','2026-06-14','01:00','BC Place, Vancouver CAN'],
  ['GRP-D-R2-3','D','R2','usa','aus','2026-06-19','16:00','Lumen Field, Seattle WA'],
  ['GRP-D-R2-4','D','R2','tur','par','2026-06-20','01:00','Levi\'s Stadium, Santa Clara CA'],
  ['GRP-D-R3-5','D','R3','tur','usa','2026-06-25','23:00','SoFi Stadium, Los Angeles CA'],
  ['GRP-D-R3-6','D','R3','par','aus','2026-06-25','23:00','Levi\'s Stadium, Santa Clara CA'],
  // Grupo E — ger, cur, civ, ecu
  ['GRP-E-R1-1','E','R1','ger','cur','2026-06-14','14:00','NRG Stadium, Houston TX'],
  ['GRP-E-R1-2','E','R1','civ','ecu','2026-06-14','20:00','Lincoln Financial Field, Filadélfia PA'],
  ['GRP-E-R2-3','E','R2','ger','civ','2026-06-20','17:00','BMO Field, Toronto CAN'],
  ['GRP-E-R2-4','E','R2','ecu','cur','2026-06-20','21:00','Arrowhead Stadium, Kansas City MO'],
  ['GRP-E-R3-5','E','R3','cur','civ','2026-06-25','17:00','Lincoln Financial Field, Filadélfia PA'],
  ['GRP-E-R3-6','E','R3','ecu','ger','2026-06-25','17:00','MetLife Stadium, East Rutherford NJ'],
  // Grupo F — ned, jpn, swe, tun
  ['GRP-F-R1-1','F','R1','ned','jpn','2026-06-14','17:00','AT&T Stadium, Arlington TX'],
  ['GRP-F-R1-2','F','R1','swe','tun','2026-06-14','23:00','Estadio BBVA, Monterrey MEX'],
  ['GRP-F-R2-3','F','R2','ned','swe','2026-06-20','14:00','NRG Stadium, Houston TX'],
  ['GRP-F-R2-4','F','R2','tun','jpn','2026-06-21','01:00','Estadio BBVA, Monterrey MEX'],
  ['GRP-F-R3-5','F','R3','jpn','swe','2026-06-25','20:00','AT&T Stadium, Arlington TX'],
  ['GRP-F-R3-6','F','R3','tun','ned','2026-06-25','20:00','Arrowhead Stadium, Kansas City MO'],
  // Grupo G — bel, egy, irn, nzl
  ['GRP-G-R1-1','G','R1','bel','egy','2026-06-15','16:00','Lumen Field, Seattle WA'],
  ['GRP-G-R1-2','G','R1','irn','nzl','2026-06-15','22:00','SoFi Stadium, Los Angeles CA'],
  ['GRP-G-R2-3','G','R2','bel','irn','2026-06-21','16:00','SoFi Stadium, Los Angeles CA'],
  ['GRP-G-R2-4','G','R2','nzl','egy','2026-06-21','22:00','BC Place, Vancouver CAN'],
  ['GRP-G-R3-5','G','R3','egy','irn','2026-06-27','00:00','Lumen Field, Seattle WA'],
  ['GRP-G-R3-6','G','R3','nzl','bel','2026-06-27','00:00','BC Place, Vancouver CAN'],
  // Grupo H — esp, cpv, ksa, uru
  ['GRP-H-R1-1','H','R1','esp','cpv','2026-06-15','13:00','Mercedes-Benz Stadium, Atlanta GA'],
  ['GRP-H-R1-2','H','R1','ksa','uru','2026-06-15','19:00','Hard Rock Stadium, Miami FL'],
  ['GRP-H-R2-3','H','R2','esp','ksa','2026-06-21','13:00','Mercedes-Benz Stadium, Atlanta GA'],
  ['GRP-H-R2-4','H','R2','uru','cpv','2026-06-21','19:00','Hard Rock Stadium, Miami FL'],
  ['GRP-H-R3-5','H','R3','cpv','ksa','2026-06-26','21:00','NRG Stadium, Houston TX'],
  ['GRP-H-R3-6','H','R3','uru','esp','2026-06-26','21:00','Estadio Akron, Guadalajara MEX'],
  // Grupo I — fra, sen, irq, nor
  ['GRP-I-R1-1','I','R1','fra','sen','2026-06-16','16:00','MetLife Stadium, East Rutherford NJ'],
  ['GRP-I-R1-2','I','R1','irq','nor','2026-06-16','19:00','Gillette Stadium, Foxborough MA'],
  ['GRP-I-R2-3','I','R2','fra','irq','2026-06-22','18:00','Lincoln Financial Field, Filadélfia PA'],
  ['GRP-I-R2-4','I','R2','nor','sen','2026-06-22','21:00','MetLife Stadium, East Rutherford NJ'],
  ['GRP-I-R3-5','I','R3','nor','fra','2026-06-26','16:00','Gillette Stadium, Foxborough MA'],
  ['GRP-I-R3-6','I','R3','sen','irq','2026-06-26','16:00','BMO Field, Toronto CAN'],
  // Grupo J — arg, alg, aut, jor
  ['GRP-J-R1-1','J','R1','arg','alg','2026-06-16','22:00','Arrowhead Stadium, Kansas City MO'],
  ['GRP-J-R1-2','J','R1','aut','jor','2026-06-17','01:00','Levi\'s Stadium, Santa Clara CA'],
  ['GRP-J-R2-3','J','R2','arg','aut','2026-06-22','14:00','AT&T Stadium, Arlington TX'],
  ['GRP-J-R2-4','J','R2','jor','alg','2026-06-23','00:00','Levi\'s Stadium, Santa Clara CA'],
  ['GRP-J-R3-5','J','R3','jor','arg','2026-06-27','23:00','AT&T Stadium, Arlington TX'],
  ['GRP-J-R3-6','J','R3','alg','aut','2026-06-27','23:00','Arrowhead Stadium, Kansas City MO'],
  // Grupo K — por, cod, uzb, col
  ['GRP-K-R1-1','K','R1','por','cod','2026-06-17','14:00','NRG Stadium, Houston TX'],
  ['GRP-K-R1-2','K','R1','uzb','col','2026-06-17','23:00','Estadio Azteca, Cidade do México'],
  ['GRP-K-R2-3','K','R2','por','uzb','2026-06-23','14:00','NRG Stadium, Houston TX'],
  ['GRP-K-R2-4','K','R2','col','cod','2026-06-23','23:00','Estadio Akron, Guadalajara MEX'],
  ['GRP-K-R3-5','K','R3','col','por','2026-06-27','20:30','Hard Rock Stadium, Miami FL'],
  ['GRP-K-R3-6','K','R3','cod','uzb','2026-06-27','20:30','Mercedes-Benz Stadium, Atlanta GA'],
  // Grupo L — eng, cro, gha, pan
  ['GRP-L-R1-1','L','R1','eng','cro','2026-06-17','17:00','AT&T Stadium, Arlington TX'],
  ['GRP-L-R1-2','L','R1','gha','pan','2026-06-17','20:00','BMO Field, Toronto CAN'],
  ['GRP-L-R2-3','L','R2','eng','gha','2026-06-23','17:00','Gillette Stadium, Foxborough MA'],
  ['GRP-L-R2-4','L','R2','pan','cro','2026-06-23','20:00','BMO Field, Toronto CAN'],
  ['GRP-L-R3-5','L','R3','pan','eng','2026-06-27','18:00','MetLife Stadium, East Rutherford NJ'],
  ['GRP-L-R3-6','L','R3','cro','gha','2026-06-27','18:00','Lincoln Financial Field, Filadélfia PA'],
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
  ['M56','r32',56,'1º Grupo D','3º melhor (2)','2026-07-07','Camping World Stadium, Orlando FL'],
  ['M57','r32',57,'1º Grupo F','3º melhor (3)','2026-07-08','Lincoln Financial Field, Filadélfia PA'],
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

  // 2. Upsert group matches — update clause fixes existing wrong records
  for (const [extId, group, round, home, away, date, time, venue] of GROUP_MATCHES) {
    await prisma.match.upsert({
      where: { externalId: extId },
      update: {
        group,
        round,
        homeTeamId: teamId[home],
        awayTeamId: teamId[away],
        matchDate: new Date(`${date}T${time}:00.000Z`),
        venue,
      },
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

  // 3. Upsert knockout matches
  for (const [extId, round, , homeSlot, awaySlot, date, venue] of KNOCKOUT_MATCHES) {
    await prisma.match.upsert({
      where: { externalId: extId },
      update: { round, homeSlot, awaySlot, matchDate: new Date(`${date}T18:00:00.000Z`), venue },
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
