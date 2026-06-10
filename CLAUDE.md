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
| `"1º Grupo A"` | 1º colocado do Grupo A (calculado dos jogos) |
| `"3º melhor (n)"` | n-ésimo melhor 3º colocado entre todos os grupos |
| `"Vencedor M49"` | Time que venceu a partida número 49 |
| `"Perdedor M77"` | Time que perdeu a partida 77 (disputa de 3º lugar) |

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
| `app/(tabs)/ranking.tsx` | Tabelas oficiais Copa 2026 (4 fases navegáveis) |
| `app/(tabs)/jogos.tsx` | Palpites com autosave + polling ao vivo |
| `app/(tabs)/ligas.tsx` | Ligas do bolão |
| `app/liga-ranking.tsx` | Ranking da liga + config de pontuação (dono) |
| `app/gerencia/index.tsx` | Admin: editar placares e status das partidas |

## Deploy

- **Frontend produção**: push na `main` → Vercel deploy automático
- **Preview**: qualquer branch/PR → Vercel gera URL de preview automaticamente
- **Backend**: push na `main` → Railway (build em `backend/`, ver `railway.json`)
- **Build web**: `npx expo export --platform web` → pasta `dist/`
