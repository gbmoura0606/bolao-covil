import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { ScreenHeader } from '@/components/ScreenHeader';
import { CreateUserModal } from '@/components/CreateUserModal';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius, Shadows } from '@/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuItemConfig {
  id: string;
  label: string;
  icon: IoniconName;
  destructive?: boolean;
  onPress: () => void;
}

function getInitials(nickname: string): string {
  return nickname.slice(0, 2).toUpperCase();
}

export default function ConfiguracoesScreen(): React.JSX.Element {
  const { user, logout, canAccessGerencia } = useAuth();
  const router = useRouter();
  const [createUserVisible, setCreateUserVisible] = useState(false);

  // Sem Alert.alert: diálogos multi-botão não funcionam no react-native-web,
  // o que deixava o botão Sair sem efeito no navegador.
  async function handleLogout(): Promise<void> {
    await logout();
    router.replace('/landing');
  }

  const menuItems: MenuItemConfig[] = [
    {
      id: 'password',
      label: 'Alterar Senha',
      icon: 'lock-closed-outline',
      onPress: () => router.push('/change-password'),
    },
    ...(canAccessGerencia
      ? [
          {
            id: 'bracketStatus',
            label: 'Previsões do Bolão',
            icon: 'git-network-outline' as IoniconName,
            onPress: () => router.push('/previsoes-admin'),
          },
          {
            id: 'users',
            label: 'Usuários do Bolão',
            icon: 'people-outline' as IoniconName,
            onPress: () => router.push('/gerencia/usuarios'),
          },
          {
            id: 'newUser',
            label: 'Novo Usuário',
            icon: 'person-add-outline' as IoniconName,
            onPress: () => setCreateUserVisible(true),
          },
        ]
      : []),
    {
      id: 'logout',
      label: 'Sair',
      icon: 'log-out-outline',
      destructive: true,
      onPress: () => void handleLogout(),
    },
  ];

  const initials = user ? getInitials(user.nickname) : '?';

  return (
    <View style={styles.container}>
      <ScreenHeader title="Configurações" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.nickname ?? 'Usuário'}</Text>
            <Text style={styles.userEmail}>@{user?.nickname?.toLowerCase() ?? ''}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Conta</Text>

        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.menuIconWrapper,
                    item.destructive && styles.menuIconWrapperDestructive,
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={item.destructive ? Colors.error : Colors.accentGold}
                  />
                </View>
                <Text
                  style={[
                    styles.menuLabel,
                    item.destructive && styles.menuLabelDestructive,
                  ]}
                >
                  {item.label}
                </Text>
                {!item.destructive && (
                  <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                )}
              </TouchableOpacity>
              {index < menuItems.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.versionText}>Bolão Covil v1.0.0{'\n'}Copa do Mundo 2026</Text>
      </ScrollView>

      <CreateUserModal
        visible={createUserVisible}
        onClose={() => setCreateUserVisible(false)}
        onCreated={(nickname) => {
          setCreateUserVisible(false);
          router.push('/gerencia/usuarios');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundAlt,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.background,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  userEmail: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  menuIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconWrapperDestructive: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  menuLabel: {
    flex: 1,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
  },
  menuLabelDestructive: {
    color: Colors.error,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Spacing.md + 36 + Spacing.md,
  },
  versionText: {
    marginTop: Spacing.xl,
    textAlign: 'center',
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
