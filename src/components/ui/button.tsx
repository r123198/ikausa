import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { C, T } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const LABEL_COLOR: Record<Variant, string> = {
  primary: C.onPrimary,
  secondary: C.onSurface,
  danger: C.error,
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  isLoading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}>
      {isLoading ? <ActivityIndicator color={LABEL_COLOR[variant]} /> : icon}
      <Text style={[styles.label, { color: LABEL_COLOR[variant] }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 26,
  },
  primary: { backgroundColor: C.primary },
  secondary: { backgroundColor: C.surfaceHighest },
  danger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.outlineVariant },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  label: { ...T.bodyMd, fontWeight: '700' },
});
