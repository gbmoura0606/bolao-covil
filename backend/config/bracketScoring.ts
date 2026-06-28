/**
 * Pontuação da Previsão de Chaveamento (mata-mata).
 *
 * Escala por fase (confirmada pelo dono): acerta-se QUEM AVANÇA em cada
 * confronto; o peso cresce com a importância da fase. O campeão (Final) e a
 * disputa de 3º lugar pontuam pelo vencedor do respectivo jogo.
 *
 * Esta é a FONTE ÚNICA de verdade da pontuação (regra do projeto: cálculo no
 * servidor). O front tem um espelho leve só para exibir os pontos ao vivo.
 */
export const BRACKET_WEIGHTS: Record<string, number> = {
  r32: 1,      // Rodada de 32
  r16: 2,      // Oitavas
  qf: 3,       // Quartas
  sf: 4,       // Semis
  terceiro: 4, // Disputa de 3º lugar
  final: 5,    // Final / Campeão
};

export interface ScorableMatch {
  id: string;
  round: string;
  status: string;
  homeTeam: { id: string } | null;
  awayTeam: { id: string } | null;
  homeScore: number | null;
  awayScore: number | null;
  homePenalty: number | null;
  awayPenalty: number | null;
}

/**
 * Time vencedor de um confronto JÁ ENCERRADO (pênaltis decidem empate). Retorna
 * null se ainda não há vencedor definido (não finalizado, sem placar ou empate
 * sem pênaltis).
 */
export function bracketWinnerId(m: ScorableMatch): string | null {
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

/**
 * Soma a pontuação de uma previsão (picks: matchId -> teamId que avança)
 * contra o bracket resolvido. Considera apenas confrontos encerrados.
 */
export function computeBracketPoints(
  picks: Record<string, string | null>,
  bracket: ScorableMatch[],
): { total: number; perMatch: Record<string, number> } {
  let total = 0;
  const perMatch: Record<string, number> = {};
  for (const m of bracket) {
    const winner = bracketWinnerId(m);
    if (!winner) continue;
    const weight = BRACKET_WEIGHTS[m.round] ?? 0;
    const correct = picks[m.id] === winner;
    perMatch[m.id] = correct ? weight : 0;
    if (correct) total += weight;
  }
  return { total, perMatch };
}
