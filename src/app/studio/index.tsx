import { Link, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CoverImage } from '@/components/cover-image';
import { StudioPanel, StudioShell } from '@/components/studio/studio-shell';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/ui/screen-state';
import { C, T } from '@/constants/theme';
import { useFocusedAsync } from '@/hooks/use-async';
import { useNow } from '@/hooks/use-now';
import { eventPhase, fetchMyEvents, type EventPhase, type EventSummary } from '@/lib/events';
import { filmById } from '@/lib/film/films';
import { formatDateRange, pluralize } from '@/lib/format';
import { fetchCredits, fetchPasses } from '@/lib/passes';

const MINUTE_MS = 60_000;
const GRID_GAP = 16;
const PAGE_GUTTER = 48;
const MAX_CONTENT_WIDTH = 1080;

const SECTIONS: { phase: EventPhase; title: string; hint: string }[] = [
  { phase: 'live', title: 'Live', hint: 'Guests can shoot right now.' },
  { phase: 'developing', title: 'Developing', hint: 'Closed, waiting for the reveal.' },
  { phase: 'ready', title: 'Ready', hint: 'Revealed. Hand off the album to your client.' },
  { phase: 'expired', title: 'Archived', hint: 'The download window has closed.' },
];

async function loadDashboard() {
  const [events, passes, credits] = await Promise.all([fetchMyEvents(), fetchPasses(), fetchCredits()]);
  return { events: events.filter((e) => e.myRole === 'owner'), passes, credits };
}

function columnsFor(width: number): number {
  if (width >= 980) return 3;
  if (width >= 640) return 2;
  return 1;
}

function EventCard({ event, width }: { event: EventSummary; width: number }) {
  const guests =
    event.maxParticipants === null
      ? pluralize(event.memberCount, 'guest')
      : `${event.memberCount}/${event.maxParticipants} guests`;

  return (
    <Link href={`/studio/events/${event.id}`} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${event.name}${event.clientName ? ` for ${event.clientName}` : ''}`}
        style={({ hovered, pressed }) => [
          styles.card,
          { width },
          hovered && styles.cardHovered,
          pressed && styles.cardPressed,
        ]}>
        <CoverImage cover={event.cover} style={styles.cardCover} />
        <View style={styles.cardBody}>
          <Text style={styles.cardClient} numberOfLines={1}>
            {event.clientName ?? 'No client name yet'}
          </Text>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {event.name}
          </Text>
          <Text style={styles.cardMeta}>{formatDateRange(event.createdAt, event.endsAt)}</Text>
          <View style={styles.statRow}>
            <Text style={styles.stat}>{guests}</Text>
            <Text style={styles.statDot}>·</Text>
            <Text style={styles.stat}>{pluralize(event.photoCount, 'photo')}</Text>
            <Text style={styles.statDot}>·</Text>
            <Text style={styles.stat}>{filmById(event.cameraId).name}</Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

export default function StudioDashboard() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const now = useNow(MINUTE_MS);
  const { data, error, isLoading, reload } = useFocusedAsync(loadDashboard, []);

  const contentWidth = Math.min(width - PAGE_GUTTER, MAX_CONTENT_WIDTH);
  const columns = columnsFor(contentWidth);
  const cardWidth = (contentWidth - GRID_GAP * (columns - 1)) / columns;

  function renderBody() {
    if (!data && isLoading) return <LoadingState />;
    if (!data) return <ErrorState message={error ?? 'Unknown error'} onRetry={reload} />;

    const paidPasses = data.passes.filter((p) => p.productId !== null);
    return (
      <>
        <View style={styles.credits}>
          {paidPasses.map((pass) => {
            const count = data.credits.get(pass.id) ?? 0;
            return (
              <View key={pass.id} style={[styles.credit, count === 0 && styles.creditEmpty]}>
                <Text style={styles.creditCount}>{count}</Text>
                <Text style={styles.creditLabel}>{pass.name} credits</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.creditNote}>
          Each paid event uses one credit. Need more? Contact the Ikausa team and we’ll top you up.
        </Text>

        {data.events.length === 0 ? (
          <StudioPanel
            title="No events yet"
            hint="Create your first event for a client. You’ll get a QR code for guests, a print kit and a host link for your client.">
            <Button label="Create an event" onPress={() => router.push('/create/name')} />
          </StudioPanel>
        ) : (
          SECTIONS.map(({ phase, title, hint }) => {
            const events = data.events.filter((e) => eventPhase(e, now) === phase);
            if (events.length === 0) return null;
            return (
              <View key={phase} style={styles.section}>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>
                    {title} <Text style={styles.sectionCount}>{events.length}</Text>
                  </Text>
                  <Text style={styles.sectionHint}>{hint}</Text>
                </View>
                <View style={styles.grid}>
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} width={cardWidth} />
                  ))}
                </View>
              </View>
            );
          })
        )}
      </>
    );
  }

  return (
    <StudioShell
      eyebrow="Studio"
      title="Your events"
      subtitle="Every roll you run for a client, from the first shot to the hand-off."
      actions={<Button label="New event" onPress={() => router.push('/create/name')} />}>
      {renderBody()}
    </StudioShell>
  );
}

const styles = StyleSheet.create({
  credits: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  credit: {
    minWidth: 150,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: 'rgba(255,196,153,0.35)',
    gap: 2,
  },
  creditEmpty: { borderColor: C.hairline, opacity: 0.6 },
  creditCount: { ...T.italic, fontSize: 30, lineHeight: 36, color: C.primary },
  creditLabel: { ...T.caption, fontSize: 13, color: C.textSoft },
  creditNote: { ...T.caption, fontSize: 13, marginTop: -16 },

  section: { gap: 14 },
  sectionHead: { gap: 2 },
  sectionTitle: { ...T.title, fontSize: 26, lineHeight: 32 },
  sectionCount: { ...T.italic, fontSize: 20, color: C.textMuted },
  sectionHint: { ...T.caption, fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },

  card: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.hairline,
    transitionProperty: 'transform, border-color',
    transitionDuration: '150ms',
  },
  cardHovered: { borderColor: 'rgba(255,196,153,0.45)', transform: [{ translateY: -2 }] },
  cardPressed: { transform: [{ scale: 0.99 }] },
  cardCover: { width: '100%', height: 150 },
  cardBody: { padding: 18, gap: 4 },
  cardClient: { ...T.eyebrow, color: C.primary },
  cardTitle: { ...T.title },
  cardMeta: { ...T.caption, fontSize: 13 },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  stat: { ...T.caption, fontSize: 13, color: C.textSoft },
  statDot: { ...T.caption, fontSize: 13 },
});
