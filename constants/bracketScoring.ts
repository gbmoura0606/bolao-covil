/**
 * Espelho LEVE da pontuação da Previsão, só para exibir os pontos ao vivo na
 * tela (acima de cada confronto e total). A FONTE DE VERDADE dos rankings é o
 * backend (backend/config/bracketScoring.ts) — mantenha os pesos em sincronia.
 */
import type { BracketMatch } from '@/services/standings';

export const BRACKET_WEIGHTS: Record<string, number> = {
  r32: 1, r16: 2, qf: 3, sf: 4, terceiro: 4, final: 5,
};

/** Vencedor de um confronto JÁ ENCERRADO (pênaltis decidem empate) ou null. */
export function bracketWinnerId(m: BracketMatch): string | null {
  if (m.status !== 'FINISHED') return null;
  if (m.homeScore === null || m.awayScore === null) return null;
  let homeWins: boolean;
  if (m.homeScore > m.awayScore) homeWins = true;
  else if (m.awayScore > m.homeScore) homeWins = false;
  else if (m.homePenalty !== null && m.awayPenalty !== null && m.homePenalty !== m.awayPenalty) {
    homeWins = m.homePenalty > m.awayPenalty;
  } else return null;
  return (homeWins ? m.homeTeam?.id : m.awayTeam?.id) ?? null;
}

/** Pontos que um pick (teamId que avança) rende neste confronto, se encerrado. */
export function matchPoints(m: BracketMatch, pickedTeamId: string | null | undefined): number {
  if (!pickedTeamId) return 0;
  const winner = bracketWinnerId(m);
  if (!winner || winner !== pickedTeamId) return 0;
  return BRACKET_WEIGHTS[m.round] ?? 0;
}

/** Total de pontos de uma previsão contra o bracket resolvido. */
export function totalBracketPoints(
  picks: Record<string, string | null>,
  bracket: BracketMatch[],
): number {
  let total = 0;
  for (const m of bracket) total += matchPoints(m, picks[m.id]);
  return total;
}
