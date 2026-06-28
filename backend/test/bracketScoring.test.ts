/**
 * Teste da pontuação da Previsão (escala por fase).
 * Não depende do banco — monta um bracket sintético e confere computeBracketPoints.
 *
 * Rodar:  cd backend && npx ts-node test/bracketScoring.test.ts
 */
import assert from 'assert';
import {
  computeBracketPoints,
  bracketWinnerId,
  BRACKET_WEIGHTS,
  type ScorableMatch,
} from '../config/bracketScoring';

let passed = 0;
const check = (label: string, cond: boolean): void => {
  assert.ok(cond, `FALHOU: ${label}`);
  passed++;
};

function m(
  id: string,
  round: string,
  status: string,
  hs: number | null,
  as_: number | null,
  hp: number | null = null,
  ap: number | null = null,
): ScorableMatch {
  return {
    id, round, status,
    homeTeam: { id: `${id}-H` }, awayTeam: { id: `${id}-A` },
    homeScore: hs, awayScore: as_, homePenalty: hp, awayPenalty: ap,
  };
}

// ── Vencedor por placar e por pênaltis ────────────────────────────────────────
check('vencedor: mando por placar', bracketWinnerId(m('x', 'r32', 'FINISHED', 2, 1)) === 'x-H');
check('vencedor: visitante por placar', bracketWinnerId(m('x', 'r32', 'FINISHED', 0, 3)) === 'x-A');
check('vencedor: pênaltis decidem empate', bracketWinnerId(m('x', 'sf', 'FINISHED', 1, 1, 4, 2)) === 'x-H');
check('sem vencedor: não finalizado', bracketWinnerId(m('x', 'r32', 'CLOSED', 2, 1)) === null);
check('sem vencedor: empate sem pênaltis', bracketWinnerId(m('x', 'r32', 'FINISHED', 1, 1)) === null);
check('sem vencedor: sem placar', bracketWinnerId(m('x', 'r32', 'FINISHED', null, null)) === null);

// ── Pontuação por fase ────────────────────────────────────────────────────────
const bracket: ScorableMatch[] = [
  m('r32a', 'r32', 'FINISHED', 2, 0),       // vence H (+1 se acertar)
  m('r16a', 'r16', 'FINISHED', 0, 1),       // vence A (+2)
  m('qfa',  'qf',  'FINISHED', 3, 3, 5, 4), // vence H nos pênaltis (+3)
  m('sfa',  'sf',  'FINISHED', 1, 0),       // vence H (+4)
  m('terc', 'terceiro', 'FINISHED', 2, 1),  // vence H (+4)
  m('fin',  'final', 'FINISHED', 0, 2),     // vence A → campeão (+5)
  m('open', 'r16', 'CLOSED', 1, 0),         // não finalizado → ignorado
];

// Acerta tudo o que está decidido
const allRight = {
  r32a: 'r32a-H', r16a: 'r16a-A', qfa: 'qfa-H', sfa: 'sfa-H',
  terc: 'terc-H', fin: 'fin-A', open: 'open-H',
};
const r1 = computeBracketPoints(allRight, bracket);
check('acertando tudo soma 1+2+3+4+4+5 = 19', r1.total === 19);
check('jogo não finalizado não pontua', r1.perMatch['open'] === undefined);
check('perMatch da final = 5', r1.perMatch['fin'] === 5);

// Erra a final e a semi
const someWrong = { ...allRight, fin: 'fin-H', sfa: 'sfa-A' };
const r2 = computeBracketPoints(someWrong, bracket);
check('errando final(5) e semi(4): 19-9 = 10', r2.total === 10);
check('perMatch de erro = 0', r2.perMatch['fin'] === 0 && r2.perMatch['sfa'] === 0);

// Previsão vazia = 0
check('previsão vazia pontua 0', computeBracketPoints({}, bracket).total === 0);

// Pesos conferem com o combinado
check('pesos por fase', BRACKET_WEIGHTS.r32 === 1 && BRACKET_WEIGHTS.r16 === 2 && BRACKET_WEIGHTS.qf === 3
  && BRACKET_WEIGHTS.sf === 4 && BRACKET_WEIGHTS.terceiro === 4 && BRACKET_WEIGHTS.final === 5);

console.log(`✅ Todas as ${passed} verificações de pontuação da Previsão passaram.`);
