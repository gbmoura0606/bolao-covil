/**
 * Teste end-to-end (sem banco) do fluxo do mata-mata:
 *   resultados da fase de grupos  →  alocação dos 3os (Anexo C)  →
 *   preenchimento automático de R32 → Oitavas → Quartas → Semis →
 *   3º lugar + Final (incluindo decisão por pênaltis).
 *
 * Usa os MESMOS slots oficiais do seed (KNOCKOUT_MATCHES) e o MESMO núcleo
 * de cálculo do servidor (buildStandings), então valida exatamente o que a
 * API /api/standings vai apresentar.
 *
 * Rodar:  cd backend && npx ts-node test/knockoutFlow.test.ts
 */
import assert from 'assert';
import { buildStandings, type DbMatch, type TeamInfo } from '../controllers/standingsController';
import { KNOCKOUT_MATCHES } from '../seed/worldcup';
import { THIRD_PLACE_ALLOCATION } from '../config/thirdPlaceAllocation';

const GROUPS = 'ABCDEFGHIJKL'.split('');
let clock = 0;
const nextDate = (): Date => new Date(2026, 5, 1, 0, clock++); // datas crescentes → ordem estável

function team(id: string): TeamInfo {
  return { id, name: id, flagEmoji: '', country: id };
}

/** Cria uma partida de grupo já finalizada. */
function gm(group: string, home: string, away: string, hs: number, as_: number): DbMatch {
  return {
    id: `GM-${group}-${home}-${away}`, externalId: `GM-${group}-${home}-${away}`,
    round: 'R1', group, homeTeamId: home, awayTeamId: away,
    homeScore: hs, awayScore: as_, homePenalty: null, awayPenalty: null,
    status: 'FINISHED', matchDate: nextDate(), venue: null,
    homeSlot: null, awaySlot: null, homeTeam: team(home), awayTeam: team(away),
  };
}

/**
 * Para cada grupo gera resultados que produzem 1º=g1, 2º=g2, 3º=g3, 4º=g4.
 * O 3º vence o 4º por K×0 (K decrescente de A→L) → o saldo do 3º é estritamente
 * decrescente A>B>...>L, logo os 8 melhores 3os são exatamente os grupos A–H.
 */
function buildGroupMatches(): DbMatch[] {
  const out: DbMatch[] = [];
  GROUPS.forEach((g, idx) => {
    const [t1, t2, t3, t4] = [1, 2, 3, 4].map((n) => `${g}${n}`);
    const K = 12 - idx; // A=12 … L=1
    out.push(
      gm(g, t1, t2, 1, 0),
      gm(g, t1, t3, 1, 0),
      gm(g, t1, t4, 1, 0),
      gm(g, t2, t3, 1, 0),
      gm(g, t2, t4, 1, 0),
      gm(g, t3, t4, K, 0),
    );
  });
  return out;
}

/** Constrói as 32 partidas de mata-mata a partir dos slots oficiais do seed. */
function buildKnockoutMatches(): DbMatch[] {
  return KNOCKOUT_MATCHES.map(([extId, round, , homeSlot, awaySlot]) => ({
    id: extId, externalId: extId, round, group: null,
    homeTeamId: null, awayTeamId: null,
    homeScore: null, awayScore: null, homePenalty: null, awayPenalty: null,
    status: 'OPEN', matchDate: nextDate(), venue: null,
    homeSlot, awaySlot, homeTeam: null, awayTeam: null,
  }));
}

type Bracket = ReturnType<typeof buildStandings>['bracket'];
const findM = (b: Bracket, n: number) => b.find((m) => m.matchNumber === n)!;

function setResult(matches: DbMatch[], extId: string, hs: number, as_: number, hp?: number, ap?: number): void {
  const m = matches.find((x) => x.externalId === extId)!;
  m.homeScore = hs; m.awayScore = as_;
  m.homePenalty = hp ?? null; m.awayPenalty = ap ?? null;
  m.status = 'FINISHED';
}

// ─────────────────────────────────────────────────────────────────────────────
let passed = 0;
const check = (label: string, cond: boolean): void => {
  assert.ok(cond, `FALHOU: ${label}`);
  passed++;
};

const groupMatches = buildGroupMatches();
const knockoutMatches = buildKnockoutMatches();
const all = (): DbMatch[] => [...groupMatches, ...knockoutMatches];

// ── 1. GATILHO: 3os NÃO são alocados enquanto faltar um placar de grupo ───────
{
  const saved = groupMatches[groupMatches.length - 1].homeScore;
  groupMatches[groupMatches.length - 1].homeScore = null; // tira 1 placar do grupo L
  const { bracket } = buildStandings(all());
  const m79 = findM(bracket, 79); // 1A vs 3º(...)
  check('antes de fechar grupos: 1A já resolvido', m79.homeTeam?.id === 'A1');
  check('antes de fechar grupos: slot de 3º fica vazio (TBD)', m79.awayTeam === null);
  const m73 = findM(bracket, 73);
  check('antes de fechar grupos: confronto sem 3º (2A v 2B) resolve normal', m73.homeTeam?.id === 'A2' && m73.awayTeam?.id === 'B2');
  groupMatches[groupMatches.length - 1].homeScore = saved; // restaura
}

// ── 2. Fase de grupos completa → 3os e Anexo C ────────────────────────────────
const r1 = buildStandings(all());
const top8 = r1.thirds.slice(0, 8).map((t) => t.groupId);
check('8 melhores 3os = grupos A–H', top8.join('') === 'ABCDEFGH');
const alloc = THIRD_PLACE_ALLOCATION['ABCDEFGH']; // {A:H,B:G,D:B,E:C,G:A,I:F,K:D,L:E}
check('Anexo C tem a combinação ABCDEFGH', !!alloc);

// Resoluções esperadas da Rodada de 32 (home vs away)
const R32_EXPECT: Record<number, [string, string]> = {
  73: ['A2', 'B2'],                 // 2A v 2B
  74: ['E1', `${alloc.E}3`],        // 1E v 3º alocado p/ E (=C)
  75: ['F1', 'C2'],                 // 1F v 2C
  76: ['C1', 'F2'],                 // 1C v 2F
  77: ['I1', `${alloc.I}3`],        // 1I v 3º (=F)
  78: ['E2', 'I2'],                 // 2E v 2I
  79: ['A1', `${alloc.A}3`],        // 1A v 3º (=H)
  80: ['L1', `${alloc.L}3`],        // 1L v 3º (=E)
  81: ['D1', `${alloc.D}3`],        // 1D v 3º (=B)
  82: ['G1', `${alloc.G}3`],        // 1G v 3º (=A)
  83: ['K2', 'L2'],                 // 2K v 2L
  84: ['H1', 'J2'],                 // 1H v 2J
  85: ['B1', `${alloc.B}3`],        // 1B v 3º (=G)
  86: ['J1', 'H2'],                 // 1J v 2H
  87: ['K1', `${alloc.K}3`],        // 1K v 3º (=D)
  88: ['D2', 'G2'],                 // 2D v 2G
};
for (const [num, [h, a]] of Object.entries(R32_EXPECT)) {
  const m = findM(r1.bracket, Number(num));
  check(`R32 M${num} home = ${h}`, m.homeTeam?.id === h);
  check(`R32 M${num} away = ${a}`, m.awayTeam?.id === a);
}

// ── 3. Preenche R32 (mando vence) e confere as Oitavas ────────────────────────
for (const num of Object.keys(R32_EXPECT)) {
  setResult(knockoutMatches, `M${num}`, 2, 1); // home 2 x 1 away → vence o mando
}
const r2 = buildStandings(all());
const R16_EXPECT: Record<number, [string, string]> = {
  89: ['E1', 'I1'], // W74 v W77
  90: ['A2', 'F1'], // W73 v W75
  91: ['C1', 'E2'], // W76 v W78
  92: ['A1', 'L1'], // W79 v W80
  93: ['K2', 'H1'], // W83 v W84
  94: ['D1', 'G1'], // W81 v W82
  95: ['J1', 'D2'], // W86 v W88
  96: ['B1', 'K1'], // W85 v W87
};
for (const [num, [h, a]] of Object.entries(R16_EXPECT)) {
  const m = findM(r2.bracket, Number(num));
  check(`Oitavas M${num} = ${h} v ${a}`, m.homeTeam?.id === h && m.awayTeam?.id === a);
}

// ── 4. Preenche Oitavas (mando vence) e confere as Quartas ────────────────────
for (const num of Object.keys(R16_EXPECT)) setResult(knockoutMatches, `M${num}`, 1, 0);
const r3 = buildStandings(all());
const QF_EXPECT: Record<number, [string, string]> = {
  97: ['E1', 'A2'],  // W89 v W90
  98: ['K2', 'D1'],  // W93 v W94
  99: ['C1', 'A1'],  // W91 v W92
  100: ['J1', 'B1'], // W95 v W96
};
for (const [num, [h, a]] of Object.entries(QF_EXPECT)) {
  const m = findM(r3.bracket, Number(num));
  check(`Quartas M${num} = ${h} v ${a}`, m.homeTeam?.id === h && m.awayTeam?.id === a);
}

// ── 5. Preenche Quartas e confere as Semis ────────────────────────────────────
for (const num of Object.keys(QF_EXPECT)) setResult(knockoutMatches, `M${num}`, 1, 0);
const r4 = buildStandings(all());
check('Semi M101 = W97 v W98 = E1 v K2', findM(r4.bracket, 101).homeTeam?.id === 'E1' && findM(r4.bracket, 101).awayTeam?.id === 'K2');
check('Semi M102 = W99 v W100 = C1 v J1', findM(r4.bracket, 102).homeTeam?.id === 'C1' && findM(r4.bracket, 102).awayTeam?.id === 'J1');

// ── 6. Semis: uma decidida nos pênaltis → Final + Disputa de 3º ───────────────
setResult(knockoutMatches, 'M101', 1, 1, 4, 2); // empate, E1 vence nos pênaltis
setResult(knockoutMatches, 'M102', 0, 2);        // J1 vence
const r5 = buildStandings(all());
const final = findM(r5.bracket, 104);   // W101 v W102
const bronze = findM(r5.bracket, 103);  // L101 v L102
check('Final = vencedor(pênaltis) E1 v J1', final.homeTeam?.id === 'E1' && final.awayTeam?.id === 'J1');
check('3º lugar = perdedores K2 v C1', bronze.homeTeam?.id === 'K2' && bronze.awayTeam?.id === 'C1');

console.log(`✅ Todas as ${passed} verificações passaram — alocação dos 3os (Anexo C) e preenchimento automático de todas as fases OK.`);
