/**
 * Espelho do backend/config/delayedMatches.ts — jogos atrasados de verdade
 * (ex.: clima) cujo horário agendado já passou mas o palpite deve continuar
 * aberto na UI. Mantenha em sincronia com o backend.
 */
export const DELAYED_MATCH_TEAM_PAIRS: Array<[string, string]> = [
  ['mex', 'ecu'], // México x Equador — atrasado por clima
];

export function isDelayedMatch(
  homeCountry: string | null | undefined,
  awayCountry: string | null | undefined,
): boolean {
  if (!homeCountry || !awayCountry) return false;
  return DELAYED_MATCH_TEAM_PAIRS.some(
    ([a, b]) =>
      (homeCountry === a && awayCountry === b) ||
      (homeCountry === b && awayCountry === a),
  );
}
