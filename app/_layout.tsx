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
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
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
        <Stack.Screen name="previsoes-admin" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="login-gerencia" />
        <Stack.Screen name="gerencia" />
      </Stack>
    </>
  );
}
