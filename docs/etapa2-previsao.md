# Etapa 2 — Previsão de Chaveamento (pontuação + comparação)

Estado após esta sessão: títulos de fase fixos, zoom no canvas (mobile) e
contador 32/32 já entregues. O que falta na Previsão está abaixo, em ordem de
prioridade.

## 0. URGENTE — Comparar previsões entre usuários (trava hoje 16h BRT)

**Objetivo:** depois que a Previsão fecha (28/06 16h BRT), o usuário acessa a aba
e compara, de forma fluida, a previsão dos outros com a sua.

**Regra de privacidade:** previsões dos outros só ficam visíveis **após a trava**
(`isBracketLocked()`), para ninguém copiar antes do fim.

### Backend
- `GET /api/bracket-prediction/all` (auth):
  - Antes da trava → `403` (ou retorna só a própria). Depois → lista
    `[{ user: { id, name }, picks }]` de todos os usuários.
  - Reusar `prisma.bracketPrediction.findMany({ include: { user: true } })`.
- `services/bracketPredictions.ts`: `getAllBracketPredictions()`.

### Frontend (`components/PrevisaoChaveamento.tsx`)
- **Seletor de usuário** (faixa de chips horizontais no topo): `Você · Fulano · …`.
  Selecionar um usuário re-renderiza o **mesmo** `BracketCanvas` com os `picks`
  dele em modo somente-leitura. Reuso total do layout já existente.
- **Modo "Comparar com a minha"** (toggle): para cada confronto, tinge o card
  conforme o pick do selecionado bate (verde) ou diverge (vermelho) do meu.
  Reaproveita o realce de `slotPicked`/`slotLooser` do `PredCard`.
- Opcional (fase 2.1): tocar num confronto abre um painel "quem previu quem"
  agregando o pick de todos os usuários naquele `matchId`.

**Deploy:** a feature precisa estar em produção (merge na `main` → Railway +
Vercel) antes das 16h para valer hoje. Se não der, fica para a próxima janela.

## 1. Pontuação da Previsão (escala por fase)

Pesos confirmados: **R32 +1 · Oitavas +2 · Quartas +3 · Semis +4 · 3º +4 ·
Final/Campeão +5**.

- `backend/config/bracketScoring.ts`: tabela de pesos por `round`.
- `computeBracketPoints(picks, bracket)`: compara `picks[matchId]` com o
  vencedor real (do `bracket` resolvido em `buildStandings`), somando o peso da
  fase de cada acerto. Cobrir 3º lugar (perdedor das semis) e campeão (Final).
- Expor pontos por usuário (no endpoint de ranking da previsão, abaixo).
- Testes em `backend/test/` cobrindo cada fase e o caso de pênaltis.

## 2. UI de pontos ao vivo na Previsão

- Mostrar os pontos **acima de cada confronto** (acerto = peso da fase,
  atualizando conforme os resultados oficiais saem).
- Total de pontos da minha previsão no topo da aba.

## 3. Ranking específico da Previsão

- Endpoint de ranking só da previsão (hoje a aba mostra o ranking geral de
  palpites). Ordena usuários por `computeBracketPoints`.
- Reusar o seletor de usuário da seção 0 (mesma lista).

## 4. Coluna "Previsão" no ranking da Liga

- `rankingController.getLeagueRanking` soma os pontos de previsão por usuário.
- `app/liga-ranking.tsx`: nova coluna "Previsão".

## Ordem de execução sugerida
0 (comparação, hoje) → 1 (pontuação) → 2 (pontos ao vivo) → 3 (ranking previsão)
→ 4 (coluna na liga). A seção 0 é independente das demais e destrava o uso de
hoje; 1–4 dependem da pontuação (seção 1).
