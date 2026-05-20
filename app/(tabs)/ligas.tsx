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
import { useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { LeagueCard } from '@/components/LeagueCard';
import { JoinLeagueModal } from '@/components/JoinLeagueModal';
import { CreateLeagueModal } from '@/components/CreateLeagueModal';
import { LeagueConfigModal } from '@/components/LeagueConfigModal';
import { Toast } from '@/components/Toast';
import { getUserLeagues } from '@/services/leagues';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '@/constants/theme';
import type { League } from '@/types';

export default function LigasScreen(): React.JSX.Element {
  const router = useRouter();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [configLeague, setConfigLeague] = useState<League | null>(null);
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
    setJoinModalVisible(false);
    setToast({ visible: true, message: `Você entrou em "${leagueName}" com sucesso!` });
    void loadLeagues(true);
  }

  function handleCreateSuccess(leagueName: string): void {
    setCreateModalVisible(false);
    setToast({ visible: true, message: `Liga "${leagueName}" criada com sucesso!` });
    void loadLeagues(true);
  }

  function handleConfigSave(updated: Partial<League>): void {
    setLeagues((prev) =>
      prev.map((l) => (l.id === configLeague?.id ? { ...l, ...updated } : l))
    );
    setToast({ visible: true, message: 'Configurações salvas!' });
  }

  function renderItem({ item }: ListRenderItemInfo<League>): React.JSX.Element {
    return (
      <LeagueCard
        league={item}
        onPress={() => router.push('/liga-ranking')}
        onConfigPress={() => setConfigLeague(item)}
      />
    );
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

      {/* Bottom action buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => setJoinModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="key-outline" size={18} color={Colors.accentGold} />
          <Text style={styles.btnSecondaryText}>Entrar com Código</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => setCreateModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={18} color={Colors.background} />
          <Text style={styles.btnPrimaryText}>Criar Nova Liga</Text>
        </TouchableOpacity>
      </View>

      <JoinLeagueModal
        visible={joinModalVisible}
        onClose={() => setJoinModalVisible(false)}
        onSuccess={handleJoinSuccess}
      />

      <CreateLeagueModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
      />

      <LeagueConfigModal
        visible={configLeague !== null}
        league={configLeague}
        onClose={() => setConfigLeague(null)}
        onSave={handleConfigSave}
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
    paddingBottom: 110,
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
  bottomBar: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.accentGold,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    ...Shadows.md,
  },
  btnSecondaryText: {
    color: Colors.accentGold,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accentGold,
    ...Shadows.lg,
  },
  btnPrimaryText: {
    color: Colors.background,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
});
