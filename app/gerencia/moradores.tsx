import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import {
  getResidents,
  addResident,
  updateResident,
  removeResident,
} from '@/services/gerencia/residents';
import type { Resident } from '@/types';

export default function MoradoresScreen(): React.JSX.Element {
  const router = useRouter();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Resident | null>(null);
  const [formName, setFormName] = useState('');
  const [formWeight, setFormWeight] = useState('1.0');

  async function load() {
    setResidents(await getResidents());
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditTarget(null);
    setFormName('');
    setFormWeight('1.0');
    setModalVisible(true);
  }

  function openEdit(r: Resident) {
    setEditTarget(r);
    setFormName(r.name);
    setFormWeight(String(r.weight));
    setModalVisible(true);
  }

  async function handleSave() {
    const name = formName.trim();
    const weight = parseFloat(formWeight.replace(',', '.'));

    if (!name) { Alert.alert('Nome obrigatório'); return; }
    if (isNaN(weight) || weight <= 0) { Alert.alert('Peso inválido', 'Use um número positivo. Ex: 1.0'); return; }

    if (editTarget) {
      await updateResident(editTarget.id, { name, weight });
    } else {
      await addResident(name, weight);
    }
    setModalVisible(false);
    load();
  }

  async function handleDelete(r: Resident) {
    Alert.alert('Remover morador', `Remover ${r.name}? Esta ação não pode ser desfeita.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => { await removeResident(r.id); load(); },
      },
    ]);
  }

  async function handleToggle(r: Resident) {
    await updateResident(r.id, { active: !r.active });
    load();
  }

  function renderResident({ item }: { item: Resident }) {
    return (
      <View style={[styles.card, !item.active && styles.cardInactive]}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, !item.active && styles.textMuted]}>
            {item.name}
          </Text>
          <View style={styles.cardMeta}>
            <View style={styles.weightBadge}>
              <Text style={styles.weightText}>peso {item.weight}×</Text>
            </View>
            {!item.active && (
              <Text style={styles.inactiveLabel}>inativo</Text>
            )}
          </View>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => handleToggle(item)}
            style={styles.actionBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons
              name={item.active ? 'toggle' : 'toggle-outline'}
              size={28}
              color={item.active ? '#3B82F6' : Colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => openEdit(item)}
            style={styles.actionBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="pencil-outline" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            style={styles.actionBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="trash-outline" size={18} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#60A5FA" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Moradores</Text>
        <TouchableOpacity onPress={openAdd} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="person-add-outline" size={22} color="#60A5FA" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={residents}
        keyExtractor={r => r.id}
        renderItem={renderResident}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={44} color="#2E4A7A" />
            <Text style={styles.emptyTitle}>Nenhum morador cadastrado</Text>
            <TouchableOpacity onPress={openAdd} style={styles.emptyAddBtn} activeOpacity={0.7}>
              <Text style={styles.emptyAddText}>Adicionar morador</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          residents.length > 0 ? (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={15} color={Colors.textSecondary} />
              <Text style={styles.infoText}>
                O peso define a proporção em despesas divididas proporcionalmente.
                Peso 1.5 = paga 50% a mais que o peso 1.0.
              </Text>
            </View>
          ) : null
        }
      />

      {/* Modal: Adicionar / Editar */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editTarget ? 'Editar Morador' : 'Novo Morador'}
            </Text>

            <Text style={styles.modalLabel}>Nome</Text>
            <TextInput
              style={styles.modalInput}
              value={formName}
              onChangeText={setFormName}
              placeholder="Nome do morador"
              placeholderTextColor={Colors.textSecondary}
              autoFocus
            />

            <Text style={styles.modalLabel}>Peso (divisão proporcional)</Text>
            <TextInput
              style={styles.modalInput}
              value={formWeight}
              onChangeText={setFormWeight}
              placeholder="1.0"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="decimal-pad"
            />
            <Text style={styles.modalHint}>
              1.0 = normal · 1.5 = paga 50% a mais · 0.5 = paga metade
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSave}
                activeOpacity={0.7}
              >
                <Text style={styles.modalSaveText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  list: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1A2D4A',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  cardInactive: {
    opacity: 0.5,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(59,130,246,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E3A5F',
  },
  avatarText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: '#60A5FA',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  textMuted: {
    color: Colors.textSecondary,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 3,
  },
  weightBadge: {
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  weightText: {
    fontSize: 11,
    color: '#60A5FA',
    fontWeight: FontWeights.semibold,
  },
  inactiveLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionBtn: {
    padding: 6,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  emptyAddBtn: {
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderWidth: 1,
    borderColor: '#1E3A5F',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  emptyAddText: {
    fontSize: FontSizes.sm,
    color: '#60A5FA',
    fontWeight: FontWeights.semibold,
  },
  infoBox: {
    flexDirection: 'row',
    gap: Spacing.xs,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1A2D4A',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111827',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: '#1A2D4A',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  modalHint: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#1A2D4A',
    borderRadius: BorderRadius.md,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontWeight: FontWeights.semibold,
  },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: BorderRadius.md,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: FontSizes.md,
    color: '#fff',
    fontWeight: FontWeights.bold,
  },
});
