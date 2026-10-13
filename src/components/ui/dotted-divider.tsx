import { StyleSheet, View } from 'react-native';

import { C } from '@/constants/theme';

const DOT_COUNT = 64;

/** Row of small dots; single-side dashed borders don't render on iOS. */
export function DottedDivider() {
  return (
    <View style={styles.row} accessible={false}>
      {Array.from({ length: DOT_COUNT }, (_, i) => (
        <View key={i} style={styles.dot} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', overflow: 'hidden', height: 1 },
  dot: { width: 2, height: 1, backgroundColor: C.hairline },
});
