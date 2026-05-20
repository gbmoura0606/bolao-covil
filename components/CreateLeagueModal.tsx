import React, { useState } from 'react';
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

interface CreateLeagueModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (leagueName: string) => void;
}

const EMOJI_OPTIONS = ['🏆', '⚽', '🥇', '🔥', '⭐', '👑', '🎯', '💪', '🦁', '🐺', '🦊', '🐯', '🚀', '🌟', '🎖️', '🥊'];

function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function CreateLeagueModal({ visible, onClose, onSuccess }: CreateLeagueModalProps): React.JSX.Element {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🏆');
  const [code, setCode] = useState(() => randomCode());
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleCreate(): Promise<void> {
    if (!name.trim()) {
      setError('Informe o nome da liga.');
      return;
    }
    if (!code.trim() || code.trim().length < 4) {
      setError('O código deve ter pelo menos 4 caracteres.');
      return;
    }
    setError('');
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsLoading(false);
    const created = name.trim();
    setName('');
    setCode(randomCode());
    setRequiresAuth(false);
    onSuccess(created);
  }

  function handleClose(): void {
    setName('');
    setError('');
    setCode(randomCode());
    setRequiresAuth(false);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.box}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Criar Nova Liga</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Name */}
            <Text style={styles.label}>Nome da Liga</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Galera do Escritório"
              placeholderTextColor={Colors.textSecondary}
              value={name}
              onChangeText={(v) => { setName(v); setError(''); }}
              autoCorrect={false}
              returnKeyType="next"
            />
            <View style={styles.warningRow}>
              <Ionicons name="warning-outline" size={12} color={Colors.warning} />
              <Text style={styles.warningText}>O nome não poderá ser alterado após a criação.</Text>
            </View>

            {/* Emoji */}
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
            <View style={styles.codeRow}>
              <TextInput
                style={[styles.input, styles.codeInput]}
                value={code}
                onChangeText={(v) => { setCode(v.toUpperCase().replace(/\s/g, '')); setError(''); }}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={12}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={styles.refreshBtn}
                onPress={() => setCode(randomCode())}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={18} color={Colors.accentGold} />
              </TouchableOpacity>
            </View>
            <Text style={styles.hintText}>Membros usam este código para entrar na liga.</Text>

            {/* Requires auth toggle */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Aprovação obrigatória</Text>
                <Text style={styles.toggleDesc}>
                  Novos membros precisam de aprovação do admin para entrar.
                </Text>
              </View>
              <Switch
                value={requiresAuth}
                onValueChange={setRequiresAuth}
                trackColor={{ false: Colors.border, true: Colors.accentGold }}
                thumbColor={Colors.textPrimary}
              />
            </View>

            {error !== '' && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.btn, isLoading && styles.btnDisabled]}
              onPress={handleCreate}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.background} />
              ) : (
                <Text style={styles.btnText}>Criar Liga</Text>
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
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.md,
  },
  warningText: {
    fontSize: 11,
    color: Colors.warning,
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
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  codeInput: {
    flex: 1,
    marginBottom: 0,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.accentGold,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
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
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.sm,
  },
  btn: {
    backgroundColor: Colors.accentGold,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.xs,
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
