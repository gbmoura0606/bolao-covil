# Bolão Covil — Guia de Arquitetura

## Fluxo de dados: REGRA PRINCIPAL

```
services/worldcup2026.ts   →   services/computed.ts   →   components
   (scores brutos)               (pure functions)           (render only)
```

**Nunca** calcular standings, rankings ou progressão de bracket diretamente em componentes.  
**Nunca** importar `worldcup2026.ts` em componentes para dados derivados — use `computed.ts`.

---

## Como atualizar um resultado de partida

1. Abra `services/worldcup2026.ts`
2. Encontre o `WCMatch` pelo id ou pelo par de times e data
3. Edite `homeScore` e `awayScore` (de `null` para o placar)
4. **Nada mais precisa ser feito** — standings, ranking de terceiros, classificação geral e bracket do mata-mata se atualizam automaticamente via `computed.ts`

Exemplo:
```ts
// antes
wm('A', 1, USA, URU, '2026-06-12', '18:00', 'MetLife Stadium', 'East Rutherford, NJ'),
// depois do jogo: USA 2 × 0 URU
// edite o objeto retornado: homeScore: 2, awayScore: 0
```

> **Atenção:** `wm()` é um helper que retorna o objeto — scores ficam como `null` por padrão.  
> Para inserir um resultado, adicione os campos diretamente após a chamada ou crie o objeto manualmente.

---

## Estrutura dos slots do mata-mata

Os `homeSlot`/`awaySlot` em `KNOCKOUT_MATCHES` são strings resolvidas por `computed.ts`:

| Formato | Resolve para |
|---|---|
| `"1º Grupo A"` | 1º colocado do Grupo A (calculado dos jogos) |
| `"3º melhor (n)"` | n-ésimo melhor 3º colocado entre todos os grupos |
| `"Vencedor M49"` | Time que venceu a partida número 49 |
| `"Perdedor M77"` | Time que perdeu a partida 77 (disputa de 3º lugar) |

---

## Serviços exportados por `computed.ts`

| Função | Retorna |
|---|---|
| `computeGroupStandings(group)` | `WCStanding[]` ordenado para um grupo |
| `computeAllGroupStandings()` | `Map<groupId, WCStanding[]>` para todos os 12 grupos |
| `computeThirdPlaceRanking()` | `WCStanding[]` dos 12 terceiros ordenados (top-8 classificam) |
| `computeOverallRanking()` | `RankedStanding[]` todos os 48 times ordenados globalmente |
| `computeKnockoutBracket()` | `ResolvedKnockoutMatch[]` com times reais onde possível |
| `getKnockoutByRound(round)` | Bracket filtrado por fase |
| `getClassificationCriteria()` | Critérios FIFA numerados |

---

## Telas principais

| Arquivo | Função |
|---|---|
| `app/landing.tsx` | Tela inicial — escolha entre Bolão e Gerência |
| `app/login.tsx` | Login do Bolão (mock: admin@bolao.com / 123456) |
| `app/(tabs)/ranking.tsx` | Tabelas oficiais Copa 2026 (4 fases navegáveis) |
| `app/(tabs)/jogos.tsx` | Palpites dos jogos |
| `app/(tabs)/ligas.tsx` | Ligas do bolão |

## Deploy

- **Produção**: push na `main` → Vercel deploy automático
- **Preview**: qualquer branch/PR → Vercel gera URL de preview automaticamente
- **Build**: `npx expo export --platform web` → pasta `dist/`
