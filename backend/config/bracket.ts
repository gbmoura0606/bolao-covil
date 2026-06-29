/**
 * Trava DEFINITIVA da Previsão de chaveamento (server-side).
 *
 * Reaberta para ajustes e fechada de vez em 29/06/2026 às 14h BRT = 17h UTC
 * (jogo Brasil × Japão). Mantém o MESMO instante do frontend (constants/bracket.ts).
 *
 * Além da trava global, confrontos que já começaram (status ≠ OPEN) ficam
 * travados individualmente — enforcement em upsertBracketPrediction.
 */
export const BRACKET_LOCK_UTC_MS = Date.UTC(2026, 5, 29, 17, 0, 0);

export function isBracketLocked(now: number = Date.now()): boolean {
  return now >= BRACKET_LOCK_UTC_MS;
}

/** Total de jogos do mata-mata (M73–M104). */
export const KNOCKOUT_MATCH_COUNT = 32;
