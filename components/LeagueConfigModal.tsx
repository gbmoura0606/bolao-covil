import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import type { League } from '@/types';

interface Props {
  visible: boolean;
  league: League | null;
  onClose: () => void;
  onSave: (updated: Partial<League>) => void;
}

export function LeagueConfigModal({ visible, league, onClose }: Props): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  function handleCopy(): void {
    if (!league) return;
    Clipboard.setString(league.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              <Text style={styles.title}>Código de Convite</Text>
              <Text style={styles.subtitle}>{league.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>
            Compartilhe este código para convidar outros jogadores para a liga.
          </Text>

          <TouchableOpacity style={styles.codeBox} onPress={handleCopy} activeOpacity={0.8}>
            <Text style={styles.code}>{league.code}</Text>
            <View style={styles.copyBtn}>
              <Ionicons
                name={copied ? 'checkmark-circle' : 'copy-outline'}
                size={18}
                color={copied ? Colors.success : Colors.accentGold}
              />
              <Text style={[styles.copyTxt, copied && { color: Colors.success }]}>
                {copied ? 'Copiado!' : 'Copiar'}
              </Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.note}>
            O código é permanente e único para a liga. Qualquer pessoa com o código pode entrar.
          </Text>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.closeBtnTxt}>Fechar</Text>
          </TouchableOpacity>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
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
  hint: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.accentGold,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  code: {
    fontSize: 22,
    fontWeight: FontWeights.bold,
    color: Colors.accentGold,
    letterSpacing: 4,
    fontFamily: 'monospace',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyTxt: {
    fontSize: FontSizes.sm,
    color: Colors.accentGold,
    fontWeight: FontWeights.semibold,
  },
  note: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 16,
  },
  closeBtn: {
    backgroundColor: Colors.accentGold,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  closeBtnTxt: {
    color: Colors.background,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
});
