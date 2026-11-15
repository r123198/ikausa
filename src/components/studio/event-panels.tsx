// The panels on a Studio event page. The page decides which one leads, based on
// where the event is (live, developing, ready, archived).
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { QrCode } from '@/components/qr-code';
import { StudioPanel } from '@/components/studio/studio-shell';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { C, T } from '@/constants/theme';
import { useCopy } from '@/hooks/use-copy';
import { pluralize } from '@/lib/format';
import { inviteUrl } from '@/lib/invite';
import { hostInviteUrl, MAX_CLIENT_NAME_LENGTH, type HostInvite } from '@/lib/studio';

const QR_SIZE = 132;

interface FeaturedProps {
  eyebrow?: string;
  isFeatured?: boolean;
}

/** A link with a copy button that briefly confirms the copy. */
function CopyRow({ url, label }: { url: string; label: string }) {
  const { isCopied, copy } = useCopy();

  return (
    <View style={styles.copyRow}>
      <Text style={styles.copyUrl} numberOfLines={1} selectable>
        {url}
      </Text>
      <Button label={isCopied ? 'Copied' : label} size="sm" variant="outline" onPress={() => copy(url)} />
    </View>
  );
}

interface GuestInvitePanelProps extends FeaturedProps {
  eventId: string;
  inviteCode: string;
  hint: string;
}

/** QR code, invite link and print kit: everything for getting guests in. */
export function GuestInvitePanel({ eventId, inviteCode, hint, eyebrow, isFeatured }: GuestInvitePanelProps) {
  const router = useRouter();
  const url = inviteUrl(inviteCode);

  return (
    <StudioPanel title="Get guests shooting" hint={hint} eyebrow={eyebrow} isFeatured={isFeatured}>
      <View style={styles.qrRow}>
        <View style={styles.qrWrap}>
          <QrCode value={url} size={QR_SIZE} />
        </View>
        <View style={styles.qrText}>
          <Text style={T.eyebrow}>Invite code</Text>
          <Text style={styles.code}>{inviteCode}</Text>
          <Button
            label="Open print kit"
            onPress={() => router.push(`/studio/events/${eventId}/print`)}
            style={styles.alignStart}
          />
          <Text style={styles.note}>An A4 poster and four table cards with this QR code.</Text>
        </View>
      </View>
      <CopyRow url={url} label="Copy link" />
    </StudioPanel>
  );
}

interface HandOffPanelProps extends FeaturedProps {
  hint: string;
  hostInvites: HostInvite[];
  isCreating: boolean;
  isDisabled: boolean;
  onCreate: () => void;
}

/** The one-time host link that makes the client a co-host. */
export function HandOffPanel({
  hint,
  hostInvites,
  isCreating,
  isDisabled,
  onCreate,
  eyebrow,
  isFeatured,
}: HandOffPanelProps) {
  const unusedLink = hostInvites.find((invite) => invite.usedAt === null);
  const cohostCount = hostInvites.filter((invite) => invite.usedAt !== null).length;

  return (
    <StudioPanel title="Hand off to your client" hint={hint} eyebrow={eyebrow} isFeatured={isFeatured}>
      {unusedLink ? (
        <CopyRow url={hostInviteUrl(unusedLink.token)} label="Copy host link" />
      ) : (
        <Button
          label={cohostCount > 0 ? 'Create another host link' : 'Create host link'}
          variant={isFeatured ? 'primary' : 'outline'}
          isLoading={isCreating}
          disabled={isDisabled}
          onPress={onCreate}
          style={styles.alignStart}
        />
      )}
      <Text style={styles.note}>
        {cohostCount > 0 ? `${pluralize(cohostCount, 'co-host')} so far.` : 'No co-hosts yet.'}
        {unusedLink ? ' This link works once; create another after it’s used.' : ''}
      </Text>
    </StudioPanel>
  );
}

interface ClientPanelProps {
  savedName: string | null;
  isSaving: boolean;
  onSave: (name: string) => Promise<boolean>;
}

/** The client's name, for the organizer's own records. */
export function ClientPanel({ savedName, isSaving, onSave }: ClientPanelProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const name = draft ?? savedName ?? '';
  const isChanged = name.trim() !== (savedName ?? '');

  async function save() {
    if (await onSave(name)) setDraft(null);
  }

  return (
    <StudioPanel title="Client" hint="Who this event is for. Only you see this.">
      <TextField
        label="Client name"
        placeholder="e.g. Ana & Paolo"
        value={name}
        maxLength={MAX_CLIENT_NAME_LENGTH}
        onChangeText={setDraft}
        onSubmitEditing={() => isChanged && !isSaving && save()}
      />
      <Button
        label="Save"
        size="sm"
        variant="outline"
        disabled={!isChanged}
        isLoading={isSaving}
        onPress={save}
        style={styles.alignStart}
      />
    </StudioPanel>
  );
}

const styles = StyleSheet.create({
  alignStart: { alignSelf: 'flex-start' },
  note: { ...T.caption, fontSize: 13 },

  copyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  copyUrl: {
    flex: 1,
    ...T.caption,
    fontSize: 13,
    color: C.textSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.background,
  },
  qrRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 24 },
  qrWrap: { padding: 10, borderRadius: 14, backgroundColor: C.white },
  qrText: { gap: 8, flexShrink: 1, minWidth: 200 },
  code: { ...T.figure, fontSize: 28, lineHeight: 34, color: C.primary, letterSpacing: 3 },
});
