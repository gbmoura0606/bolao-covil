import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import {
  computeBalances,
  computeTransfers,
  getExpensesByMonth,
  monthLabel,
  currentMonth,
  formatBRL,
} from '@/services/gerencia/financeiro';
import { getResidents } from '@/services/gerencia/residents';
import type { ResidentBalance, Transfer } from '@/types';

export default function FechamentoScreen(): React.JSX.Element {
  const router = useRouter();
  const { month } = useLocalSearchParams<{ month: string }>();
  const competencyMonth = month ?? currentMonth();

  const [balances, setBalances] = useState<ResidentBalance[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [expenses, residents] = await Promise.all([
        getExpensesByMonth(competencyMonth),
        getResidents(),
      ]);
      const t = expenses.reduce((s, e) => s + e.amount, 0);
      const b = computeBalances(expenses, residents);
      const tr = computeTransfers(b);
      setTotal(t);
      setBalances(b);
      setTransfers(tr);
      setLoading(false);
    }
    load();
  }, [competencyMonth]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#60A5FA" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Fechamento</Text>
          <Text style={styles.headerSub}>{monthLabel(competencyMonth)}</Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#3B82F6" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Total */}
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total da casa</Text>
            <Text style={styles.totalValue}>{formatBRL(total)}</Text>
            <Text style={styles.totalResidents}>{balances.length} moradores ativos</Text>
          </View>

          {/* Por morador */}
          {balances.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Situação por morador</Text>
              {balances.map(b => (
                <View key={b.resident.id} style={styles.balanceCard}>
                  <View style={styles.balanceHeader}>
                    <View style={styles.balanceNameRow}>
                      <Text style={styles.balanceName}>{b.resident.name}</Text>
                      {b.resident.weight !== 1.0 && (
                        <View style={styles.weightBadge}>
                          <Text style={styles.weightText}>{b.resident.weight}×</Text>
                        </View>
                      )}
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        b.balance >= -0.005 ? styles.statusOk : styles.statusOwes,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          b.balance >= -0.005 ? styles.statusTextOk : styles.statusTextOwes,
                        ]}
                      >
                        {b.balance >= -0.005 ? 'a receber' : 'a pagar'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.balanceRows}>
                    <View style={styles.balanceRow}>
                      <Text style={styles.balanceRowLabel}>Pagou</Text>
                      <Text style={styles.balanceRowValue}>{formatBRL(b.paid)}</Text>
                    </View>
                    <View style={styles.balanceRow}>
                      <Text style={styles.balanceRowLabel}>Cota calculada</Text>
                      <Text style={styles.balanceRowValue}>{formatBRL(b.owes)}</Text>
                    </View>
                    <View style={[styles.balanceRow, styles.balanceRowFinal]}>
                      <Text style={styles.balanceRowLabel}>Saldo</Text>
                      <Text
                        style={[
                          styles.balanceFinalValue,
                          b.balance >= -0.005 ? styles.positive : styles.negative,
                        ]}
                      >
                        {b.balance >= 0.005 ? '+' : ''}{formatBRL(b.balance)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Transferências */}
          {transfers.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Transferências sugeridas</Text>
              <View style={styles.transfersCard}>
                {transfers.map((t, i) => (
                  <View key={i} style={[styles.transferRow, i > 0 && styles.transferRowDivider]}>
                    <Text style={styles.transferName} numberOfLines={1}>{t.from.name}</Text>
                    <View style={styles.transferCenter}>
                      <Ionicons name="arrow-forward" size={14} color="#3B82F6" />
                      <Text style={styles.transferAmount}>{formatBRL(t.amount)}</Text>
                    </View>
                    <Text style={[styles.transferName, styles.transferNameRight]} numberOfLines={1}>
                      {t.to.name}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {transfers.length === 0 && total > 0 && (
            <View style={styles.settledCard}>
              <Ionicons name="checkmark-circle" size={28} color={Colors.success} />
              <Text style={styles.settledText}>Contas quitadas</Text>
              <Text style={styles.settledHint}>Nenhuma transferência necessária</Text>
            </View>
          )}

          {total === 0 && (
            <View style={styles.settledCard}>
              <Ionicons name="receipt-outline" size={28} color="#2E4A7A" />
              <Text style={styles.settledText}>Nenhuma despesa</Text>
              <Text style={styles.settledHint}>Registre despesas na tela anterior</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2D4A',
  },
  headerBtn: {
    padding: Spacing.sm,
    minWidth: 44,
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: '#60A5FA',
  },
  headerSub: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  totalCard: {
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderWidth: 1,
    borderColor: '#1A2D4A',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  totalLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  totalResidents: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  balanceCard: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1A2D4A',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  balanceName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  weightBadge: {
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  weightText: {
    fontSize: 10,
    color: '#60A5FA',
    fontWeight: FontWeights.semibold,
  },
  statusBadge: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusOk: {
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  statusOwes: {
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
  },
  statusTextOk: {
    color: Colors.success,
  },
  statusTextOwes: {
    color: Colors.error,
  },
  balanceRows: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#1A2D4A',
    paddingTop: Spacing.sm,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceRowFinal: {
    borderTopWidth: 1,
    borderTopColor: '#1A2D4A',
    paddingTop: 6,
    marginTop: 2,
  },
  balanceRowLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  balanceRowValue: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
  },
  balanceFinalValue: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  positive: {
    color: Colors.success,
  },
  negative: {
    color: Colors.error,
  },
  transfersCard: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1A2D4A',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  transferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  transferRowDivider: {
    borderTopWidth: 1,
    borderTopColor: '#1A2D4A',
  },
  transferName: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeights.semibold,
  },
  transferNameRight: {
    textAlign: 'right',
  },
  transferCenter: {
    alignItems: 'center',
    gap: 2,
  },
  transferAmount: {
    fontSize: FontSizes.xs,
    color: '#60A5FA',
    fontWeight: FontWeights.semibold,
  },
  settledCard: {
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.xl,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1A2D4A',
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  settledText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  settledHint: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
});
