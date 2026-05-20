import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  RefreshControl,
  ListRenderItemInfo,
} from 'react-native';
import { ScreenHeader } from '@/components/ScreenHeader';
import { MatchCard } from '@/components/MatchCard';
import { usePredictions } from '@/hooks/usePredictions';
import { getMatches } from '@/services/matches';
import { Colors, Spacing, FontSizes, FontWeights } from '@/constants/theme';
import type { Match } from '@/types';

export default function JogosScreen(): React.JSX.Element {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const { getPrediction, updateScore, submitPrediction, isSubmitted } = usePredictions();

  const loadMatches = useCallback(async (silent = false): Promise<void> => {
    if (!silent) setIsLoading(true);
    setError('');
    try {
      const data = await getMatches();
      setMatches(data);
    } catch {
      setError('Erro ao carregar jogos. Tente novamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  function handleRefresh(): void {
    setIsRefreshing(true);
    void loadMatches(true);
  }

  function renderItem({ item }: ListRenderItemInfo<Match>): React.JSX.Element {
    const pred = getPrediction(item.id);
    return (
      <MatchCard
        match={item}
        homeScore={pred.homeScore}
        awayScore={pred.awayScore}
        submitted={pred.submitted}
        onUpdateScore={(team, value) => updateScore(item.id, team, value)}
        onSubmit={() => {
          const ok = submitPrediction(item.id);
          if (!ok) {
            // no-op: validation handled inside hook
          }
        }}
      />
    );
  }

  const openCount = matches.filter((m) => m.status === 'OPEN').length;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Jogos"
        subtitle={`${openCount} jogo${openCount !== 1 ? 's' : ''} aberto${openCount !== 1 ? 's' : ''} para palpite`}
      />

      {isLoading && !isRefreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accentGold} />
          <Text style={styles.loadingText}>Carregando jogos...</Text>
        </View>
      ) : error !== '' ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.accentGold}
              colors={[Colors.accentGold]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundAlt,
  },
  list: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  errorText: {
    fontSize: FontSizes.md,
    color: Colors.error,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
