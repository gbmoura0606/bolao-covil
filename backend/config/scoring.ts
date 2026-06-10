/**
 * Regras de pontuação global do bolão (ranking geral).
 * Hierarquia: placar exato > saldo de gols (com sinal) > vencedor/empate.
 * Mesmos valores-padrão das ligas (League.scoreExact/scoreGoalDiff/scoreResult).
 *
 * Os pontos das partidas FINISHED são recalculados a cada start do servidor
 * (recalculateFinishedPoints em src/index.ts), então alterar estes valores
 * reprocessa todo o histórico automaticamente no próximo deploy.
 */
export const SCORING = {
  /** Acertou o placar exato (ex: palpite 2-1 = resultado 2-1) */
  exactScore: 5,
  /** Acertou a diferença de gols com sinal (ex: palpite 2-0, resultado 3-1) */
  goalDiff: 3,
  /** Acertou apenas o resultado — vitória, empate ou derrota */
  correctResult: 1,
};

export function computePoints(
  predHome: number,
  predAway: number,
  realHome: number,
  realAway: number,
): number {
  if (predHome === realHome && predAway === realAway) return SCORING.exactScore;
  if (predHome - predAway === realHome - realAway) return SCORING.goalDiff;
  if (Math.sign(predHome - predAway) === Math.sign(realHome - realAway)) return SCORING.correctResult;
  return 0;
}
