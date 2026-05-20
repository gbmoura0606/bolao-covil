import { useState, useCallback } from 'react';
import type { PredictionState } from '@/types';

interface PredictionEntry {
  homeScore: string;
  awayScore: string;
  submitted: boolean;
}

interface UsePredictionsReturn {
  predictions: PredictionState;
  updateScore: (matchId: string, team: 'home' | 'away', value: string) => void;
  submitPrediction: (matchId: string) => boolean;
  getPrediction: (matchId: string) => PredictionEntry;
  isSubmitted: (matchId: string) => boolean;
}

function isValidScore(value: string): boolean {
  return /^[0-9]$/.test(value) || value === '';
}

export function usePredictions(): UsePredictionsReturn {
  const [predictions, setPredictions] = useState<PredictionState>({});

  const getPrediction = useCallback(
    (matchId: string): PredictionEntry => {
      return (
        predictions[matchId] ?? {
          homeScore: '',
          awayScore: '',
          submitted: false,
        }
      );
    },
    [predictions]
  );

  const updateScore = useCallback(
    (matchId: string, team: 'home' | 'away', value: string) => {
      if (!isValidScore(value)) return;

      setPredictions((prev) => ({
        ...prev,
        [matchId]: {
          ...(prev[matchId] ?? { homeScore: '', awayScore: '', submitted: false }),
          [team === 'home' ? 'homeScore' : 'awayScore']: value,
        },
      }));
    },
    []
  );

  const submitPrediction = useCallback(
    (matchId: string): boolean => {
      const entry = predictions[matchId];
      if (
        !entry ||
        entry.homeScore === '' ||
        entry.awayScore === '' ||
        !isValidScore(entry.homeScore) ||
        !isValidScore(entry.awayScore)
      ) {
        return false;
      }

      setPredictions((prev) => ({
        ...prev,
        [matchId]: {
          ...prev[matchId]!,
          submitted: true,
        },
      }));

      return true;
    },
    [predictions]
  );

  const isSubmitted = useCallback(
    (matchId: string): boolean => {
      return predictions[matchId]?.submitted ?? false;
    },
    [predictions]
  );

  return {
    predictions,
    updateScore,
    submitPrediction,
    getPrediction,
    isSubmitted,
  };
}
