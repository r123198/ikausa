import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { QrCode } from '@/components/qr-code';
import { StudioPanel, StudioShell } from '@/components/studio/studio-shell';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/ui/screen-state';
import { TextField } from '@/components/ui/text-field';
import { C, T } from '@/constants/theme';
import { errorMessage, useFocusedAsync } from '@/hooks/use-async';
import { useCopy } from '@/hooks/use-copy';
import { eventPhase, fetchEvent, type EventPhase } from '@/lib/events';
import { filmById } from '@/lib/film/films';
import { formatDate, formatDateTime, pluralize } from '@/lib/format';
import { inviteUrl } from '@/lib/invite';
import {
  createHostInvite,
  fetchHostInvites,
  hostInviteUrl,
  MAX_CLIENT_NAME_LENGTH,
  updateClientName,
} from '@/lib/studio';

const QR_SIZE = 132;

const PHASE_LABELS: Record<EventPhase, string> = {
  live: 'Live',
  developing: 'Developing',
  ready: 'Ready',
  expired: 'Archived',
};

async function loadEvent(id: string) {
  const event = await fetchEvent(id);
  if (!event || event.myRole !== 'owner') return null;
  const hostInvites = await fetchHostInvites(id);
  return { event, hostInvites };
}

/** A link with a copy button that briefly confirms the copy. */
function CopyRow({ url, label }: { url: string; label: string }) {
  const { isCopied, copy } = useCopy();

  return (
    <View style={styles.copyRow}>
      <Text style={styles.copyUrl} numberOfLines={1} selectable>
        {url}
      </Text>
      <Button
        label={isCopied ? 'Copied' : label}
        size="sm"
        variant="outline"
        onPress={() => copy(url)}
      />
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function StudioEventScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error, isLoading, reload } = useFocusedAsync(() => loadEvent(id), [id]);
  const [clientDraft, setClientDraft] = useState<string | null>(null);
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
  const clientName = clientDraft ?? event.clientName ?? '';
  const isClientChanged = clientName.trim() !== (event.clientName ?? '');
  const unusedLink = hostInvites.find((invite) => invite.usedAt === null);
  const cohostCount = hostInvites.filter((invite) => invite.usedAt !== null).length;

  async function saveClient() {
    setIsSavingClient(true);
    setActionError(null);
    try {
      await updateClientName(event.id, clientName);
      setClientDraft(null);
      reload();
    } catch (e) {
      setActionError(errorMessage(e));
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

  return (
    <StudioShell
      eyebrow={`${PHASE_LABELS[phase]} · ${filmById(event.cameraId).name}`}
      title={event.name}
      subtitle={event.clientName ? `For ${event.clientName}` : undefined}
      actions={
        <>
          <Button label="All events" variant="outline" onPress={() => router.push('/studio')} />
          <Button label="Open roll" onPress={() => router.push(`/roll/${event.id}`)} />
        </>
      }>
      <View style={styles.stats}>
        <Stat
          value={
            event.maxParticipants === null
              ? String(event.memberCount)
              : `${event.memberCount}/${event.maxParticipants}`
          }
          label="Guests joined"
        />
        <Stat value={String(event.photoCount)} label="Photos" />
        <Stat value={formatDateTime(event.endsAt)} label="Closes" />
        <Stat value={formatDate(event.revealAt)} label="Reveals" />
        <Stat value={formatDate(event.exportUntil)} label="Downloads until" />
      </View>

      {actionError && <Text style={styles.error}>{actionError}</Text>}

      <View style={styles.columns}>
        <View style={styles.column}>
          <StudioPanel title="Client" hint="Who this event is for. Only you see this.">
            <TextField
              label="Client name"
              placeholder="e.g. Ana & Paolo"
              value={clientName}
              maxLength={MAX_CLIENT_NAME_LENGTH}
              onChangeText={setClientDraft}
              onSubmitEditing={() => isClientChanged && saveClient()}
            />
            <Button
              label="Save"
              size="sm"
              disabled={!isClientChanged}
              isLoading={isSavingClient}
              onPress={saveClient}
              style={styles.alignStart}
            />
          </StudioPanel>

          <StudioPanel
            title="Hand off to your client"
            hint="Send this one-time link to the celebrant. Once they open it and sign in, they become a co-host: they see every photo and can download the album, but can't change or delete the event.">
            {unusedLink ? (
              <CopyRow url={hostInviteUrl(unusedLink.token)} label="Copy host link" />
            ) : (
              <Button
                label={cohostCount > 0 ? 'Create another host link' : 'Create host link'}
                isLoading={isCreatingLink}
                disabled={phase === 'expired'}
                onPress={createLink}
                style={styles.alignStart}
              />
            )}
            <Text style={styles.note}>
              {cohostCount > 0
                ? `${pluralize(cohostCount, 'co-host')} so far.`
                : 'No co-hosts yet.'}
              {unusedLink ? ' This link works once; create another after it’s used.' : ''}
            </Text>
          </StudioPanel>
        </View>

        <View style={styles.column}>
          <StudioPanel title="Guest invite" hint="Guests scan this or open the link to join and shoot.">
            <View style={styles.qrRow}>
              <View style={styles.qrWrap}>
                <QrCode value={inviteUrl(event.inviteCode)} size={QR_SIZE} />
              </View>
              <View style={styles.qrText}>
                <Text style={styles.codeLabel}>Invite code</Text>
                <Text style={styles.code}>{event.inviteCode}</Text>
              </View>
            </View>
            <CopyRow url={inviteUrl(event.inviteCode)} label="Copy link" />
          </StudioPanel>

          <StudioPanel
            title="Print kit"
            hint="An A4 poster and four table cards with the event name and QR code. Print them or save as PDF for the venue.">
            <Button
              label="Open print kit"
              variant="outline"
              onPress={() => router.push(`/studio/events/${event.id}/print`)}
              style={styles.alignStart}
            />
          </StudioPanel>
        </View>
      </View>
    </StudioShell>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: {
    flexGrow: 1,
    minWidth: 150,
    padding: 16,
    borderRadius: 16,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.hairline,
    gap: 4,
  },
  statValue: { ...T.italic, fontSize: 22, color: C.onSurface },
  statLabel: { ...T.eyebrow },

  columns: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  column: { flexGrow: 1, flexBasis: 360, gap: 20 },
  alignStart: { alignSelf: 'flex-start' },
  note: { ...T.caption, fontSize: 13 },
  error: { ...T.caption, fontSize: 14, color: C.error },

  copyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  copyUrl: {
    flex: 1,
    ...T.caption,
    fontSize: 13,
    color: C.textSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.cardRaised,
  },
  qrRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  qrWrap: { padding: 10, borderRadius: 14, backgroundColor: C.white },
  qrText: { gap: 6 },
  codeLabel: { ...T.eyebrow },
  code: { ...T.italic, fontSize: 30, lineHeight: 36, color: C.primary, letterSpacing: 2 },
});
