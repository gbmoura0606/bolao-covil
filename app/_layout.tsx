import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/theme';
import Head from 'expo-router/head';

export default function RootLayout(): React.JSX.Element {
  return (
    <>
      <Head>
        <title>Bolão Covil</title>
        <meta name="description" content="Bolão Copa do Mundo 2026" />
        {/* SVG emoji favicon — type=image/svg+xml takes priority over Expo's favicon.ico */}
        <link
          rel="icon"
          type="image/svg+xml"
          href="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Ctext%20y%3D%22.9em%22%20font-size%3D%2290%22%3E%E2%9A%BD%3C%2Ftext%3E%3C%2Fsvg%3E"
        />
      </Head>
      <StatusBar style="light" backgroundColor={Colors.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="landing" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="liga-ranking" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="login-gerencia" />
        <Stack.Screen name="gerencia" />
      </Stack>
    </>
  );
}
