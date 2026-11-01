import { Redirect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/components/logo';
import { ErrorState, LoadingState } from '@/components/ui/screen-state';
import { C, T } from '@/constants/theme';
import { useFocusedAsync } from '@/hooks/use-async';
import { eventPhase, fetchMyEvents } from '@/lib/events';

/**
 * The App Clip's start screen: straight into the roll the guest joined
 * (a live one first), or a prompt to scan an invite if there isn't one.
 */
export function ClipHome() {
  const { data: events, error, isLoading, reload } = useFocusedAsync(fetchMyEvents, []);

  if (!events && isLoading) return <LoadingState />;
  if (!events) return <ErrorState message={error ?? 'Unknown error'} onRetry={reload} />;

  const roll = events.find((e) => eventPhase(e) === 'live') ?? events[0];
  if (roll) return <Redirect href={`/roll/${roll.id}`} />;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.body}>
        <Logo size={64} />
        <Text style={styles.title}>Scan an invite to join a roll</Text>
        <Text style={styles.text}>
          Ask the host for their Ikausa QR code or invite link, then open it with your camera.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  title: { ...T.title, color: C.white, textAlign: 'center' },
  text: { ...T.bodyMd, color: C.textSoft, textAlign: 'center' },
});
