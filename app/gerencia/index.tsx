import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  ActivityIndicator,
  ListRenderItemInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import api from '@/services/api';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius, Shadows } from '@/constants/theme';

interface DbMatch {
  id: string;
  externalId: string | null;
  round: string;
  group: string | null;
  homeTeam: { id: string; name: string; flagEmoji: string } | null;
  awayTeam: { id: string; name: string; flagEmoji: string } | null;
  homeScore: number | null;
  awayScore: number | null;
  matchDate: string;
  status: string;
  venue: string | null;
}

/** Botão "Encerrar jogo" aparece 1h45 após o início da partida. */
const FINISH_DELAY_MS = 105 * 60_000;
const CONFIRM_TIMEOUT_MS = 4000;

/**
 * Horários gravados como Brasília com sufixo Z — remove o Z e interpreta
 * no fuso local do dispositivo (a gerência opera em BRT).
 */
function kickoffLocal(iso: string): Date {
  return new Date(iso.replace(/(\.\d{3})?Z$/, ''));
}

const BADGE: Record<string, { label: string; color: string; bg: string }> = {
  OPEN:     { label: 'PRÉ-JOGO',     color: Colors.success,    bg: 'rgba(34,197,94,0.12)' },
  CLOSED:   { label: 'EM ANDAMENTO', color: Colors.accentGold, bg: 'rgba(245,158,11,0.12)' },
  FINISHED: { label: 'ENCERRADO',    color: Colors.error,      bg: 'rgba(239,68,68,0.12)' },
};

function StatusBadge({ status }: { status: string }): React.JSX.Element {
  const b = BADGE[status] ?? BADGE.OPEN;
  return (
    <View style={[styles.badge, { backgroundColor: b.bg, borderColor: b.color }]}>
      <View style={[styles.badgeDot, { backgroundColor: b.color }]} />
      <Text style={[styles.badgeTxt, { color: b.color }]}>{b.label}</Text>
    </View>
  );
}

function MatchAdminCard({
  match,
  onSaved,
}: {
  match: DbMatch;
  onSaved: () => void;
}): React.JSX.Element {
  const [home, setHome] = useState(match.homeScore?.toString() ?? '');
  const [away, setAway] = useState(match.awayScore?.toString() ?? '');
  const [confirming, setConfirming] = useState<'save' | 'finish' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ressincroniza inputs quando o placar muda no servidor (refresh da lista)
  useEffect(() => {
    setHome(match.homeScore?.toString() ?? '');
    setAway(match.awayScore?.toString() ?? '');
  }, [match.homeScore, match.awayScore]);

  useEffect(() => () => {
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
  }, []);

  const isFinished = match.status === 'FINISHED';
  const kickoff = kickoffLocal(match.matchDate);
  const started = Date.now() >= kickoff.getTime();
  const canFinish = !isFinished && Date.now() >= kickoff.getTime() + FINISH_DELAY_MS;

  const persistedHome = match.homeScore?.toString() ?? '';
  const persistedAway = match.awayScore?.toString() ?? '';
  const dirty = home !== persistedHome || away !== persistedAway;
  const complete = home !== '' && away !== '';

  function armConfirm(action: 'save' | 'finish'): boolean {
    if (confirming === action) {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      setConfirming(null);
      return true;
    }
    setConfirming(action);
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    confirmTimer.current = setTimeout(() => setConfirming(null), CONFIRM_TIMEOUT_MS);
    return false;
  }

  async function patch(body: Record<string, unknown>): Promise<void> {
    setError('');
    setSaving(true);
    try {
      await api.patch(`/api/matches/${match.id}/score`, body);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  function handleSave(): void {
    if (!armConfirm('save')) return;
    const body: Record<string, unknown> = {
      homeScore: parseInt(home, 10),
      awayScore: parseInt(away, 10),
    };
    // Registrar placar com o jogo já iniciado move para "Em Andamento"
    if (match.status === 'OPEN' && started) body.status = 'CLOSED';
    void patch(body);
  }

  function handleFinish(): void {
    if (!armConfirm('finish')) return;
    void patch({
      homeScore: parseInt(home, 10),
      awayScore: parseInt(away, 10),
      status: 'FINISHED',
    });
  }

  const dateLabel = `${match.matchDate.substring(8, 10)}/${match.matchDate.substring(5, 7)} · ${match.matchDate.substring(11, 16)}`;

  return (
    <View style={styles.matchCard}>
      <View style={styles.cardMeta}>
        <StatusBadge status={match.status} />
        <Text style={styles.matchMeta}>
          {dateLabel} · {match.group ? `Grupo ${match.group}` : match.round.toUpperCase()}
        </Text>
      </View>

      <View style={styles.teamsRow}>
        <View style={styles.teamSide}>
          <Text style={styles.teamFlag}>{match.homeTeam?.flagEmoji ?? ''}</Text>
          <Text style={styles.teamName} numberOfLines={2}>{match.homeTeam?.name ?? '?'}</Text>
        </View>

        <View style={styles.centerCol}>
          {isFinished ? (
            <Text style={styles.scoreFinal}>{match.homeScore} – {match.awayScore}</Text>
          ) : (
            <View style={styles.inputsRow}>
              <TextInput
                style={[styles.input, home !== '' && styles.inputFilled]}
                value={home}
                onChangeText={(v) => setHome(v.replace(/[^0-9]/g, '').slice(0, 2))}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="?"
                placeholderTextColor={Colors.border}
                selectTextOnFocus
              />
              <Text style={styles.inputSep}>×</Text>
              <TextInput
                style={[styles.input, away !== '' && styles.inputFilled]}
                value={away}
                onChangeText={(v) => setAway(v.replace(/[^0-9]/g, '').slice(0, 2))}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="?"
                placeholderTextColor={Colors.border}
                selectTextOnFocus
              />
            </View>
          )}
        </View>

        <View style={styles.teamSide}>
          <Text style={styles.teamFlag}>{match.awayTeam?.flagEmoji ?? ''}</Text>
          <Text style={styles.teamName} numberOfLines={2}>{match.awayTeam?.name ?? '?'}</Text>
        </View>
      </View>

      {!isFinished && (
        <View style={styles.actionsRow}>
          {dirty && complete && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.saveBtn, confirming === 'save' && styles.btnConfirming]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving && confirming !== 'finish' ? (
                <ActivityIndicator size="small" color={Colors.textPrimary} />
              ) : (
                <Text style={styles.actionTxt}>
                  {confirming === 'save' ? 'Confirmar placar?' : 'Salvar placar'}
                </Text>
              )}
            </TouchableOpacity>
          )}
          {canFinish && complete && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.finishBtn, confirming === 'finish' && styles.btnConfirming]}
              onPress={handleFinish}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Ionicons name="lock-closed" size={13} color={Colors.textPrimary} />
              <Text style={styles.actionTxt}>
                {confirming === 'finish' ? 'Confirmar encerramento?' : 'Encerrar jogo'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {isFinished && (
        <View style={styles.lockedRow}>
          <Ionicons name="lock-closed" size={11} color={Colors.textSecondary} />
          <Text style={styles.lockedTxt}>Jogo encerrado — resultado travado</Text>
        </View>
      )}

      {error !== '' && <Text style={styles.errorTxt}>{error}</Text>}
    </View>
  );
}

export default function GerenciaHomeScreen(): React.JSX.Element {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<DbMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'finished'>('upcoming');

  const loadMatches = useCallback(async (silent = false): Promise<void> => {
    if (!silent) setIsLoading(true);
    try {
      const res = await api.get<DbMatch[]>('/api/matches');
      setMatches(res.data.filter((m) => m.homeTeam && m.awayTeam));
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  // Sem Alert.alert: diálogos multi-botão não funcionam no react-native-web
  async function handleLogout(): Promise<void> {
    await logout();
    router.replace('/landing');
  }

  const filtered = matches.filter((m) => {
    if (filter === 'upcoming') return m.status === 'OPEN' || m.status === 'CLOSED';
    if (filter === 'finished') return m.status === 'FINISHED';
    return true;
  });

  function renderMatch({ item }: ListRenderItemInfo<DbMatch>): React.JSX.Element {
    return <MatchAdminCard match={item} onSaved={() => void loadMatches(true)} />;
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>🏢</Text>
          </View>
          <View>
            <Text style={styles.title}>Gerência do Setor</Text>
            <Text style={styles.subtitle}>Olá, {user?.nickname ?? ''}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => router.push('/gerencia/usuarios')}
            activeOpacity={0.7}
          >
            <Ionicons name="people-outline" size={22} color="#60A5FA" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={() => void handleLogout()} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterBar}>
        {(['upcoming', 'finished', 'all'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTxt, filter === f && styles.filterTxtActive]}>
              {f === 'upcoming' ? 'Próximos' : f === 'finished' ? 'Finalizados' : 'Todos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderMatch}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyTxt}>Nenhuma partida encontrada.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2D4A',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(59,130,246,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#1E3A5F',
  },
  icon: { fontSize: 22 },
  title: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: '#60A5FA' },
  subtitle: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  logoutBtn: { padding: Spacing.sm },
  filterBar: {
    flexDirection: 'row',
    gap: Spacing.xs,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2D4A',
  },
  filterBtn: {
    flex: 1, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: '#1E3A5F',
    alignItems: 'center',
  },
  filterBtnActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  filterTxt: { fontSize: FontSizes.xs, fontWeight: FontWeights.semibold, color: Colors.textSecondary },
  filterTxtActive: { color: Colors.textPrimary },
  list: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  emptyTxt: { color: Colors.textSecondary, fontSize: FontSizes.sm },

  matchCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeTxt: { fontSize: 10, fontWeight: FontWeights.bold, letterSpacing: 0.6 },
  matchMeta: { fontSize: 11, color: Colors.textSecondary, flexShrink: 1, textAlign: 'right' },

  teamsRow: { flexDirection: 'row', alignItems: 'center' },
  teamSide: { flex: 1, alignItems: 'center', gap: 3 },
  teamFlag: { fontSize: 24 },
  teamName: {
    fontSize: FontSizes.xs, fontWeight: FontWeights.semibold,
    color: Colors.textPrimary, textAlign: 'center', lineHeight: 15,
  },
  centerCol: { alignItems: 'center', minWidth: 120, paddingHorizontal: Spacing.xs },
  inputsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input: {
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    width: 44,
    height: 44,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  inputFilled: { borderColor: '#3B82F6' },
  inputSep: { fontSize: FontSizes.md, color: Colors.textSecondary, fontWeight: FontWeights.bold },
  scoreFinal: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.error },

  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    flex: 1,
    minWidth: 130,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  saveBtn: { backgroundColor: '#3B82F6' },
  finishBtn: { backgroundColor: Colors.error },
  btnConfirming: { opacity: 0.85, borderWidth: 1.5, borderColor: Colors.textPrimary },
  actionTxt: { fontSize: FontSizes.xs, fontWeight: FontWeights.bold, color: Colors.textPrimary },

  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  lockedTxt: { fontSize: 11, color: Colors.textSecondary },
  errorTxt: { fontSize: 11, color: Colors.error, marginTop: Spacing.xs, textAlign: 'center' },
});
