/**
 * Os horários das partidas no banco estão gravados como horário de Brasília
 * com sufixo "Z" (ex: 2026-06-13T19:00:00.000Z = 19:00 em Brasília).
 * Para comparar com o relógio real do servidor (UTC), soma-se o offset.
 */
export const BRT_UTC_OFFSET_MS = 3 * 60 * 60 * 1000;

/** Instante UTC real do pontapé inicial de uma partida. */
export function kickoffUtc(matchDate: Date): Date {
  return new Date(matchDate.getTime() + BRT_UTC_OFFSET_MS);
}

/** A partida já começou? */
export function hasKickedOff(matchDate: Date, now: Date = new Date()): boolean {
  return now.getTime() >= kickoffUtc(matchDate).getTime();
}

/**
 * "Agora" expresso na mesma convenção do banco (Brasília gravado como Z) —
 * útil em filtros Prisma: matchDate <= brtWallClockNow() ⇔ partida já começou.
 */
export function brtWallClockNow(): Date {
  return new Date(Date.now() - BRT_UTC_OFFSET_MS);
}
