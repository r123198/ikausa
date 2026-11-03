import * as Clipboard from 'expo-clipboard';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useStudio } from '@/components/studio/studio-context';
import { StudioPanel, StudioShell } from '@/components/studio/studio-shell';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/ui/screen-state';
import { TextField } from '@/components/ui/text-field';
import { C, T } from '@/constants/theme';
import { errorMessage, useFocusedAsync } from '@/hooks/use-async';
import { formatDate } from '@/lib/format';
import { fetchPasses, type Pass } from '@/lib/passes';
import {
  createOrganizerInvite,
  fetchAdminOrganizers,
  fetchOrganizerInvites,
  grantPassCredits,
  MAX_GRANT_QUANTITY,
  MAX_NOTE_LENGTH,
  organizerInviteUrl,
  type AdminOrganizer,
  type OrganizerInvite,
} from '@/lib/studio';

const COPIED_RESET_MS = 2000;

async function loadAdmin() {
  const [organizers, invites, passes] = await Promise.all([
    fetchAdminOrganizers(),
    fetchOrganizerInvites(),
    fetchPasses(),
  ]);
  return { organizers, invites, paidPasses: passes.filter((p) => p.productId !== null) };
}

function inviteStatus(invite: OrganizerInvite, now: Date): string {
  if (invite.usedAt) return `Used ${formatDate(invite.usedAt)}`;
  if (invite.expiresAt <= now) return 'Expired';
  return `Expires ${formatDate(invite.expiresAt)}`;
}

function InviteRow({ invite }: { invite: OrganizerInvite }) {
  const [isCopied, setIsCopied] = useState(false);
  const isOpen = !invite.usedAt && invite.expiresAt > new Date();

  async function copy() {
    await Clipboard.setStringAsync(organizerInviteUrl(invite.token));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), COPIED_RESET_MS);
  }

  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{invite.note ?? 'Organizer invite'}</Text>
        <Text style={styles.rowMeta}>
          Created {formatDate(invite.createdAt)} · {inviteStatus(invite, new Date())}
        </Text>
      </View>
      {isOpen && (
        <Button label={isCopied ? 'Copied' : 'Copy link'} size="sm" variant="outline" onPress={copy} />
      )}
    </View>
  );
}

interface GrantFormProps {
  organizer: AdminOrganizer;
  passes: Pass[];
  onGranted: () => void;
}

function GrantForm({ organizer, passes, onGranted }: GrantFormProps) {
  const [passId, setPassId] = useState(passes[0]?.id ?? '');
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function grant() {
    const count = Number.parseInt(quantity, 10);
    if (!Number.isInteger(count) || count < 1 || count > MAX_GRANT_QUANTITY) {
      setError(`Enter a number from 1 to ${MAX_GRANT_QUANTITY}.`);
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await grantPassCredits(organizer.userId, passId, count, note);
      setQuantity('1');
      setNote('');
      onGranted();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.grantForm}>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {passes.map((pass) => {
          const isSelected = pass.id === passId;
          return (
            <Pressable
              key={pass.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => setPassId(pass.id)}>
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{pass.name}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.grantFields}>
        <View style={styles.quantityField}>
          <TextField label="How many" value={quantity} onChangeText={setQuantity} inputMode="numeric" />
        </View>
        <View style={styles.noteField}>
          <TextField
            label="Note (optional)"
            placeholder="e.g. GCash ref 1234"
            value={note}
            maxLength={MAX_NOTE_LENGTH}
            onChangeText={setNote}
          />
        </View>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <Button label="Grant credits" size="sm" isLoading={isSaving} onPress={grant} style={styles.alignStart} />
    </View>
  );
}

function OrganizerRow({ organizer, passes, onGranted }: GrantFormProps) {
  const [isGranting, setIsGranting] = useState(false);
  const credits = passes
    .map((pass) => `${organizer.unusedCredits.get(pass.id) ?? 0} ${pass.name}`)
    .join(' · ');

  return (
    <View style={styles.organizer}>
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>
            {organizer.displayName}
            {organizer.isAdmin && <Text style={styles.adminTag}>  Admin</Text>}
          </Text>
          <Text style={styles.rowMeta}>
            {organizer.email} · {organizer.eventCount} events · since {formatDate(organizer.createdAt)}
          </Text>
          <Text style={styles.rowCredits}>Unused credits: {credits}</Text>
        </View>
        <Button
          label={isGranting ? 'Close' : 'Grant credits'}
          size="sm"
          variant={isGranting ? 'secondary' : 'outline'}
          onPress={() => setIsGranting((open) => !open)}
        />
      </View>
      {isGranting && (
        <GrantForm
          organizer={organizer}
          passes={passes}
          onGranted={() => {
            setIsGranting(false);
            onGranted();
          }}
        />
      )}
    </View>
  );
}

export default function StudioAdmin() {
  const { status } = useStudio();
  const { data, error, isLoading, reload } = useFocusedAsync(loadAdmin, []);
  const [inviteNote, setInviteNote] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  if (!status.isAdmin) return <Redirect href="/studio" />;

  async function createInvite() {
    setIsCreating(true);
    setCreateError(null);
    try {
      const token = await createOrganizerInvite(inviteNote);
      await Clipboard.setStringAsync(organizerInviteUrl(token));
      setInviteNote('');
      reload();
    } catch (e) {
      setCreateError(errorMessage(e));
    } finally {
      setIsCreating(false);
    }
  }

  function renderBody() {
    if (!data && isLoading) return <LoadingState />;
    if (!data) return <ErrorState message={error ?? 'Unknown error'} onRetry={reload} />;

    return (
      <>
        <StudioPanel
          title="Invite an organizer"
          hint="Creates a one-time link that works for 14 days and copies it, ready to send.">
          <TextField
            label="Who is it for? (optional)"
            placeholder="e.g. Maria · Studio Lumen"
            value={inviteNote}
            maxLength={MAX_NOTE_LENGTH}
            onChangeText={setInviteNote}
          />
          {createError && <Text style={styles.error}>{createError}</Text>}
          <Button
            label="Create and copy link"
            isLoading={isCreating}
            onPress={createInvite}
            style={styles.alignStart}
          />
          {data.invites.length > 0 && (
            <View style={styles.list}>
              {data.invites.map((invite) => (
                <InviteRow key={invite.token} invite={invite} />
              ))}
            </View>
          )}
        </StudioPanel>

        <StudioPanel
          title="Organizers"
          hint="Grant credits after an organizer pays you. Each paid event they create uses one.">
          <View style={styles.list}>
            {data.organizers.map((organizer) => (
              <OrganizerRow
                key={organizer.userId}
                organizer={organizer}
                passes={data.paidPasses}
                onGranted={reload}
              />
            ))}
          </View>
        </StudioPanel>
      </>
    );
  }

  return (
    <StudioShell eyebrow="Admin" title="Organizers & credits">
      {renderBody()}
    </StudioShell>
  );
}

const styles = StyleSheet.create({
  list: { gap: 0, borderTopWidth: 1, borderTopColor: C.hairline },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 14,
  },
  organizer: { borderBottomWidth: 1, borderBottomColor: C.hairline, paddingBottom: 4 },
  rowText: { flex: 1, gap: 3 },
  rowTitle: { ...T.bodyMd, fontWeight: '600' },
  rowMeta: { ...T.caption, fontSize: 13 },
  rowCredits: { ...T.caption, fontSize: 13, color: C.primary },
  adminTag: { ...T.eyebrow, color: C.primary },
  error: { ...T.caption, fontSize: 14, color: C.error },
  alignStart: { alignSelf: 'flex-start' },

  grantForm: {
    gap: 14,
    padding: 18,
    marginBottom: 14,
    borderRadius: 16,
    backgroundColor: C.cardRaised,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.hairline,
  },
  chipSelected: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { ...T.caption, fontSize: 14, fontWeight: '600', color: C.textSoft },
  chipTextSelected: { color: C.onPrimary },
  grantFields: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quantityField: { width: 120 },
  noteField: { flexGrow: 1, flexBasis: 220 },
});
