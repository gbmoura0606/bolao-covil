import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import {
  getExpensesByMonth,
  deleteExpense,
  getAvailableMonths,
  monthLabel,
  currentMonth,
  formatBRL,
  displayDate,
} from '@/services/gerencia/financeiro';
import { getResidents } from '@/services/gerencia/residents';
import type { Expense, Resident } from '@/types';

const CATEGORY_ICON: Record<string, string> = {
  aluguel: '🏠',
  agua: '💧',
  luz: '⚡',
  internet: '📡',
  gas: '🔥',
  manutencao: '🔧',
  compra_coletiva: '🛒',
  extra: '📌',
};

const CATEGORY_LABEL: Record<string, string> = {
  aluguel: 'Aluguel',
  agua: 'Água',
  luz: 'Luz',
  internet: 'Internet',
  gas: 'Gás',
  manutencao: 'Manutenção',
  compra_coletiva: 'Compra Coletiva',
  extra: 'Extra',
};

export default function FinanceiroScreen(): React.JSX.Element {
  const router = useRouter();
  const [month, setMonth] = useState(currentMonth());
  const [availableMonths, setAvailableMonths] = useState<string[]>([currentMonth()]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [exps, res, months] = await Promise.all([
      getExpensesByMonth(month),
      getResidents(),
      getAvailableMonths(),
    ]);
    setExpenses(exps);
    setResidents(res);
    setAvailableMonths(months);
    setLoading(false);
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const activeCount = residents.filter(r => r.active).length;
  const perPerson = activeCount > 0 ? total / activeCount : 0;

  const monthIdx = availableMonths.indexOf(month);

  function prevMonth() {
    if (monthIdx < availableMonths.length - 1) setMonth(availableMonths[monthIdx + 1]);
  }

  function nextMonth() {
    if (monthIdx > 0) setMonth(availableMonths[monthIdx - 1]);
  }

  async function handleDelete(id: string) {
    Alert.alert('Remover despesa', 'Confirmar remoção?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => { await deleteExpense(id); load(); },
      },
    ]);
  }

  function renderExpense({ item }: { item: Expense }) {
    return (
      <View style={styles.expenseCard}>
        <View style={styles.expenseCatIcon}>
          <Text style={styles.expenseCatEmoji}>{CATEGORY_ICON[item.category] ?? '📌'}</Text>
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseDesc} numberOfLines={1}>{item.description}</Text>
          <Text style={styles.expenseMeta}>
            {CATEGORY_LABEL[item.category]} · {item.paidByName}
          </Text>
          <Text style={styles.expenseDate}>{displayDate(item.date)}</Text>
        </View>
        <View style={styles.expenseRight}>
          <Text style={styles.expenseAmount}>{formatBRL(item.amount)}</Text>
          <Text style={styles.expenseSplit}>
            {item.splitType === 'igual' ? 'Igual' : 'Proporcional'}
          </Text>
          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            style={styles.deleteBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={15} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#60A5FA" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Financeiro</Text>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/gerencia/nova-despesa', params: { month } } as any)}
          style={styles.headerBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={26} color="#60A5FA" />
        </TouchableOpacity>
      </View>

      {/* Month Navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity
          onPress={prevMonth}
          disabled={monthIdx >= availableMonths.length - 1}
          style={styles.monthNavBtn}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={monthIdx >= availableMonths.length - 1 ? Colors.textSecondary : '#60A5FA'}
          />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel(month)}</Text>
        <TouchableOpacity
          onPress={nextMonth}
          disabled={monthIdx <= 0}
          style={styles.monthNavBtn}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-forward"
            size={22}
            color={monthIdx <= 0 ? Colors.textSecondary : '#60A5FA'}
          />
        </TouchableOpacity>
      </View>

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total do mês</Text>
          <Text style={styles.summaryValue}>{formatBRL(total)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Média por pessoa</Text>
          <Text style={styles.summaryValue}>{formatBRL(perPerson)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <TouchableOpacity
          style={styles.summaryItem}
          onPress={() => router.push({ pathname: '/gerencia/fechamento', params: { month } } as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.summaryLabel}>Divisão</Text>
          <Text style={[styles.summaryValue, styles.summaryLink]}>Fechamento →</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={i => i.id}
          renderItem={renderExpense}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={44} color="#2E4A7A" />
              <Text style={styles.emptyTitle}>Nenhuma despesa</Text>
              <Text style={styles.emptyHint}>Toque em + para registrar</Text>
            </View>
          }
        />
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
    justifyContent: 'space-between',
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
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: '#60A5FA',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xl,
  },
  monthNavBtn: {
    padding: Spacing.sm,
  },
  monthLabel: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    minWidth: 170,
    textAlign: 'center',
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1A2D4A',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#1A2D4A',
    marginVertical: Spacing.xs,
  },
  summaryLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  summaryLink: {
    color: '#60A5FA',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1A2D4A',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  expenseCatIcon: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(59,130,246,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseCatEmoji: {
    fontSize: 20,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDesc: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  expenseMeta: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  expenseDate: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  expenseRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  expenseAmount: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  expenseSplit: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  deleteBtn: {
    marginTop: 2,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: 64,
  },
  emptyTitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  emptyHint: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
});
