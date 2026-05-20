import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { addExpense, monthLabel, currentMonth } from '@/services/gerencia/financeiro';
import { getResidents } from '@/services/gerencia/residents';
import { useAuth } from '@/hooks/useAuth';
import type { ExpenseCategory, ExpenseSplitType, Resident } from '@/types';

const CATEGORIES: { id: ExpenseCategory; icon: string; label: string }[] = [
  { id: 'aluguel', icon: '🏠', label: 'Aluguel' },
  { id: 'agua', icon: '💧', label: 'Água' },
  { id: 'luz', icon: '⚡', label: 'Luz' },
  { id: 'internet', icon: '📡', label: 'Internet' },
  { id: 'gas', icon: '🔥', label: 'Gás' },
  { id: 'manutencao', icon: '🔧', label: 'Manutenção' },
  { id: 'compra_coletiva', icon: '🛒', label: 'Compra Col.' },
  { id: 'extra', icon: '📌', label: 'Extra' },
];

function todayFormatted(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

export default function NovaDespesaScreen(): React.JSX.Element {
  const router = useRouter();
  const { month } = useLocalSearchParams<{ month: string }>();
  const { user } = useAuth();
  const competencyMonth = month ?? currentMonth();

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('extra');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayFormatted());
  const [splitType, setSplitType] = useState<ExpenseSplitType>('igual');
  const [residents, setResidents] = useState<Resident[]>([]);
  const [paidById, setPaidById] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getResidents().then(res => {
      const active = res.filter(r => r.active);
      setResidents(active);
      if (active.length > 0) setPaidById(active[0].id);
    });
  }, []);

  async function handleSave() {
    const desc = description.trim();
    const parsed = parseFloat(amount.replace(',', '.'));

    if (!desc) { Alert.alert('Descrição obrigatória'); return; }
    if (isNaN(parsed) || parsed <= 0) { Alert.alert('Informe um valor válido'); return; }
    if (!paidById) { Alert.alert('Selecione quem pagou'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('Data inválida', 'Use o formato AAAA-MM-DD'); return;
    }

    const paidResident = residents.find(r => r.id === paidById);
    if (!paidResident) return;

    setSaving(true);
    try {
      await addExpense({
        description: desc,
        category,
        amount: parsed,
        date,
        competencyMonth,
        paidById,
        paidByName: paidResident.name,
        splitType,
        createdById: user?.id ?? '',
      });
      router.back();
    } catch {
      Alert.alert('Erro ao salvar despesa');
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#60A5FA" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Nova Despesa</Text>
          <Text style={styles.headerSub}>{monthLabel(competencyMonth)}</Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Descrição */}
          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Ex: Conta de luz de abril"
            placeholderTextColor={Colors.textSecondary}
          />

          {/* Categoria */}
          <Text style={styles.label}>Categoria</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryBtn, category === cat.id && styles.categoryBtnActive]}
                onPress={() => setCategory(cat.id)}
                activeOpacity={0.75}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text
                  style={[styles.categoryLabel, category === cat.id && styles.categoryLabelActive]}
                  numberOfLines={1}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Valor */}
          <Text style={styles.label}>Valor (R$)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0,00"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="decimal-pad"
          />

          {/* Data */}
          <Text style={styles.label}>Data do pagamento</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="AAAA-MM-DD"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="numbers-and-punctuation"
          />

          {/* Quem pagou */}
          <Text style={styles.label}>Quem pagou</Text>
          {residents.length === 0 ? (
            <Text style={styles.noResidents}>
              Nenhum morador ativo. Cadastre moradores primeiro.
            </Text>
          ) : (
            <View style={styles.chipRow}>
              {residents.map(r => (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.chip, paidById === r.id && styles.chipActive]}
                  onPress={() => setPaidById(r.id)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[styles.chipText, paidById === r.id && styles.chipTextActive]}
                    numberOfLines={1}
                  >
                    {r.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Divisão */}
          <Text style={styles.label}>Tipo de divisão</Text>
          <View style={styles.splitRow}>
            <TouchableOpacity
              style={[styles.splitBtn, splitType === 'igual' && styles.splitBtnActive]}
              onPress={() => setSplitType('igual')}
              activeOpacity={0.75}
            >
              <Ionicons
                name="people"
                size={18}
                color={splitType === 'igual' ? '#3B82F6' : Colors.textSecondary}
              />
              <Text style={[styles.splitLabel, splitType === 'igual' && styles.splitLabelActive]}>
                Igual
              </Text>
              <Text style={styles.splitHint}>Todos pagam o mesmo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.splitBtn, splitType === 'proporcional' && styles.splitBtnActive]}
              onPress={() => setSplitType('proporcional')}
              activeOpacity={0.75}
            >
              <Ionicons
                name="scale"
                size={18}
                color={splitType === 'proporcional' ? '#3B82F6' : Colors.textSecondary}
              />
              <Text style={[styles.splitLabel, splitType === 'proporcional' && styles.splitLabelActive]}>
                Proporcional
              </Text>
              <Text style={styles.splitHint}>Baseado no peso de cada morador</Text>
            </TouchableOpacity>
          </View>

          {/* Salvar */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Registrar Despesa</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  form: {
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1A2D4A',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryBtn: {
    width: '22%',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1A2D4A',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  categoryBtnActive: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59,130,246,0.12)',
  },
  categoryIcon: {
    fontSize: 22,
  },
  categoryLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: '#60A5FA',
    fontWeight: FontWeights.semibold,
  },
  noResidents: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1A2D4A',
    borderRadius: BorderRadius.xl,
  },
  chipActive: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59,130,246,0.12)',
  },
  chipText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: '#60A5FA',
    fontWeight: FontWeights.semibold,
  },
  splitRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  splitBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1A2D4A',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: 4,
  },
  splitBtnActive: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59,130,246,0.12)',
  },
  splitLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
  },
  splitLabelActive: {
    color: '#60A5FA',
  },
  splitHint: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: '#fff',
  },
});
