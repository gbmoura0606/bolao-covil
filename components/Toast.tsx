import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius, Shadows } from '@/constants/theme';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  onHide: () => void;
  duration?: number;
}

const TYPE_CONFIG: Record<ToastType, { color: string; bg: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  success: { color: Colors.success, bg: 'rgba(16, 185, 129, 0.15)', icon: 'checkmark-circle' },
  error: { color: Colors.error, bg: 'rgba(239, 68, 68, 0.15)', icon: 'alert-circle' },
  info: { color: Colors.accentGold, bg: 'rgba(245, 158, 11, 0.15)', icon: 'information-circle' },
};

export function Toast({ visible, message, type = 'success', onHide, duration = 3000 }: ToastProps): React.JSX.Element {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -20, duration: 250, useNativeDriver: true }),
        ]).start(() => onHide());
      }, duration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [visible, duration, opacity, translateY, onHide]);

  if (!visible) return <></>;

  const config = TYPE_CONFIG[type];

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: config.bg, borderColor: config.color, opacity, transform: [{ translateY }] },
      ]}
    >
      <Ionicons name={config.icon} size={20} color={config.color} />
      <Text style={[styles.message, { color: config.color }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 60,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    zIndex: 9999,
    ...Shadows.lg,
  },
  message: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    flex: 1,
  },
});
