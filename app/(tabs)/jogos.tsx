import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  SectionListData,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { ScreenHeader } from '@/components/ScreenHeader';
import { MatchCard } from '@/components/MatchCard';
import { RankingWidget } from '@/components/RankingWidget';
import { PrevisaoChaveamento } from '@/components/PrevisaoChaveamento';
import { usePredictions } from '@/hooks/usePredictions';
import { useAuth } from '@/hooks/useAuth';
import { getMatches } from '@/services/matches';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '@/constants/theme';
import type { Match } from '@/types';

// ─── Tipos ───────────────────────────────────────────────────────────────────

type TabId = 'open' | 'live' | 'finished' | 'previsao';

interface MatchSection {
  title: string;
  data: Match[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function formatSectionDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86_400_000);
  if (date.getTime() === today.getTime()) return 'Hoje';
  if (date.getTime() === tomorrow.getTime()) return 'Amanhã';
  return `${WEEKDAYS[date.getDay()]}, ${d} ${MONTHS[m - 1]}`;
}

function buildSections(matches: Match[], reverse = false): MatchSection[] {
  const byDate = new Map<string, Match[]>();
  for (const m of matches) {
    if (!byDate.has(m.matchDate)) byDate.set(m.matchDate, []);
    byDate.get(m.matchDate)!.push(m);
  }
  return Array.from(byDate.entries())
    .sort(([a], [b]) => reverse ? b.localeCompare(a) : a.localeCompare(b))
    .map(([date, data]) => ({
      title: formatSectionDate(date),
      // Dentro do dia, ordena por horário de início (desc em Resultados, asc nas demais)
      data: data.slice().sort((x, y) =>
        reverse
          ? (y.matchTime ?? '').localeCompare(x.matchTime ?? '')
          : (x.matchTime ?? '').localeCompare(y.matchTime ?? '')),
    }));
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function TabBar({
  active, onChange,
  openCount, liveCount, finishedCount,
}: {
  active: TabId;
  onChange: (t: TabId) => void;
  openCount: number;
  liveCount: number;
  finishedCount: number;
}): React.JSX.Element {
  const tabs: { id: TabId; label: string; count?: number; live?: boolean }[] = [
    { id: 'open',     label: 'Próximos',   count: openCount },
    { id: 'live',     label: 'Ao Vivo',    count: liveCount, live: true },
    { id: 'finished', label: 'Resultados', count: finishedCount },
    { id: 'previsao', label: '🏆 Bracket' },
  ];
  return (
    <View style={tbS.bar}>
      {tabs.map(({ id, label, count, live }) => (
        <TouchableOpacity
          key={id}
          style={[tbS.tab, active === id && tbS.tabActive]}
          onPress={() => onChange(id)}
          activeOpacity={0.75}
        >
          <Text style={[tbS.label, active === id && tbS.labelActive]}>{label}</Text>
          {count !== undefined && count > 0 && (
            <View style={[tbS.badge, live && count > 0 && tbS.badgeLive]}>
              <Text style={[tbS.badgeTxt, live && count > 0 && tbS.badgeTxtLive]}>
                {count}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const tbS = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.sm, gap: 5, borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.accentGold },
  label: { fontSize: FontSizes.xs, fontWeight: FontWeights.medium, color: Colors.textSecondary },
  labelActive: { color: Colors.accentGold, fontWeight: FontWeights.bold },
  badge: {
    minWidth: 18, height: 18, borderRadius: 9, backgroundColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeLive: { backgroundColor: Colors.error },
  badgeTxt: { fontSize: 10, fontWeight: FontWeights.bold, color: Colors.textSecondary },
  badgeTxtLive: { color: '#fff' },
});

function SectionHeader({ title }: { title: string }): React.JSX.Element {
  return (
    <View style={shS.wrap}>
      <Text style={shS.text}>{title}</Text>
    </View>
  );
}

const shS = StyleSheet.create({
  wrap: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  text: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

function EmptyState({ tab }: { tab: TabId }): React.JSX.Element {
  const msgs: Record<TabId, { icon: string; text: string }> = {
    open:     { icon: '📅', text: 'Nenhum jogo aberto para palpites no momento.' },
    live:     { icon: '⏳', text: 'Nenhum jogo ao vivo no momento.' },
    finished: { icon: '✅', text: 'Nenhum resultado disponível ainda.' },
    previsao: { icon: '🏆', text: 'Bracket disponível em breve.' },
  };
  const { icon, text } = msgs[tab];
  return (
    <View style={emS.wrap}>
      <Text style={emS.icon}>{icon}</Text>
      <Text style={emS.text}>{text}</Text>
    </View>
  );
}

const emS = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.xl },
  icon: { fontSize: 40 },
  text: { fontSize: FontSizes.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function JogosScreen(): React.JSX.Element {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('open');
  const [rankingKey, setRankingKey] = useState(0);

  const { user } = useAuth();
  const { predictions, updateScore, retryPrediction, refreshPredictions } = usePredictions();

  // Carrega partidas — silent=true = background refresh (sem spinner global)
  const loadMatches = useCallback(async (silent = false): Promise<void> => {
    if (!silent) setIsLoading(true);
    setError('');
    try {
      const data = await getMatches();
      setMatches(data);
      // Na primeira carga, seleciona aba mais relevante
      if (!silent) {
        if (data.some((m) => m.status === 'CLOSED')) setActiveTab('live');
        else if (data.some((m) => m.status === 'OPEN')) setActiveTab('open');
        else setActiveTab('finished');
      }
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

  // Polling automático: 15s se houver jogo ao vivo, 30s caso contrário
  useEffect(() => {
    if (isLoading) return;
    const hasLive = matches.some((m) => m.status === 'CLOSED');
    const interval = hasLive ? 15_000 : 30_000;
    const id = setInterval(() => {
      void loadMatches(true);
      setRankingKey((k) => k + 1);
    }, interval);
    return () => clearInterval(id);
  }, [matches, isLoading, loadMatches]);

  function handleRefresh(): void {
    setIsRefreshing(true);
    void Promise.all([loadMatches(true), refreshPredictions()]).then(() => {
      setIsRefreshing(false);
      setRankingKey((k) => k + 1);
    });
  }

  // Contagens por status
  const openCount     = matches.filter((m) => m.status === 'OPEN').length;
  const liveCount     = matches.filter((m) => m.status === 'CLOSED').length;
  const finishedCount = matches.filter((m) => m.status === 'FINISHED').length;

  // Seções filtradas pela aba ativa
  const sections = useMemo((): MatchSection[] => {
    const filtered = matches.filter((m) => {
      if (activeTab === 'open')     return m.status === 'OPEN';
      if (activeTab === 'live')     return m.status === 'CLOSED';
      return m.status === 'FINISHED';
    });
    return buildSections(filtered, activeTab === 'finished');
  }, [matches, activeTab]);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Jogos"
        subtitle={
          liveCount > 0
            ? `${liveCount} jogo${liveCount > 1 ? 's' : ''} ao vivo`
            : `${openCount} aberto${openCount !== 1 ? 's' : ''} para palpite`
        }
      />

      <TabBar
        active={activeTab}
        onChange={setActiveTab}
        openCount={openCount}
        liveCount={liveCount}
        finishedCount={finishedCount}
      />

      {/* Ranking widget — sempre visível, colapsável */}
      {activeTab !== 'previsao' && <RankingWidget refreshKey={rankingKey} />}

      {/* Previsão de Chaveamento */}
      {activeTab === 'previsao' ? (
        <PrevisaoChaveamento />
      ) : isLoading && !isRefreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accentGold} />
          <Text style={styles.loadingText}>Carregando jogos...</Text>
        </View>
      ) : error !== '' ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => void loadMatches()}
            activeOpacity={0.8}
          >
            <Text style={styles.retryTxt}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : sections.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <SectionList<Match, MatchSection>
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MatchCard
              match={item}
              prediction={predictions[item.id]}
              onUpdateScore={(team, value) => updateScore(item.id, team, value)}
              onRetry={() => retryPrediction(item.id)}
              currentUserId={user?.id}
              refreshKey={rankingKey}
            />
          )}
          renderSectionHeader={({ section }: { section: SectionListData<Match, MatchSection> }) => (
            <SectionHeader title={section.title} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          initialNumToRender={8}
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
  container: { flex: 1, backgroundColor: Colors.backgroundAlt },
  list: { paddingTop: Spacing.xs, paddingBottom: Spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: {
    fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: FontWeights.medium,
  },
  errorText: {
    fontSize: FontSizes.md, color: Colors.error, textAlign: 'center', paddingHorizontal: Spacing.xl,
  },
  retryBtn: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md, backgroundColor: Colors.accentGold,
  },
  retryTxt: { color: Colors.background, fontWeight: FontWeights.bold, fontSize: FontSizes.sm },
});
