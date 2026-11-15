import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ClientPanel, GuestInvitePanel, HandOffPanel } from '@/components/studio/event-panels';
import { StudioPanel, StudioShell } from '@/components/studio/studio-shell';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/ui/screen-state';
import { C, T } from '@/constants/theme';
import { errorMessage, useFocusedAsync } from '@/hooks/use-async';
import { eventPhase, fetchEvent, type EventPhase } from '@/lib/events';
import { filmById } from '@/lib/film/films';
import { formatDate, formatDateTime } from '@/lib/format';
import { createHostInvite, fetchHostInvites, updateClientName } from '@/lib/studio';

const PHASE_LABELS: Record<EventPhase, string> = {
  live: 'Live',
  developing: 'Developing',
  ready: 'Ready to hand off',
  expired: 'Archived',
};

const NEXT_STEP = 'Next step';

async function loadEvent(id: string) {
  const event = await fetchEvent(id);
  if (!event || event.myRole !== 'owner') return null;
  const hostInvites = await fetchHostInvites(id);
  return { event, hostInvites };
}

/** One step of the event's timeline; the current one is highlighted. */
function TimelineItem({ label, value, isCurrent }: { label: string; value: string; isCurrent: boolean }) {
  return (
    <View style={styles.timelineItem}>
      <Text style={[T.eyebrow, isCurrent && styles.timelineCurrent]}>{label}</Text>
      <Text style={[styles.timelineValue, isCurrent && styles.timelineCurrent]}>{value}</Text>
    </View>
  );
}

export default function StudioEventScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error, isLoading, reload } = useFocusedAsync(() => loadEvent(id), [id]);
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (data === undefined && isLoading) return <LoadingState />;
  if (data === undefined) return <ErrorState message={error ?? 'Unknown error'} onRetry={reload} />;
  if (data === null) {
    return <ErrorState message="This event doesn't exist or isn't one of yours." onRetry={reload} />;
  }

  const { event, hostInvites } = data;
  const phase = eventPhase(event);
  const closes = formatDateTime(event.endsAt);
  const reveals = formatDate(event.revealAt);
  const downloadsUntil = formatDate(event.exportUntil);
  const guests =
    event.maxParticipants === null ? String(event.memberCount) : `${event.memberCount} of ${event.maxParticipants}`;

  async function saveClient(name: string): Promise<boolean> {
    setIsSavingClient(true);
    setActionError(null);
    try {
      await updateClientName(event.id, name);
      reload();
      return true;
    } catch (e) {
      setActionError(errorMessage(e));
      return false;
    } finally {
      setIsSavingClient(false);
    }
  }

  async function createLink() {
    setIsCreatingLink(true);
    setActionError(null);
    try {
      await createHostInvite(event.id);
      reload();
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setIsCreatingLink(false);
    }
  }

  function handOff(hint: string, isFeatured: boolean) {
    return (
      <HandOffPanel
        hint={hint}
        eyebrow={isFeatured ? NEXT_STEP : undefined}
        isFeatured={isFeatured}
        hostInvites={hostInvites}
        isCreating={isCreatingLink}
        isDisabled={phase === 'expired'}
        onCreate={createLink}
      />
    );
  }

  const client = (
    <ClientPanel savedName={event.clientName} isSaving={isSavingClient} onSave={saveClient} />
  );

  // The panel to look at first, then the supporting ones.
  let featured;
  let others;
  switch (phase) {
    case 'live':
      featured = (
        <GuestInvitePanel
          eventId={event.id}
          inviteCode={event.inviteCode}
          eyebrow={NEXT_STEP}
          isFeatured
          hint={`Put this QR code where guests can see it, or send them the link. The roll closes ${closes}.`}
        />
      );
      others = (
        <>
          {client}
          {handOff('Optional for now. After the reveal, send your client this link so they can download the album.', false)}
        </>
      );
      break;
    case 'developing':
      featured = handOff(
        `The roll has closed. Photos reveal on ${reveals}. Get your client's host link ready now, then send it once the photos are out.`,
        true,
      );
      others = client;
      break;
    case 'ready':
      featured = handOff(
        `The photos are revealed. Send your client this one-time link. They sign in, see every photo and can download the album until ${downloadsUntil}.`,
        true,
      );
      others = client;
      break;
    case 'expired':
      featured = (
        <StudioPanel
          title="This event is finished"
          hint={`Downloads closed on ${downloadsUntil}. There's nothing left to do here.`}
          isFeatured
        />
      );
      others = client;
      break;
  }

  return (
    <StudioShell
      eyebrow={`${PHASE_LABELS[phase]} · ${filmById(event.cameraId).name}`}
      title={event.name}
      subtitle={event.clientName ? `For ${event.clientName}` : undefined}
      actions={
        <>
          <Button label="All events" variant="outline" onPress={() => router.push('/studio')} />
          <Button label="Open roll" variant="outline" onPress={() => router.push(`/roll/${event.id}`)} />
        </>
      }>
      {actionError && <Text style={styles.error}>{actionError}</Text>}

      {featured}

      <View style={styles.timeline}>
        <TimelineItem label="Guests" value={guests} isCurrent={false} />
        <TimelineItem label="Photos" value={String(event.photoCount)} isCurrent={false} />
        <TimelineItem label="Closes" value={closes} isCurrent={phase === 'live'} />
        <TimelineItem label="Reveals" value={reveals} isCurrent={phase === 'developing'} />
        <TimelineItem label="Downloads until" value={downloadsUntil} isCurrent={phase === 'ready'} />
      </View>

      <View style={styles.others}>{others}</View>
    </StudioShell>
  );
}

const styles = StyleSheet.create({
  error: { ...T.caption, fontSize: 14, color: C.error },

  timeline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 16,
    columnGap: 32,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.hairline,
  },
  timelineItem: { gap: 4 },
  timelineValue: { ...T.figure, fontSize: 16, lineHeight: 22, color: C.textSoft },
  timelineCurrent: { color: C.primary },

  others: { gap: 20 },
});
