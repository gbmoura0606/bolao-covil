import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import type { League } from '@/types';

interface LeagueConfigModalProps {
  visible: boolean;
  league: League | null;
  onClose: () => void;
  onSave: (updated: Partial<League>) => void;
}

const EMOJI_OPTIONS = ['🏆', '⚽', '🥇', '🔥', '⭐', '👑', '🎯', '💪', '🦁', '🐺', '🦊', '🐯', '🚀', '🌟', '🎖️', '🥊'];

const MOCK_PARTICIPANTS = [
  { id: 'u1', name: 'Você (Admin)' },
  { id: 'u2', name: 'Rodrigo' },
  { id: 'u3', name: 'Marina' },
  { id: 'u4', name: 'Tiago' },
  { id: 'u5', name: 'Fernanda' },
  { id: 'u6', name: 'Lucas' },
];

export function LeagueConfigModal({ visible, league, onClose, onSave }: LeagueConfigModalProps): React.JSX.Element {
  const [emoji, setEmoji] = useState(league?.emoji ?? '🏆');
  const [code, setCode] = useState(league?.code ?? '');
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [approvers, setApprovers] = useState<Set<string>>(new Set(['u1']));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (league) {
      setEmoji(league.emoji ?? '🏆');
      setCode(league.code);
    }
  }, [league]);

  function toggleApprover(id: string): void {
    setApprovers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (id === 'u1') return prev; // admin always stays
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleSave(): Promise<void> {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsLoading(false);
    onSave({ emoji, code });
    onClose();
  }

  if (!league) return <View />;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.box}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Configurar Liga</Text>
              <Text style={styles.subtitle}>{league.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Emoji/Icon */}
            <Text style={styles.label}>Ícone / Emoji</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiScroll} contentContainerStyle={styles.emojiScrollContent}>
              {EMOJI_OPTIONS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiOption, e === emoji && styles.emojiSelected]}
                  onPress={() => setEmoji(e)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Code */}
            <Text style={styles.label}>Código de Convite</Text>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={(v) => setCode(v.toUpperCase().replace(/\s/g, ''))}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
              returnKeyType="done"
            />
            <Text style={styles.hintText}>Alterar o código invalida convites anteriores.</Text>

            {/* Requires auth toggle */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Aprovação obrigatória</Text>
                <Text style={styles.toggleDesc}>
                  Novos membros precisam de aprovação para entrar com código.
                </Text>
              </View>
              <Switch
                value={requiresAuth}
                onValueChange={setRequiresAuth}
                trackColor={{ false: Colors.border, true: Colors.accentGold }}
                thumbColor={Colors.textPrimary}
              />
            </View>

            {/* Approvers list — only shown when requiresAuth is on */}
            {requiresAuth && (
              <View style={styles.approversSection}>
                <Text style={styles.label}>Quem pode aprovar novos membros?</Text>
                {MOCK_PARTICIPANTS.map((p) => {
                  const selected = approvers.has(p.id);
                  const isAdmin = p.id === 'u1';
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.approverRow, selected && styles.approverRowSelected]}
                      onPress={() => toggleApprover(p.id)}
                      activeOpacity={isAdmin ? 1 : 0.7}
                    >
                      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                        {selected && <Ionicons name="checkmark" size={12} color={Colors.background} />}
                      </View>
                      <Text style={[styles.approverName, isAdmin && styles.adminName]}>
                        {p.name}
                      </Text>
                      {isAdmin && (
                        <View style={styles.adminBadge}>
                          <Text style={styles.adminBadgeText}>admin</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <TouchableOpacity
              style={[styles.btn, isLoading && styles.btnDisabled]}
              onPress={handleSave}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.background} />
              ) : (
                <Text style={styles.btnText}>Salvar Configurações</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  box: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emojiScroll: {
    marginBottom: Spacing.md,
  },
  emojiScrollContent: {
    gap: Spacing.xs,
    paddingBottom: 4,
  },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiSelected: {
    borderColor: Colors.accentGold,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  emojiText: {
    fontSize: 22,
  },
  input: {
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  hintText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  toggleDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
  },
  approversSection: {
    marginBottom: Spacing.md,
  },
  approverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: 4,
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  approverRowSelected: {
    borderColor: Colors.accentGold,
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.accentGold,
    borderColor: Colors.accentGold,
  },
  approverName: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeights.medium,
  },
  adminName: {
    color: Colors.accentGold,
  },
  adminBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  adminBadgeText: {
    fontSize: 9,
    color: Colors.accentGold,
    fontWeight: FontWeights.semibold,
    textTransform: 'uppercase',
  },
  btn: {
    backgroundColor: Colors.accentGold,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.xs,
    marginTop: Spacing.xs,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: Colors.background,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
});
