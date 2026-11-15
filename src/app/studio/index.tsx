import { Link, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CoverImage } from '@/components/cover-image';
import { GettingStarted } from '@/components/studio/getting-started';
import { StudioShell, studioContentWidth } from '@/components/studio/studio-shell';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/ui/screen-state';
import { C, T } from '@/constants/theme';
import { useFocusedAsync } from '@/hooks/use-async';
import { useNow } from '@/hooks/use-now';
import { eventPhase, fetchMyEvents, type EventPhase, type EventSummary } from '@/lib/events';
import { filmById } from '@/lib/film/films';
import { formatDate, formatDateTime, pluralize } from '@/lib/format';
import { fetchCredits, fetchPasses } from '@/lib/passes';

const MINUTE_MS = 60_000;
const GRID_GAP = 16;

/** Organizers with fewer events than this still see the getting-started guide. */
const GUIDE_EVENT_LIMIT = 3;

// Sections in the order they need attention: archived events need nothing.
const SECTIONS: { phase: EventPhase; title: string; hint: string }[] = [
  { phase: 'live', title: 'Live now', hint: 'Guests are shooting. Make sure the QR code is at the venue.' },
  {
    phase: 'ready',
    title: 'Ready to hand off',
    hint: 'Photos are revealed. Open the event and send your client their host link.',
  },
  { phase: 'developing', title: 'Developing', hint: 'The roll has closed. Photos reveal on the date shown.' },
  { phase: 'expired', title: 'Archived', hint: 'Downloads have closed. Nothing left to do.' },
];

/** The one date that matters for an event right now. */
function nextDate(event: EventSummary, phase: EventPhase): string {
  switch (phase) {
    case 'live':
      return `Closes ${formatDateTime(event.endsAt)}`;
    case 'developing':
      return `Reveals ${formatDate(event.revealAt)}`;
    case 'ready':
      return `Downloads until ${formatDate(event.exportUntil)}`;
    case 'expired':
      return `Closed ${formatDate(event.exportUntil)}`;
  }
}

async function loadDashboard() {
  const [events, passes, credits] = await Promise.all([fetchMyEvents(), fetchPasses(), fetchCredits()]);
  return { events: events.filter((e) => e.myRole === 'owner'), passes, credits };
}

function columnsFor(width: number): number {
  if (width >= 980) return 3;
  if (width >= 640) return 2;
  return 1;
}

interface EventCardProps {
  event: EventSummary;
  phase: EventPhase;
  width: number;
}

function EventCard({ event, phase, width }: EventCardProps) {
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
          <Text style={styles.cardTitle} numberOfLines={1}>
            {event.name}
          </Text>
          <Text style={styles.cardClient} numberOfLines={1}>
            {event.clientName ? `For ${event.clientName}` : 'No client name yet'}
          </Text>
          <Text style={[styles.cardDate, phase !== 'expired' && styles.cardDateActive]}>
            {nextDate(event, phase)}
          </Text>
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

  const contentWidth = studioContentWidth(width);
  const columns = columnsFor(contentWidth);
  const cardWidth = (contentWidth - GRID_GAP * (columns - 1)) / columns;

  function renderBody() {
    if (!data && isLoading) return <LoadingState />;
    if (!data) return <ErrorState message={error ?? 'Unknown error'} onRetry={reload} />;

    // Only plans with credits left, so a plan never shows twice and empty ones don't crowd the page.
    const held = data.passes.filter((p) => (data.credits.get(p.id) ?? 0) > 0);
    const isNew = data.events.length < GUIDE_EVENT_LIMIT;
    return (
      <>
        {isNew && (
          <GettingStarted
            hasEvent={data.events.length > 0}
            hasPhotos={data.events.some((e) => e.photoCount > 0)}
            onCreate={() => router.push('/create/name')}
          />
        )}

        {SECTIONS.map(({ phase, title, hint }) => {
          const events = data.events.filter((e) => eventPhase(e, now) === phase);
          if (events.length === 0) return null;
          const isQuiet = phase === 'expired';
          return (
            <View key={phase} style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, isQuiet && styles.sectionTitleQuiet]}>
                  {title} <Text style={styles.sectionCount}>{events.length}</Text>
                </Text>
                <Text style={styles.sectionHint}>{hint}</Text>
              </View>
              <View style={styles.grid}>
                {events.map((event) => (
                  <EventCard key={event.id} event={event} phase={phase} width={cardWidth} />
                ))}
              </View>
            </View>
          );
        })}

        <View style={styles.credits}>
          <Text style={T.eyebrow}>Plan credits</Text>
          {held.length > 0 ? (
            <View style={styles.creditList}>
              {held.map((pass) => (
                <Text key={pass.id} style={styles.credit}>
                  <Text style={styles.creditCount}>{data.credits.get(pass.id)}</Text> × {pass.name}
                </Text>
              ))}
            </View>
          ) : null}
          <Text style={styles.creditNote}>
            {held.length > 0
              ? 'Each paid event uses one credit.'
              : 'None yet. You pay for a plan when you create an event.'}
          </Text>
        </View>
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
  credits: { gap: 6, paddingTop: 20, borderTopWidth: 1, borderTopColor: C.hairline },
  creditList: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 20, rowGap: 4 },
  credit: { ...T.caption, fontSize: 14, color: C.textSoft },
  creditCount: { ...T.figure, fontSize: 14, lineHeight: 20, color: C.onSurface },
  creditNote: { ...T.caption, fontSize: 13 },

  section: { gap: 14 },
  sectionHead: { gap: 2 },
  sectionTitle: { ...T.title, fontSize: 26, lineHeight: 32 },
  sectionTitleQuiet: { fontSize: 20, lineHeight: 26, color: C.textSoft },
  sectionCount: { ...T.figure, fontSize: 18, color: C.textMuted },
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
  cardTitle: { ...T.title },
  cardClient: { ...T.caption, fontSize: 14, color: C.textSoft },
  cardDate: { ...T.caption, fontSize: 13, fontWeight: '600', marginTop: 6 },
  cardDateActive: { color: C.primary },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  stat: { ...T.caption, fontSize: 13, color: C.textSoft },
  statDot: { ...T.caption, fontSize: 13 },
});
