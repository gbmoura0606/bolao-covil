import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '@/constants/theme';
import { isBracketLocked, BRACKET_LOCK_LABEL } from '@/constants/bracket';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Esconde o aviso da previsão (ex.: telas onde não faz sentido). */
  hideBracketNotice?: boolean;
}

export function ScreenHeader({ title, subtitle, hideBracketNotice }: ScreenHeaderProps): React.JSX.Element {
  const showNotice = !hideBracketNotice && !isBracketLocked();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {showNotice && (
        <View style={styles.notice}>
          <Ionicons name="warning-outline" size={13} color={Colors.accentGold} />
          <Text style={styles.noticeTxt}>
            Faça sua <Text style={styles.noticeBold}>Previsão</Text> do chaveamento até o fim (todos os jogos).
            Ela fecha <Text style={styles.noticeBold}>para sempre</Text> quando começar o mata-mata — {BRACKET_LOCK_LABEL}.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.backgroundAlt,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.accentGold,
    backgroundColor: 'rgba(245,158,11,0.10)',
  },
  noticeTxt: { flex: 1, fontSize: 11, color: Colors.accentGold, lineHeight: 15 },
  noticeBold: { fontWeight: FontWeights.bold },
});
