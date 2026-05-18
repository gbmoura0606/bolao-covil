import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  RefreshControl,
  ListRenderItemInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ScreenHeader';
import { LeagueCard } from '@/components/LeagueCard';
import { JoinLeagueModal } from '@/components/JoinLeagueModal';
import { Toast } from '@/components/Toast';
import { getUserLeagues } from '@/services/leagues';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '@/constants/theme';
import type { League } from '@/types';

export default function LigasScreen(): React.JSX.Element {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
  });

  const loadLeagues = useCallback(async (silent = false): Promise<void> => {
    if (!silent) setIsLoading(true);
    setError('');
    try {
      const data = await getUserLeagues();
      setLeagues(data);
    } catch {
      setError('Erro ao carregar ligas.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadLeagues();
  }, [loadLeagues]);

  function handleRefresh(): void {
    setIsRefreshing(true);
    void loadLeagues(true);
  }

  function handleJoinSuccess(leagueName: string): void {
    setModalVisible(false);
    setToast({ visible: true, message: `Você entrou em "${leagueName}" com sucesso!` });
    void loadLeagues(true);
  }

  function renderItem({ item }: ListRenderItemInfo<League>): React.JSX.Element {
    return <LeagueCard league={item} />;
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Ligas"
        subtitle={`Você participa de ${leagues.length} liga${leagues.length !== 1 ? 's' : ''}`}
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type="success"
        onHide={() => setToast({ visible: false, message: '' })}
      />

      {isLoading && !isRefreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accentGold} />
          <Text style={styles.loadingText}>Carregando ligas...</Text>
        </View>
      ) : error !== '' ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={leagues}
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
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="trophy-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>Você ainda não participa de nenhuma liga.</Text>
            </View>
          }
        />
      )}

      <View style={styles.fab}>
        <TouchableOpacity
          style={styles.fabBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color={Colors.background} />
          <Text style={styles.fabText}>Entrar em Nova Liga</Text>
        </TouchableOpacity>
      </View>

      <JoinLeagueModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={handleJoinSuccess}
      />
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
    paddingBottom: 100,
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
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.xxl,
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
  },
  fabBtn: {
    backgroundColor: Colors.accentGold,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.lg,
  },
  fabText: {
    color: Colors.background,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.5,
  },
});
