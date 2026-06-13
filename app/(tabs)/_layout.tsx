import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconName;
  iconFocused: IoniconName;
}

const TABS: TabConfig[] = [
  { name: 'jogos', title: 'Jogos', icon: 'football-outline', iconFocused: 'football' },
  { name: 'ranking', title: 'Tabelas', icon: 'trophy-outline', iconFocused: 'trophy' },
  { name: 'ligas', title: 'Liga', icon: 'people-outline', iconFocused: 'people' },
  { name: 'configuracoes', title: 'Config', icon: 'settings-outline', iconFocused: 'settings' },
];

export default function TabsLayout(): React.JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // On web the browser reserves space for the home indicator automatically;
  // on native we must account for it manually.
  const bottomInset = Platform.OS === 'web' ? 0 : insets.bottom;

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/landing');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.accentGold} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.tabBarBackground,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 60 + bottomInset,
          paddingBottom: 8 + bottomInset,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.tabBarActiveTint,
        tabBarInactiveTintColor: Colors.tabBarInactiveTint,
        tabBarLabelStyle: {
          fontSize: FontSizes.xs,
          fontWeight: '600',
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? tab.iconFocused : tab.icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
