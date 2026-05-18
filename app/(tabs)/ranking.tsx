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
import { RankingRow } from '@/components/RankingRow';
import { getRanking } from '@/services/ranking';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '@/constants/theme';
import type { Player } from '@/types';

function RankingHeader(): React.JSX.Element {
  return (
    <View style={headerStyles.row}>
      <View style={headerStyles.posCell}>
        <Text style={headerStyles.label}>#</Text>
      </View>
      <View style={headerStyles.nameCell}>
        <Text style={headerStyles.label}>Jogador</Text>
      </View>
      <View style={headerStyles.statsCell}>
        <Text style={headerStyles.label}>Pts</Text>
      </View>
      <View style={headerStyles.statsCell}>
        <Text style={headerStyles.label}>Exatos</Text>
      </View>
      <View style={headerStyles.statsCell}>
        <Text style={headerStyles.label}>Aprov.</Text>
      </View>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.backgroundAlt,
    borderBottomWidth: 2,
    borderBottomColor: Colors.accentGold,
  },
  posCell: {
    width: 36,
    alignItems: 'center',
  },
  nameCell: {
    flex: 1,
  },
  statsCell: {
    width: 54,
    alignItems: 'center',
  },
  label: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.accentGold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default function RankingScreen(): React.JSX.Element {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadRanking = useCallback(async (silent = false): Promise<void> => {
    if (!silent) setIsLoading(true);
    setError('');
    try {
      const data = await getRanking();
      setPlayers(data);
    } catch {
      setError('Erro ao carregar ranking.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadRanking();
  }, [loadRanking]);

  function handleRefresh(): void {
    setIsRefreshing(true);
    void loadRanking(true);
  }

  function renderItem({ item, index }: ListRenderItemInfo<Player>): React.JSX.Element {
    return <RankingRow player={item} position={index + 1} />;
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Ranking" subtitle="Classificação geral do bolão" />

      {isLoading && !isRefreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accentGold} />
          <Text style={styles.loadingText}>Carregando ranking...</Text>
        </View>
      ) : error !== '' ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <View style={styles.tableWrapper}>
          <RankingHeader />
          <FlatList
            data={players}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
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
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundAlt,
  },
  tableWrapper: {
    flex: 1,
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
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
