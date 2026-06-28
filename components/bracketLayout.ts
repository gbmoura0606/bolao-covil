/**
 * Layout do chaveamento (mata-mata) — fonte ÚNICA compartilhada entre
 * a aba Tabelas › Mata-Mata (ranking.tsx) e Palpites › Previsão
 * (PrevisaoChaveamento.tsx).
 *
 * A ordem vertical dos cards segue a ÁRVORE do chaveamento (não a ordem
 * numérica dos jogos), derivada de FEEDS por uma travessia em-ordem a partir
 * da final. Assim cada confronto fica exatamente entre os dois que o alimentam
 * e as linhas de conexão nunca se cruzam.
 */
import type { BracketMatch } from '@/services/standings';

// ── Dimensões do canvas ─────────────────────────────────────────────────────
export const CW = 160;        // largura do card
export const CH = 76;         // altura do card (cabeçalho + 2 times com placar)
export const CGAP = 52;       // espaço horizontal entre colunas
export const PAD = 20;        // padding externo do canvas
export const LABEL_H = 22;    // altura do rótulo da fase
export const SLOT_H = CH + 14; // altura de cada slot (card + respiro)

// ── Estrutura do chaveamento oficial (FWC26) ─────────────────────────────────
export const COL_ORDER = ['r32', 'r16', 'qf', 'sf', 'final'] as const;
export type MainRound = typeof COL_ORDER[number];

export const COL_LABELS: Record<MainRound, string> = {
  r32: 'Rodada de 32', r16: 'Oitavas', qf: 'Quartas', sf: 'Semis', final: 'Final',
};

export const PHASE_SLOTS: Record<string, number> = {
  r32: 16, r16: 8, qf: 4, sf: 2, final: 1,
};

// Quem alimenta quem: [srcExtId, dstExtId, 'top'|'bot']
export const FEEDS: Array<[string, string, 'top' | 'bot']> = [
  // R32 → Oitavas
  ['M74', 'M89', 'top'], ['M77', 'M89', 'bot'],
  ['M73', 'M90', 'top'], ['M75', 'M90', 'bot'],
  ['M76', 'M91', 'top'], ['M78', 'M91', 'bot'],
  ['M79', 'M92', 'top'], ['M80', 'M92', 'bot'],
  ['M83', 'M93', 'top'], ['M84', 'M93', 'bot'],
  ['M81', 'M94', 'top'], ['M82', 'M94', 'bot'],
  ['M86', 'M95', 'top'], ['M88', 'M95', 'bot'],
  ['M85', 'M96', 'top'], ['M87', 'M96', 'bot'],
  // Oitavas → Quartas
  ['M89', 'M97', 'top'], ['M90', 'M97', 'bot'],
  ['M93', 'M98', 'top'], ['M94', 'M98', 'bot'],
  ['M91', 'M99', 'top'], ['M92', 'M99', 'bot'],
  ['M95', 'M100', 'top'], ['M96', 'M100', 'bot'],
  // Quartas → Semis
  ['M97', 'M101', 'top'], ['M98', 'M101', 'bot'],
  ['M99', 'M102', 'top'], ['M100', 'M102', 'bot'],
  // Semis → Final
  ['M101', 'M104', 'top'], ['M102', 'M104', 'bot'],
];

// Semifinais (perdedores) → disputa de 3º lugar
export const THIRD_FEEDS: Array<[string, 'top' | 'bot']> = [
  ['M101', 'top'], ['M102', 'bot'],
];

// ── SLOT_INDEX derivado da árvore ───────────────────────────────────────────
// Travessia em-ordem (sub-árvore superior → nó → sub-árvore inferior) a partir
// da final. A profundidade mapeia a fase (árvore perfeitamente balanceada).
const DEPTH_ROUND: MainRound[] = ['final', 'sf', 'qf', 'r16', 'r32'];

function computeSlotIndex(): Record<string, number> {
  const orderByRound: Record<string, string[]> = {};
  function dfs(ext: string, depth: number): void {
    const round = DEPTH_ROUND[depth];
    const top = FEEDS.find((f) => f[1] === ext && f[2] === 'top')?.[0];
    const bot = FEEDS.find((f) => f[1] === ext && f[2] === 'bot')?.[0];
    if (top) dfs(top, depth + 1);
    (orderByRound[round] ??= []).push(ext);
    if (bot) dfs(bot, depth + 1);
  }
  dfs('M104', 0);

  const idx: Record<string, number> = {};
  for (const round of Object.keys(orderByRound)) {
    orderByRound[round].forEach((ext, i) => { idx[ext] = i; });
  }
  return idx;
}

export const SLOT_INDEX: Record<string, number> = computeSlotIndex();

// ── Cálculo de posições ─────────────────────────────────────────────────────
export interface CardLayout { x: number; y: number; match: BracketMatch; }
export interface LineSegment { x1: number; y1: number; x2: number; y2: number; xMid: number; }

export function buildBracketLayout(bracket: BracketMatch[], opts?: { width?: number }): {
  cards: CardLayout[];
  lines: LineSegment[];
  thirdCard: CardLayout | null;
  canvasW: number;
  canvasH: number;
  colXs: number[];
} {
  const maxSlots = 16; // a R32 define a altura total
  const totalH = maxSlots * SLOT_H;
  const canvasH = LABEL_H + PAD + totalH + PAD;

  const cols = COL_ORDER.length;
  const baseW = PAD + cols * (CW + CGAP) + PAD;
  // Se há largura disponível maior que o mínimo (PC), espalha as colunas para
  // ocupar toda a largura; senão usa o gap padrão (canvas livre no celular).
  let gap = CGAP;
  let canvasW = baseW;
  if (opts?.width && opts.width > baseW && cols > 1) {
    canvasW = opts.width;
    gap = (canvasW - PAD * 2 - cols * CW) / (cols - 1);
  }

  const colX = (colIdx: number): number => PAD + colIdx * (CW + gap);
  const colXs = COL_ORDER.map((_, i) => colX(i));

  // Centro Y de um slot dentro de uma fase, relativo ao canvas
  function centerY(round: string, slotIdx: number): number {
    const slots = PHASE_SLOTS[round] ?? 1;
    const groupSize = maxSlots / slots;
    const topSlot = slotIdx * groupSize;
    const botSlot = topSlot + groupSize - 1;
    const topY = LABEL_H + PAD + topSlot * SLOT_H + CH / 2;
    const botY = LABEL_H + PAD + botSlot * SLOT_H + CH / 2;
    return (topY + botY) / 2;
  }

  const cards: CardLayout[] = [];
  const byExtId = new Map<string, CardLayout>();

  for (const m of bracket) {
    if (m.round === 'terceiro') continue;
    const extId = m.externalId ?? '';
    const slotIdx = SLOT_INDEX[extId] ?? 0;
    const colIdx = COL_ORDER.indexOf(m.round as MainRound);
    if (colIdx < 0) continue;
    const cy = centerY(m.round, slotIdx);
    const layout: CardLayout = { x: colX(colIdx), y: cy - CH / 2, match: m };
    cards.push(layout);
    byExtId.set(extId, layout);
  }

  // 3º lugar: logo abaixo da final
  let thirdCard: CardLayout | null = null;
  const thirdMatch = bracket.find((m) => m.round === 'terceiro');
  const finalCard = cards.find((c) => c.match.round === 'final');
  if (thirdMatch) {
    const thirdY = finalCard ? finalCard.y + CH + 32 : centerY('sf', 0);
    thirdCard = { x: colX(COL_ORDER.indexOf('final')), y: thirdY, match: thirdMatch };
  }

  // Linhas de conexão (forquilha: src → meio → dst)
  const lines: LineSegment[] = [];
  function addLine(srcExtId: string, dst: CardLayout, side: 'top' | 'bot'): void {
    const src = byExtId.get(srcExtId);
    if (!src) return;
    const x1 = src.x + CW;
    const y1 = src.y + CH / 2;
    const x2 = dst.x;
    const y2 = side === 'top' ? dst.y + CH * 0.27 : dst.y + CH * 0.73;
    lines.push({ x1, y1, x2, y2, xMid: x1 + CGAP / 2 });
  }

  for (const [src, dst, side] of FEEDS) {
    const dstL = byExtId.get(dst);
    if (dstL) addLine(src, dstL, side);
  }
  if (thirdCard) {
    for (const [src, side] of THIRD_FEEDS) {
      const srcL = byExtId.get(src);
      if (!srcL) continue;
      const x1 = srcL.x + CW;
      const y1 = srcL.y + CH / 2;
      const x2 = thirdCard.x;
      const y2 = side === 'top' ? thirdCard.y + CH * 0.27 : thirdCard.y + CH * 0.73;
      lines.push({ x1, y1, x2, y2, xMid: x1 + CGAP / 2 });
    }
  }

  return { cards, lines, thirdCard, canvasW, canvasH, colXs };
}
