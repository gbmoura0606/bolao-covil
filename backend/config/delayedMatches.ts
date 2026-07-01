/**
 * Exceção temporária à trava automática de palpites por horário.
 *
 * Regra padrão: palpites fecham quando o status sai de OPEN OU quando o
 * horário agendado do jogo chega (hasKickedOff) — o que vier primeiro. Isso
 * protege contra a gerência esquecer de fechar a partida manualmente.
 *
 * Quando um jogo atrasa de verdade (ex.: clima) o horário agendado já passou
 * mas a bola não rolou — nesse caso o time do jogo entra aqui para IGNORAR o
 * fallback por horário; os palpites continuam abertos até a gerência mudar o
 * status manualmente (o que também revela os palpites dos outros, como de
 * costume). Remover a entrada assim que o jogo realmente começar/status mudar.
 *
 * Pares de country code (Team.country), ordem não importa.
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
