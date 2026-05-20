import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius, Shadows } from '@/constants/theme';

const { height } = Dimensions.get('window');

export default function LandingScreen(): React.JSX.Element {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>COVIL DA MIGA</Text>
        <Text style={styles.headerSub}>Selecione o acesso desejado</Text>
      </View>

      <View style={styles.cardsContainer}>
        {/* Bolão do Covil */}
        <TouchableOpacity
          style={styles.bolaoCard}
          onPress={() => router.push('/login')}
          activeOpacity={0.85}
        >
          <View style={styles.cardInner}>
            <View style={styles.bolaoIconWrap}>
              <Text style={styles.bolaoIcon}>⚽</Text>
            </View>

            <View style={styles.boltag}>
              <Text style={styles.boltagText}>BOLÃO</Text>
            </View>

            <Text style={styles.bolaoTitle}>Bolão{'\n'}do Covil</Text>
            <Text style={styles.bolaoDesc}>
              Palpites, ranking e ligas{'\n'}da Copa do Mundo 2026
            </Text>

            <View style={styles.bolaoBtn}>
              <Text style={styles.bolaoBtnText}>Entrar →</Text>
            </View>
          </View>

          <View style={styles.bolaoAccent} />
        </TouchableOpacity>

        {/* Gerência do Setor */}
        <TouchableOpacity
          style={styles.gerenciaCard}
          onPress={() => router.push('/login-gerencia')}
          activeOpacity={0.85}
        >
          <View style={styles.cardInner}>
            <View style={styles.gerenciaIconWrap}>
              <Text style={styles.gerenciaIcon}>🏢</Text>
            </View>

            <View style={styles.gerenciatag}>
              <Text style={styles.gerenciatagText}>GESTÃO</Text>
            </View>

            <Text style={styles.gerenciaTitle}>Gerência{'\n'}do Setor</Text>
            <Text style={styles.gerenciaDesc}>
              Administração, relatórios{'\n'}e controle do setor
            </Text>

            <View style={styles.gerenciaBtn}>
              <Text style={styles.gerenciaBtnText}>Entrar →</Text>
            </View>
          </View>

          <View style={styles.gerenciaAccent} />
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        Sistema interno • Acesso restrito
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingTop: height * 0.07,
    paddingBottom: Spacing.xl,
  },
  headerTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    letterSpacing: 1.5,
  },
  headerSub: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    letterSpacing: 0.5,
  },
  cardsContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },

  /* ---- Shared card base ---- */
  bolaoCard: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    backgroundColor: '#0A1A0F',
    borderWidth: 1.5,
    borderColor: '#1A4731',
    overflow: 'hidden',
    ...Shadows.lg,
  },
  gerenciaCard: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    backgroundColor: '#0D1520',
    borderWidth: 1.5,
    borderColor: '#1A2D4A',
    overflow: 'hidden',
    ...Shadows.lg,
  },
  cardInner: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },

  /* ---- Bolão card ---- */
  bolaoIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(5,150,105,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.darkGreen,
  },
  bolaoIcon: {
    fontSize: 32,
  },
  boltag: {
    backgroundColor: Colors.accentGold,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  boltagText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.background,
    letterSpacing: 1.5,
  },
  bolaoTitle: {
    fontSize: 28,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    lineHeight: 34,
    marginBottom: Spacing.sm,
  },
  bolaoDesc: {
    fontSize: FontSizes.sm,
    color: '#6EE7B7',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  bolaoBtn: {
    backgroundColor: Colors.accentGold,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    alignSelf: 'flex-start',
  },
  bolaoBtnText: {
    color: Colors.background,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.5,
  },
  bolaoAccent: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(5,150,105,0.08)',
  },

  /* ---- Gerência card ---- */
  gerenciaIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(59,130,246,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#1E3A5F',
  },
  gerenciaIcon: {
    fontSize: 32,
  },
  gerenciatag: {
    backgroundColor: '#3B82F6',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  gerenciatagText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    letterSpacing: 1.5,
  },
  gerenciaTitle: {
    fontSize: 28,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    lineHeight: 34,
    marginBottom: Spacing.sm,
  },
  gerenciaDesc: {
    fontSize: FontSizes.sm,
    color: '#93C5FD',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  gerenciaBtn: {
    backgroundColor: '#1E3A5F',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#2E5490',
  },
  gerenciaBtnText: {
    color: '#60A5FA',
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    letterSpacing: 0.5,
  },
  gerenciaAccent: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(59,130,246,0.06)',
  },
  footer: {
    textAlign: 'center',
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    paddingBottom: Spacing.lg,
    opacity: 0.6,
  },
});
