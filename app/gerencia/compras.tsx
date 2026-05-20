import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import {
  getShoppingItems,
  addShoppingItem,
  updateItemStatus,
  deleteShoppingItem,
} from '@/services/gerencia/compras';
import { useAuth } from '@/hooks/useAuth';
import type { ShoppingItem, ShoppingItemStatus } from '@/types';

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `há ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

export default function ComprasScreen(): React.JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const inputRef = useRef<TextInput>(null);

  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const load = useCallback(async () => {
    setItems(await getShoppingItems());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd() {
    const name = newItem.trim();
    if (!name) return;
    await addShoppingItem(name, user?.id ?? '', user?.nickname ?? 'Alguém');
    setNewItem('');
    load();
  }

  async function handleStatus(item: ShoppingItem, status: ShoppingItemStatus) {
    await updateItemStatus(
      item.id,
      status,
      user?.id ?? '',
      user?.nickname ?? 'Alguém',
    );
    load();
  }

  async function handleDelete(id: string) {
    Alert.alert('Remover item', 'Confirmar remoção?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => { await deleteShoppingItem(id); load(); },
      },
    ]);
  }

  const pending = items.filter(i => i.status === 'pendente');
  const done = items.filter(i => i.status !== 'pendente');

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#60A5FA" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lista de Compras</Text>
        <TouchableOpacity
          onPress={() => setShowHistory(h => !h)}
          style={styles.headerBtn}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showHistory ? 'time' : 'time-outline'}
            size={22}
            color={showHistory ? '#60A5FA' : Colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Quick Add */}
      <View style={styles.addBar}>
        <TextInput
          ref={inputRef}
          style={styles.addInput}
          value={newItem}
          onChangeText={setNewItem}
          placeholder="Adicionar item à lista..."
          placeholderTextColor={Colors.textSecondary}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.addBtn, !newItem.trim() && styles.addBtnDisabled]}
          onPress={handleAdd}
          disabled={!newItem.trim()}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color={newItem.trim() ? '#fff' : Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Pendentes */}
        {pending.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>PENDENTES</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{pending.length}</Text>
              </View>
            </View>
            {pending.map(item => (
              <View key={item.id} style={styles.pendingCard}>
                <TouchableOpacity
                  style={styles.checkBtn}
                  onPress={() => handleStatus(item, 'comprado')}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="ellipse-outline" size={26} color="#3B82F6" />
                </TouchableOpacity>
                <View style={styles.itemInfo}>
                  <Text style={styles.pendingName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>
                    {item.addedByName} · {timeAgo(item.createdAt)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  style={styles.closeBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.emptyPending}>
            <Ionicons name="checkmark-done-circle-outline" size={44} color="#2E4A7A" />
            <Text style={styles.emptyTitle}>Lista vazia</Text>
            <Text style={styles.emptyHint}>Adicione itens no campo acima</Text>
          </View>
        )}

        {/* Histórico */}
        {showHistory && (
          <>
            <View style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>
              <Text style={styles.sectionTitle}>HISTÓRICO</Text>
              <View style={[styles.countBadge, styles.countBadgeMuted]}>
                <Text style={[styles.countText, styles.countTextMuted]}>{done.length}</Text>
              </View>
            </View>
            {done.length === 0 ? (
              <Text style={styles.emptyHistory}>Nenhum item no histórico</Text>
            ) : (
              done.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.doneCard}
                  onPress={() => handleStatus(item, 'pendente')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={item.status === 'comprado' ? 'checkmark-circle' : 'close-circle'}
                    size={20}
                    color={item.status === 'comprado' ? Colors.success : Colors.error}
                  />
                  <View style={styles.doneInfo}>
                    <Text style={styles.doneName}>{item.name}</Text>
                    <Text style={styles.doneMeta}>
                      {item.status === 'comprado' ? 'Comprado' : 'Cancelado'}
                      {item.updatedByName ? ` por ${item.updatedByName}` : ''}
                      {' · '}{timeAgo(item.updatedAt)}
                    </Text>
                  </View>
                  <Ionicons name="refresh-outline" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>
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
  addBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2D4A',
    backgroundColor: '#111827',
  },
  addInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: '#1A2D4A',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    backgroundColor: '#1A2D4A',
  },
  content: {
    padding: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  countBadge: {
    backgroundColor: 'rgba(59,130,246,0.2)',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  countBadgeMuted: {
    backgroundColor: 'rgba(156,163,175,0.15)',
  },
  countText: {
    fontSize: 11,
    fontWeight: FontWeights.bold,
    color: '#60A5FA',
  },
  countTextMuted: {
    color: Colors.textSecondary,
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1A2D4A',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  checkBtn: {
    padding: 2,
  },
  itemInfo: {
    flex: 1,
  },
  pendingName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  itemMeta: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  closeBtn: {
    padding: 2,
  },
  emptyPending: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  emptyHint: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  emptyHistory: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  doneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1A2D4A',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.sm,
    opacity: 0.7,
  },
  doneInfo: {
    flex: 1,
  },
  doneName: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    textDecorationLine: 'line-through',
  },
  doneMeta: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
