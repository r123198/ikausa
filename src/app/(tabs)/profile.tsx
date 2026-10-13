import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/ui/screen-state';
import { useCoverSource } from '@/constants/covers';
import { C, FloatingTabBarSpace, T } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { errorMessage, useFocusedAsync } from '@/hooks/use-async';
import { eventPhase, fetchMyEvents, type EventSummary } from '@/lib/events';
import { formatDate, pluralize, timeUntil } from '@/lib/format';
import { supabase } from '@/lib/supabase';

function RollRow({ event, detail, href }: { event: EventSummary; detail: string; href: Href }) {
  const router = useRouter();
  const cover = useCoverSource(event.cover);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${event.name}, ${detail}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={() => router.push(href)}>
      {cover ? (
        <Image source={cover} style={styles.thumb} contentFit="cover" />
      ) : (
        <View style={[styles.thumb, styles.thumbFallback]} />
      )}
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {event.name}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {detail}
        </Text>
      </View>
      <Icon ios="chevron.right" material="chevron_right" size={16} color={C.outline} />
    </Pressable>
  );
}

function RollGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.group}>{children}</View>
    </View>
  );
}

export default function ProfileScreen() {
  const { session } = useAuth();
  const { data: events, error, isLoading, reload } = useFocusedAsync(fetchMyEvents, []);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const displayName = (session?.user.user_metadata.display_name as string | undefined) ?? '';
  const email = session?.user.email ?? '';

  async function handleSignOut() {
    const { error: signOutFailure } = await supabase.auth.signOut();
    if (signOutFailure) setSignOutError(errorMessage(signOutFailure));
  }

  if (!events && isLoading) return <LoadingState />;
  if (!events) return <ErrorState message={error ?? 'Unknown error'} onRetry={reload} />;

  const now = new Date();
  const developing = events.filter((e) => eventPhase(e, now) === 'developing');
  const done = events.filter((e) => ['ready', 'expired'].includes(eventPhase(e, now)));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={reload} tintColor={C.primary} />
        }>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(displayName || email).charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName || 'Your profile'}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {email}
            </Text>
          </View>
        </View>

        {developing.length > 0 && (
          <RollGroup title="Developing">
            {developing.map((event) => (
              <RollRow
                key={event.id}
                event={event}
                href={`/developing/${event.id}`}
                detail={`Reveals in ${timeUntil(event.revealAt, now)} · ${pluralize(event.photoCount, 'photo')}`}
              />
            ))}
          </RollGroup>
        )}

        {done.length > 0 && (
          <RollGroup title="Done">
            {done.map((event) => (
              <RollRow
                key={event.id}
                event={event}
                href={`/roll/${event.id}`}
                detail={
                  eventPhase(event, now) === 'ready'
                    ? `${pluralize(event.photoCount, 'photo')} · Export until ${formatDate(event.exportUntil)}`
                    : `${pluralize(event.photoCount, 'photo')} · Export closed`
                }
              />
            ))}
          </RollGroup>
        )}

        {developing.length === 0 && done.length === 0 && (
          <Text style={styles.empty}>
            Rolls you've finished will show up here while they develop and once they're ready.
          </Text>
        )}

        {signOutError && <Text style={styles.error}>{signOutError}</Text>}
        <Button label="Sign out" variant="danger" onPress={handleSignOut} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  content: { padding: 20, paddingBottom: FloatingTabBarSpace, gap: 28 },
  pressed: { opacity: 0.85 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 8 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...T.headlineMd, color: C.onPrimaryContainer },
  headerText: { flex: 1, gap: 2 },
  name: { ...T.headlineLgMobile, fontSize: 30, lineHeight: 36 },
  email: { ...T.caption, fontSize: 15 },

  section: { gap: 12 },
  sectionTitle: { ...T.eyebrow },
  group: {
    backgroundColor: C.card,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.hairline,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, minHeight: 72 },
  thumb: { width: 52, height: 52, borderRadius: 12 },
  thumbFallback: { backgroundColor: C.surfaceHigh },
  rowText: { flex: 1, gap: 4 },
  rowTitle: { ...T.title, fontSize: 19, lineHeight: 24 },
  rowMeta: { ...T.caption, fontSize: 14, lineHeight: 20 },

  empty: { ...T.bodyMd, fontSize: 15, color: C.onSurfaceVariant },
  error: { ...T.bodyMd, fontSize: 14, color: C.error },
});
