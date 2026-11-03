import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { C, T } from '@/constants/theme';

interface GoogleButtonProps {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

/** "Continue with Google" in the app's outline style with a Google-blue G mark. */
export function GoogleButton({ label, onPress, isLoading = false, disabled = false }: GoogleButtonProps) {
  const isDisabled = disabled || isLoading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, isDisabled && styles.disabled, pressed && styles.pressed]}>
      {isLoading ? (
        <ActivityIndicator color={C.onSurface} />
      ) : (
        <View style={styles.mark} aria-hidden>
          <Text style={styles.markText}>G</Text>
        </View>
      )}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const GOOGLE_BLUE = '#4285F4';

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 26,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.hairline,
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  mark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: { fontFamily: 'HankenGrotesk', fontSize: 15, lineHeight: 18, fontWeight: '800', color: GOOGLE_BLUE },
  label: { ...T.bodyMd, fontWeight: '700', color: C.onSurface },
});
