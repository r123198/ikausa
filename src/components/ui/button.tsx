import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { C, T } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger';
type Size = 'md' | 'sm';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const LABEL_COLOR: Record<Variant, string> = {
  primary: C.onPrimary,
  secondary: C.onSurface,
  outline: C.onSurface,
  danger: C.error,
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
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
        size === 'sm' && styles.small,
        styles[variant],
        isDisabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}>
      {isLoading ? <ActivityIndicator color={LABEL_COLOR[variant]} /> : icon}
      <Text
        style={[styles.label, size === 'sm' && styles.smallLabel, { color: LABEL_COLOR[variant] }]}
        numberOfLines={1}>
        {label}
      </Text>
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
  small: { minHeight: 40, paddingHorizontal: 14, gap: 6, borderRadius: 14 },
  secondary: { backgroundColor: C.surfaceHighest },
  outline: { backgroundColor: C.card, borderWidth: 1, borderColor: C.hairline },
  danger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.outlineVariant },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  label: { ...T.bodyMd, fontWeight: '700' },
  smallLabel: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
});
