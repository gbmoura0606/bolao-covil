/**
 * Trava DEFINITIVA da Previsão de chaveamento.
 *
 * Reaberta para ajustes e fechada de vez em 29/06/2026 às 14h BRT
 * (jogo Brasil × Japão). 14h BRT (UTC-3) = 17h UTC.
 *
 * Observação: confrontos que JÁ COMEÇARAM (status ≠ OPEN, ex.: jogo do Canadá)
 * ficam travados individualmente mesmo com a previsão reaberta — ver
 * isMatchPredictionOpen / enforcement no backend.
 */
export const BRACKET_LOCK_UTC_MS = Date.UTC(2026, 5, 29, 17, 0, 0);
export const BRACKET_LOCK_LABEL = '29/06 às 14h';

/**
 * Total de jogos do mata-mata (M73–M104): R32(16)+Oitavas(8)+Quartas(4)+
 * Semis(2)+3º(1)+Final(1). Usado para sinalizar previsões incompletas sem
 * precisar carregar o bracket inteiro.
 */
export const KNOCKOUT_MATCH_COUNT = 32;

export function isBracketLocked(now: number = Date.now()): boolean {
  return now >= BRACKET_LOCK_UTC_MS;
}
