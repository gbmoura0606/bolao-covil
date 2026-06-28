/**
 * Trava da Previsão de chaveamento (server-side).
 *
 * A previsão fecha — para sempre — no início do 1º jogo do mata-mata:
 * M73 (2º Grupo A × 2º Grupo B), 28/06/2026 às 16h BRT = 19h UTC.
 * Mantém o MESMO instante usado no frontend (constants/bracket.ts).
 */
export const BRACKET_LOCK_UTC_MS = Date.UTC(2026, 5, 28, 19, 0, 0);

export function isBracketLocked(now: number = Date.now()): boolean {
  return now >= BRACKET_LOCK_UTC_MS;
}

/** Total de jogos do mata-mata (M73–M104). */
export const KNOCKOUT_MATCH_COUNT = 32;
