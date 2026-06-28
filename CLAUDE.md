# Bolão Covil — Guia de Arquitetura

## Fluxo de dados: REGRA PRINCIPAL

```
PostgreSQL (Railway)  →  backend/controllers/*.ts  →  services/*.ts (axios)  →  components
     (dados brutos)         (cálculos no servidor)       (fetch tipado)          (render only)
```

**Nunca** calcular standings, rankings ou progressão de bracket em componentes.
Todo cálculo derivado (classificação, terceiros, bracket, pontuação) vive no backend:

| Cálculo | Onde |
|---|---|
| Standings de grupo, terceiros, geral, bracket | `backend/controllers/standingsController.ts` (`GET /api/standings`) |
| Pontos globais do palpite (3/1) | `backend/config/scoring.ts`, aplicado em `matchesController.updateMatchScore` ao finalizar partida |
| Pontuação por liga (exato > saldo > resultado) | `backend/controllers/rankingController.ts` (`GET /api/ranking/league/:id`), on-the-fly com config da liga |

---

## Como atualizar um resultado de partida

Pela tela **Gerência** (`app/gerencia/index.tsx`) → tocar na partida → editar placar e status.
Isso chama `PATCH /api/matches/:id/score`. Ao marcar `FINISHED`, os pontos de todos os
palpites da partida são recalculados automaticamente.

Ciclo de status: `OPEN` (aceita palpites) → `CLOSED` (ao vivo, palpites bloqueados) → `FINISHED`.
A transição é **manual** — não há fechamento automático no horário do jogo.

Os dados-semente (48 seleções, 72 jogos de grupo, 32 de mata-mata) estão em
`backend/seed/worldcup.ts` e são upsertados a cada start do servidor.

---

## Estrutura dos slots do mata-mata

Os `homeSlot`/`awaySlot` das partidas de mata-mata são strings resolvidas por
`standingsController.resolveSlot()`:

| Formato | Resolve para |
|---|---|
| `"1º Grupo A"` / `"2º Grupo A"` | 1º/2º colocado do Grupo A (calculado dos jogos) |
| `"3º (A/B/C/D/F)"` | 3º colocado alocado pelo **Anexo C** — os grupos entre parênteses são o rótulo de fallback; a alocação exata vem da tabela oficial |
| `"Vencedor M89"` | Time que venceu a partida número 89 (pênaltis decidem empate no mata-mata) |
| `"Perdedor M101"` | Time que perdeu a partida 101 (alimenta a disputa de 3º lugar) |

### Alocação dos 3os colocados (Anexo C do regulamento)

Os 8 melhores 3os colocados (de 12 grupos) avançam à Rodada de 32. **Qual** 3º
enfrenta **qual** vencedor de grupo depende do conjunto exato dos 8 grupos
classificados — são C(12,8) = **495 combinações**, tabeladas no Anexo C do
regulamento FIFA, codificadas em `backend/config/thirdPlaceAllocation.ts`
(gerado a partir do PDF, não editar à mão).

`standingsController` só resolve esses slots quando a fase de grupos termina
(12 grupos, todos os jogos com placar): pega os 8 melhores 3os, monta a chave
(letras dos grupos em ordem), consulta `allocateThirds()` e cruza com o grupo do
vencedor adversário de cada confronto. Antes disso o slot exibe o rótulo de
grupos possíveis. Numeração (M73–M104), confrontos, datas, horários (BRT = ET+1)
e estádios seguem o *FWC26 Match Schedule* oficial.

---

## Backend (Express + Prisma + PostgreSQL no Railway)

| Rota | Função |
|---|---|
| `POST /api/auth/login` | Login por nickname (case-insensitive), JWT 7d |
| `GET /api/matches` | Lista partidas com times |
| `PATCH /api/matches/:id/score` | Atualiza placar/status + recalcula pontos |
| `PUT /api/predictions/match/:matchId` | Upsert de palpite (autosave) |
| `GET /api/standings` | Grupos, terceiros, geral e bracket resolvido |
| `GET /api/ranking` · `/league/:id` | Ranking global · por liga (config própria) |
| `PATCH /api/leagues/:id/scoring` | Dono da liga define pesos da pontuação |

Schema: `backend/prisma/schema.prisma`. Deploy aplica schema via `prisma db push`.

## Telas principais

| Arquivo | Função |
|---|---|
| `app/landing.tsx` | Tela inicial — escolha entre Bolão e Gerência |
| `app/login.tsx` | Login do Bolão (nickname + senha, backend real) |
| `app/(tabs)/ranking.tsx` | Tabelas oficiais Copa 2026 — 4 abas: Critérios · 3os Lugares · Fase de Grupos · Mata-Mata (resultados oficiais atualizados pelo ADM) |
| `app/(tabs)/jogos.tsx` | Palpites com autosave + polling ao vivo |
| `app/(tabs)/ligas.tsx` | Ligas do bolão |
| `app/liga-ranking.tsx` | Ranking da liga + config de pontuação (dono) |
| `app/gerencia/index.tsx` | Admin: editar placares e status das partidas |

## Deploy

- **Frontend produção**: push na `main` → Vercel deploy automático
- **Preview**: qualquer branch/PR → Vercel gera URL de preview automaticamente
- **Backend**: push na `main` → Railway (build em `backend/`, ver `railway.json`)
- **Build web**: `npx expo export --platform web` → pasta `dist/`

---

## Previsão de chaveamento (mata-mata) — estado e TODO

**Já implementado:**
- Modelo `BracketPrediction` (1 por usuário, `picks` JSON `{ [matchId]: teamId|null }`).
- Tela `components/PrevisaoChaveamento.tsx` (aba **Palpites › Previsão**): canvas do
  bracket; usuário escolhe quem avança até a final; autosave; resolve 3º lugar
  (perdedores das semis). Layout em `components/bracketLayout.ts` (ordem da árvore),
  canvas responsivo em `components/BracketCanvas.tsx`.
- **Trava**: `constants/bracket.ts` (front) e `backend/config/bracket.ts` (back) —
  `28/06/2026 16h BRT = 19h UTC` (início do M73). Depois disso `PUT /api/bracket-prediction`
  responde 403 e a tela fica somente-leitura.
- Rodada de 32 aberta nos **palpites** de placar: `matchesController.listMatches`
  resolve os times do mata-mata via `buildStandings` (mesmo fluxo dos grupos).

**TODO — pontuação da Previsão (próxima sessão):**
- Pontuação por **acerto de quem avança em cada confronto**, escalando por fase
  (confirmado pelo dono): **R32 +1 · Oitavas +2 · Quartas +3 · Semi +4 · 3º +4 · Final/Campeão +5**.
  Comparar `picks[matchId]` com o vencedor real (do `bracket` resolvido em `buildStandings`).
- Backend: função `computeBracketPoints(picks, bracket)` + expor pontos por usuário.
- UI: pontos **acima de cada confronto** na Previsão (ao vivo conforme resultados).
- **Ranking parcial específico da Previsão** (hoje a aba mostra o ranking de palpites geral).
- **Coluna "Previsão"** no ranking da Liga (`rankingController.getLeagueRanking` + `app/liga-ranking.tsx`).
- "Ver palpites do grupo" por confronto (quem cada um previu) — novo endpoint de agregação.
- Testes em `backend/test/` cobrindo a pontuação por fase.
