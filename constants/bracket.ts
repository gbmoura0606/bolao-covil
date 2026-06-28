/**
 * Trava da Previsão de chaveamento.
 *
 * A previsão fecha — para sempre — no início do 1º jogo do mata-mata:
 * M73 (2º Grupo A × 2º Grupo B), 28/06/2026 às 16h BRT.
 * 16h BRT (UTC-3) = 19h UTC.
 */
export const BRACKET_LOCK_UTC_MS = Date.UTC(2026, 5, 28, 19, 0, 0);
export const BRACKET_LOCK_LABEL = '28/06 às 16h';

/**
 * Total de jogos do mata-mata (M73–M104): R32(16)+Oitavas(8)+Quartas(4)+
 * Semis(2)+3º(1)+Final(1). Usado para sinalizar previsões incompletas sem
 * precisar carregar o bracket inteiro.
 */
export const KNOCKOUT_MATCH_COUNT = 32;

export function isBracketLocked(now: number = Date.now()): boolean {
  return now >= BRACKET_LOCK_UTC_MS;
}
