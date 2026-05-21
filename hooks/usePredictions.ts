import { useState, useCallback, useRef, useEffect } from 'react';
import { getUserPredictions, upsertPrediction } from '@/services/predictions';

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export interface PredictionEdit {
  homeScore: string;           // valor atual no input (string controlada)
  awayScore: string;
  saveStatus: SaveStatus;
  persistedId?: string;        // ID do palpite no banco
  persistedHomeScore?: number; // último valor salvo com sucesso
  persistedAwayScore?: number;
  points?: number;             // pontos recebidos (partida encerrada)
  savedAt?: string;            // ISO timestamp do último save bem-sucedido
  errorMsg?: string;
}

type PredictionMap = Record<string, PredictionEdit>;

export interface UsePredictionsResult {
  predictions: PredictionMap;
  isLoadingPredictions: boolean;
  updateScore: (matchId: string, team: 'home' | 'away', value: string) => void;
  retryPrediction: (matchId: string) => void;
  refreshPredictions: () => Promise<void>;
}

const AUTOSAVE_MS = 700;

function empty(): PredictionEdit {
  return { homeScore: '', awayScore: '', saveStatus: 'idle' };
}

function isValidScore(s: string): boolean {
  if (s === '') return false;
  const n = parseInt(s, 10);
  return !isNaN(n) && n >= 0 && n <= 9;
}

function doSave(
  matchId: string,
  home: string,
  away: string,
  setPred: React.Dispatch<React.SetStateAction<PredictionMap>>,
): void {
  if (!isValidScore(home) || !isValidScore(away)) return;
  const h = parseInt(home, 10);
  const a = parseInt(away, 10);

  setPred((prev) => ({
    ...prev,
    [matchId]: { ...(prev[matchId] ?? empty()), saveStatus: 'saving' },
  }));

  void upsertPrediction(matchId, h, a)
    .then((saved) => {
      setPred((prev) => ({
        ...prev,
        [matchId]: {
          ...(prev[matchId] ?? empty()),
          saveStatus: 'saved',
          persistedId: saved.id,
          persistedHomeScore: h,
          persistedAwayScore: a,
          savedAt: new Date().toISOString(),
          errorMsg: undefined,
        },
      }));
    })
    .catch(() => {
      setPred((prev) => ({
        ...prev,
        [matchId]: {
          ...(prev[matchId] ?? empty()),
          saveStatus: 'error',
          errorMsg: 'Falha ao salvar',
        },
      }));
    });
}

export function usePredictions(): UsePredictionsResult {
  const [predictions, setPredictions] = useState<PredictionMap>({});
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(true);

  // Timers de debounce por partida
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Valores mais recentes digitados — lidos nos closures do setTimeout
  const pendingValues = useRef<Record<string, { home: string; away: string }>>({});

  const loadPredictions = useCallback(async (): Promise<void> => {
    try {
      const data = await getUserPredictions();
      setPredictions((prev) => {
        const next: PredictionMap = { ...prev };
        for (const p of data) {
          const cur = next[p.matchId];
          // Preserva edições em andamento
          const isEditing = cur?.saveStatus === 'dirty' || cur?.saveStatus === 'saving';
          next[p.matchId] = {
            homeScore: isEditing ? cur.homeScore : String(p.homeScore),
            awayScore: isEditing ? cur.awayScore : String(p.awayScore),
            saveStatus: isEditing ? cur.saveStatus : 'saved',
            persistedId: p.id,
            persistedHomeScore: p.homeScore,
            persistedAwayScore: p.awayScore,
            points: p.points ?? undefined,
            savedAt: isEditing ? cur.savedAt : cur?.savedAt,
          };
        }
        return next;
      });
    } catch {
      // Falha silenciosa — palpites aparecerão vazios, usuário pode apostar normalmente
    } finally {
      setIsLoadingPredictions(false);
    }
  }, []);

  useEffect(() => {
    void loadPredictions();
    return () => {
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, [loadPredictions]);

  const updateScore = useCallback(
    (matchId: string, team: 'home' | 'away', value: string): void => {
      const cleaned = value.replace(/[^0-9]/g, '').slice(0, 1);

      // Atualiza estado e sincroniza ref dentro do updater (execução síncrona)
      setPredictions((prev) => {
        const cur = prev[matchId] ?? empty();
        const newHome = team === 'home' ? cleaned : cur.homeScore;
        const newAway = team === 'away' ? cleaned : cur.awayScore;
        pendingValues.current[matchId] = { home: newHome, away: newAway };
        return {
          ...prev,
          [matchId]: { ...cur, homeScore: newHome, awayScore: newAway, saveStatus: 'dirty' },
        };
      });

      // Debounce: cancela timer anterior e agenda novo save
      if (timers.current[matchId]) clearTimeout(timers.current[matchId]);
      timers.current[matchId] = setTimeout(() => {
        const v = pendingValues.current[matchId];
        if (v) doSave(matchId, v.home, v.away, setPredictions);
      }, AUTOSAVE_MS);
    },
    [],
  );

  const retryPrediction = useCallback((matchId: string): void => {
    const v = pendingValues.current[matchId];
    if (v) doSave(matchId, v.home, v.away, setPredictions);
  }, []);

  return {
    predictions,
    isLoadingPredictions,
    updateScore,
    retryPrediction,
    refreshPredictions: loadPredictions,
  };
}
