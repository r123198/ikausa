import { StyleSheet, Text, View } from 'react-native';

import { PulsingLogo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { C, T } from '@/constants/theme';

export function LoadingState() {
  return (
    <View style={styles.center} accessibilityLabel="Loading" accessibilityRole="progressbar">
      <PulsingLogo />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Couldn't load this</Text>
      <Text style={styles.message}>{message}</Text>
      <Button label="Try again" variant="secondary" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: C.background,
  },
  title: { ...T.headlineMd, fontSize: 22, textAlign: 'center' },
  message: { ...T.bodyMd, fontSize: 15, color: C.onSurfaceVariant, textAlign: 'center' },
});
