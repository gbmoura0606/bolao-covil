import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ListRenderItemInfo,
  Animated,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ScreenHeader';
import { RankingRow } from '@/components/RankingRow';
import { getRanking } from '@/services/ranking';
import { getWorldCupGroups, type WCGroup, type WCStanding, type WCMatch } from '@/services/worldcup2026';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '@/constants/theme';
import type { Player } from '@/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type MainTab = 'tabelas' | 'bolao';

// ─── Player Ranking (Bolão tab) ───────────────────────────────────────────────

function BolaoRanking(): React.JSX.Element {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (silent = false): Promise<void> => {
    if (!silent) setIsLoading(true);
    setError('');
    try {
      setPlayers(await getRanking());
    } catch {
      setError('Erro ao carregar ranking.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (isLoading && !isRefreshing) {
    return (
      <View style={sharedStyles.center}>
        <ActivityIndicator size="large" color={Colors.accentGold} />
        <Text style={sharedStyles.loadingText}>Carregando ranking...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={sharedStyles.center}>
        <Text style={sharedStyles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={rankingStyles.tableHeader}>
        <View style={rankingStyles.posCell}><Text style={rankingStyles.headerLabel}>#</Text></View>
        <View style={rankingStyles.nameCell}><Text style={rankingStyles.headerLabel}>Jogador</Text></View>
        <View style={rankingStyles.statsCell}><Text style={rankingStyles.headerLabel}>Pts</Text></View>
        <View style={rankingStyles.statsCell}><Text style={rankingStyles.headerLabel}>Exatos</Text></View>
        <View style={rankingStyles.statsCell}><Text style={rankingStyles.headerLabel}>Aprov.</Text></View>
      </View>
      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }: ListRenderItemInfo<Player>) => (
          <RankingRow player={item} position={index + 1} />
        )}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => { setIsRefreshing(true); void load(true); }}
            tintColor={Colors.accentGold}
            colors={[Colors.accentGold]}
          />
        }
      />
    </View>
  );
}

// ─── Group card (Copa do Mundo tab) ──────────────────────────────────────────

const ROUND_LABEL: Record<1 | 2 | 3, string> = { 1: '1ª Rodada', 2: '2ª Rodada', 3: '3ª Rodada' };

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]}`;
}

interface GroupCardProps { group: WCGroup; }

function GroupCard({ group }: GroupCardProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);

  function toggle(): void {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  }

  const byRound: Record<number, WCMatch[]> = {};
  for (const m of group.matches) {
    if (!byRound[m.round]) byRound[m.round] = [];
    byRound[m.round].push(m);
  }

  return (
    <View style={groupStyles.card}>
      {/* Group header / standings */}
      <View style={groupStyles.groupHeader}>
        <Text style={groupStyles.groupTitle}>{group.name}</Text>
      </View>

      {/* Standings table */}
      <View style={groupStyles.standingsHeader}>
        <View style={groupStyles.teamCol}><Text style={groupStyles.colLabel}>Seleção</Text></View>
        <View style={groupStyles.statCol}><Text style={groupStyles.colLabel}>J</Text></View>
        <View style={groupStyles.statCol}><Text style={groupStyles.colLabel}>V</Text></View>
        <View style={groupStyles.statCol}><Text style={groupStyles.colLabel}>E</Text></View>
        <View style={groupStyles.statCol}><Text style={groupStyles.colLabel}>D</Text></View>
        <View style={groupStyles.statCol}><Text style={groupStyles.colLabel}>GP</Text></View>
        <View style={groupStyles.statCol}><Text style={groupStyles.colLabel}>GC</Text></View>
        <View style={groupStyles.statCol}><Text style={groupStyles.colLabel}>SG</Text></View>
        <View style={groupStyles.ptsCol}><Text style={[groupStyles.colLabel, groupStyles.ptsLabel]}>Pts</Text></View>
      </View>

      {group.standings.map((st: WCStanding, idx: number) => (
        <View
          key={st.team.id}
          style={[
            groupStyles.standingRow,
            idx < group.standings.length - 1 && groupStyles.rowBorder,
            idx < 2 && groupStyles.qualifyRow,
          ]}
        >
          <View style={groupStyles.posWrap}>
            <Text style={[groupStyles.pos, idx < 2 && groupStyles.posQualify]}>{idx + 1}</Text>
          </View>
          <Text style={groupStyles.flag}>{st.team.flag}</Text>
          <View style={groupStyles.teamCol}>
            <Text style={groupStyles.teamName} numberOfLines={1}>{st.team.name}</Text>
          </View>
          <View style={groupStyles.statCol}><Text style={groupStyles.statVal}>{st.played}</Text></View>
          <View style={groupStyles.statCol}><Text style={groupStyles.statVal}>{st.won}</Text></View>
          <View style={groupStyles.statCol}><Text style={groupStyles.statVal}>{st.drawn}</Text></View>
          <View style={groupStyles.statCol}><Text style={groupStyles.statVal}>{st.lost}</Text></View>
          <View style={groupStyles.statCol}><Text style={groupStyles.statVal}>{st.goalsFor}</Text></View>
          <View style={groupStyles.statCol}><Text style={groupStyles.statVal}>{st.goalsAgainst}</Text></View>
          <View style={groupStyles.statCol}><Text style={groupStyles.statVal}>{st.goalDiff}</Text></View>
          <View style={groupStyles.ptsCol}>
            <Text style={groupStyles.pts}>{st.points}</Text>
          </View>
        </View>
      ))}

      {/* Toggle matches */}
      <TouchableOpacity style={groupStyles.toggleBtn} onPress={toggle} activeOpacity={0.7}>
        <Text style={groupStyles.toggleText}>
          {expanded ? 'Ocultar jogos' : 'Ver jogos'}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={Colors.accentGold}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={groupStyles.matchesContainer}>
          {([1, 2, 3] as (1 | 2 | 3)[]).map((r) => {
            const roundMatches = byRound[r] ?? [];
            if (!roundMatches.length) return null;
            return (
              <View key={r}>
                <Text style={groupStyles.roundLabel}>{ROUND_LABEL[r]}</Text>
                {roundMatches.map((m) => (
                  <View key={m.id} style={groupStyles.matchRow}>
                    <View style={groupStyles.matchTeamHome}>
                      <Text style={groupStyles.matchFlag}>{m.home.flag}</Text>
                      <Text style={groupStyles.matchTeam} numberOfLines={1}>{m.home.name}</Text>
                    </View>

                    <View style={groupStyles.matchScore}>
                      {m.homeScore !== null && m.awayScore !== null ? (
                        <Text style={groupStyles.scoreText}>{m.homeScore} – {m.awayScore}</Text>
                      ) : (
                        <View style={groupStyles.scoreBox}>
                          <Text style={groupStyles.matchDate}>{formatDate(m.date)}</Text>
                          <Text style={groupStyles.matchTime}>{m.time}</Text>
                        </View>
                      )}
                    </View>

                    <View style={groupStyles.matchTeamAway}>
                      <Text style={groupStyles.matchTeam} numberOfLines={1}>{m.away.name}</Text>
                      <Text style={groupStyles.matchFlag}>{m.away.flag}</Text>
                    </View>
                  </View>
                ))}
              </View>
            );
          })}

          <View style={groupStyles.venueHint}>
            {group.matches.slice(0, 1).map((m) => (
              <Text key={m.id} style={groupStyles.venueText}>
                {m.venue} · {m.city}
              </Text>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Copa do Mundo 2026 tab ───────────────────────────────────────────────────

function WorldCupTables(): React.JSX.Element {
  const groups = getWorldCupGroups();

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={wcStyles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={wcStyles.banner}>
        <Text style={wcStyles.bannerEmoji}>🏆</Text>
        <View>
          <Text style={wcStyles.bannerTitle}>Copa do Mundo FIFA 2026</Text>
          <Text style={wcStyles.bannerSub}>EUA · México · Canadá  •  Jun – Jul 2026</Text>
        </View>
      </View>

      <View style={wcStyles.legendRow}>
        <View style={[wcStyles.legendDot, { backgroundColor: Colors.accentGold }]} />
        <Text style={wcStyles.legendText}>Classificam para as oitavas</Text>
      </View>

      {groups.map((g) => <GroupCard key={g.id} group={g} />)}

      <Text style={wcStyles.disclaimer}>
        Dados baseados no sorteio oficial da FIFA (dez/2024).{'\n'}Calendário sujeito a alterações.
      </Text>
    </ScrollView>
  );
}

// ─── Root screen ──────────────────────────────────────────────────────────────

export default function TabelasScreen(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<MainTab>('tabelas');

  return (
    <View style={sharedStyles.root}>
      <ScreenHeader
        title="Tabelas"
        subtitle={activeTab === 'tabelas' ? 'Campeonatos oficiais' : 'Classificação do bolão'}
      />

      {/* Tab switcher */}
      <View style={sharedStyles.switcher}>
        <TouchableOpacity
          style={[sharedStyles.tab, activeTab === 'tabelas' && sharedStyles.tabActive]}
          onPress={() => setActiveTab('tabelas')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="trophy"
            size={14}
            color={activeTab === 'tabelas' ? Colors.background : Colors.textSecondary}
            style={{ marginRight: 4 }}
          />
          <Text style={[sharedStyles.tabText, activeTab === 'tabelas' && sharedStyles.tabTextActive]}>
            Copa 2026
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[sharedStyles.tab, activeTab === 'bolao' && sharedStyles.tabActive]}
          onPress={() => setActiveTab('bolao')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="people"
            size={14}
            color={activeTab === 'bolao' ? Colors.background : Colors.textSecondary}
            style={{ marginRight: 4 }}
          />
          <Text style={[sharedStyles.tabText, activeTab === 'bolao' && sharedStyles.tabTextActive]}>
            Bolão
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === 'tabelas' ? <WorldCupTables /> : <BolaoRanking />}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const sharedStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.backgroundAlt,
  },
  switcher: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  tabActive: {
    backgroundColor: Colors.accentGold,
  },
  tabText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.background,
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

const rankingStyles = StyleSheet.create({
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: Colors.accentGold,
    marginHorizontal: Spacing.md,
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
  },
  posCell: { width: 36, alignItems: 'center' },
  nameCell: { flex: 1 },
  statsCell: { width: 54, alignItems: 'center' },
  headerLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.accentGold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

const groupStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  groupHeader: {
    backgroundColor: Colors.backgroundAlt,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: Colors.accentGold,
  },
  groupTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.accentGold,
    letterSpacing: 0.5,
  },
  standingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    backgroundColor: '#1a2030',
  },
  colLabel: {
    fontSize: 10,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  ptsLabel: {
    color: Colors.accentGold,
  },
  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  qualifyRow: {
    backgroundColor: 'rgba(245,158,11,0.04)',
  },
  posWrap: {
    width: 20,
    alignItems: 'center',
    marginRight: 4,
  },
  pos: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
  },
  posQualify: {
    color: Colors.accentGold,
  },
  flag: {
    fontSize: 18,
    marginRight: Spacing.xs,
  },
  teamCol: {
    flex: 1,
    minWidth: 0,
  },
  teamName: {
    fontSize: FontSizes.xs + 1,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
  },
  statCol: {
    width: 26,
    alignItems: 'center',
  },
  statVal: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  ptsCol: {
    width: 28,
    alignItems: 'center',
  },
  pts: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 4,
  },
  toggleText: {
    fontSize: FontSizes.xs,
    color: Colors.accentGold,
    fontWeight: FontWeights.medium,
  },
  matchesContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.xs,
  },
  roundLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm - 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(55,65,81,0.5)',
  },
  matchTeamHome: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  matchTeamAway: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
  },
  matchFlag: {
    fontSize: 16,
  },
  matchTeam: {
    fontSize: FontSizes.xs,
    color: Colors.textPrimary,
    fontWeight: FontWeights.medium,
    maxWidth: 80,
  },
  matchScore: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  scoreText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.accentGold,
  },
  scoreBox: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  matchDate: {
    fontSize: 9,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  matchTime: {
    fontSize: FontSizes.xs,
    color: Colors.textPrimary,
    fontWeight: FontWeights.bold,
  },
  venueHint: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  venueText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});

const wcStyles = StyleSheet.create({
  content: {
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.xs,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  bannerEmoji: {
    fontSize: 36,
  },
  bannerTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  bannerSub: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  disclaimer: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    lineHeight: 16,
    opacity: 0.6,
  },
});
