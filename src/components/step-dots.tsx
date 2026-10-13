import { StyleSheet, View } from 'react-native';

import { C } from '@/constants/theme';

/** Form steps before the camera / cover / review screens. */
export const CREATE_STEP_COUNT = 5;

export function StepDots({ step }: { step: number }) {
  return (
    <View
      style={styles.dots}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${step} of ${CREATE_STEP_COUNT}`}>
      {Array.from({ length: CREATE_STEP_COUNT }, (_, i) => (
        <View key={i} style={[styles.dot, i + 1 === step && styles.dotActive]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', gap: 10 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: `${C.onSurfaceVariant}33`,
  },
  dotActive: { width: 20, backgroundColor: C.primary },
});
