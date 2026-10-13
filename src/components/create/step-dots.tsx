import { StyleSheet, View } from 'react-native';

import { C } from '@/constants/theme';

export const CREATE_STEP_COUNT = 6;

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
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.18)' },
  dotActive: { backgroundColor: C.white },
});
