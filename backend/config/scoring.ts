/**
 * Regras de pontuação do bolão.
 * ➜ Para alterar os pesos da sua liga, edite os valores em SCORING e reinicie o servidor.
 *
 * Atenção: pontos já calculados em partidas FINISHED não são recalculados retroativamente.
 * Para recalcular, defina o match como OPEN → edite resultado → defina como FINISHED novamente.
 */
export const SCORING = {
  /** Acertou o placar exato (ex: palpite 2-1 = resultado 2-1) */
  exactScore: 3,
  /** Acertou apenas o resultado — vitória, empate ou derrota — sem acertar o placar */
  correctResult: 1,
};

export function computePoints(
  predHome: number,
  predAway: number,
  realHome: number,
  realAway: number,
): number {
  if (predHome === realHome && predAway === realAway) return SCORING.exactScore;
  if (Math.sign(predHome - predAway) === Math.sign(realHome - realAway)) return SCORING.correctResult;
  return 0;
}
