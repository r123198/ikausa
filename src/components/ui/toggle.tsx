import { Pressable, StyleSheet, View } from 'react-native';

import { C } from '@/constants/theme';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
}

/** Peach on/off switch that looks the same on iOS, Android and web. */
export function Toggle({ value, onValueChange, accessibilityLabel }: ToggleProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      hitSlop={8}
      style={[styles.track, value && styles.trackOn]}
      onPress={() => onValueChange(!value)}>
      <View style={[styles.knob, value && styles.knobOn]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 3,
    backgroundColor: C.cardRaised,
    borderWidth: 1,
    borderColor: C.hairline,
  },
  trackOn: { backgroundColor: C.primary, borderColor: C.primary },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.textSoft },
  knobOn: { transform: [{ translateX: 20 }], backgroundColor: C.white },
});
