import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createUser } from '@/services/users';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius, Shadows } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: (nickname: string) => void;
}

export function CreateUserModal({ visible, onClose, onCreated }: Props): React.JSX.Element {
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<TextInput>(null);

  function reset(): void {
    setNickname('');
    setError('');
    setSaving(false);
  }

  function handleClose(): void {
    reset();
    onClose();
  }

  async function handleCreate(): Promise<void> {
    const clean = nickname.trim();
    if (clean.length < 2) {
      setError('Nickname deve ter pelo menos 2 caracteres.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const created = await createUser(clean);
      reset();
      onCreated(created.nickname);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar usuário.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      onShow={() => setTimeout(() => inputRef.current?.focus(), 100)}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.box}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Novo Usuário</Text>
              <Text style={styles.subtitle}>Senha inicial: 123 (troca obrigatória)</Text>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Nickname</Text>
          <TextInput
            ref={inputRef}
            style={[styles.input, error !== '' && styles.inputError]}
            value={nickname}
            onChangeText={(v) => { setNickname(v); setError(''); }}
            placeholder="Ex: Rodrigo"
            placeholderTextColor={Colors.border}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={30}
            returnKeyType="done"
            onSubmitEditing={() => void handleCreate()}
          />

          {error !== '' && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
              <Text style={styles.errorTxt}>{error}</Text>
            </View>
          )}

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.infoTxt}>
              O usuário receberá a senha padrão <Text style={styles.infoBold}>123</Text> e será obrigado a
              redefini-la no primeiro login.
            </Text>
          </View>

          <View style={styles.btns}>
            <TouchableOpacity style={styles.btnCancel} onPress={handleClose} activeOpacity={0.8}>
              <Text style={styles.btnCancelTxt}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnCreate, saving && styles.btnDisabled]}
              onPress={() => void handleCreate()}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving
                ? <ActivityIndicator size="small" color={Colors.background} />
                : <Text style={styles.btnCreateTxt}>Criar</Text>}
            </TouchableOpacity>
          </View>
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
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.lg,
  },
  header: {
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
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  label: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSizes.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: Spacing.sm,
  },
  errorTxt: {
    fontSize: FontSizes.xs,
    color: Colors.error,
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  infoTxt: {
    flex: 1,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  infoBold: {
    fontWeight: FontWeights.bold,
    color: Colors.accentGold,
  },
  btns: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  btnCancelTxt: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  btnCreate: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accentGold,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnCreateTxt: {
    fontSize: FontSizes.md,
    color: Colors.background,
    fontWeight: FontWeights.bold,
  },
});
