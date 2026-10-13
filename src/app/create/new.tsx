import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoverSheet } from '@/components/create/cover-sheet';
import { DateSheet } from '@/components/create/date-sheet';
import { OptionSheet, type Option } from '@/components/create/option-sheet';
import { Icon } from '@/components/icon';
import { Button } from '@/components/ui/button';
import { DottedDivider } from '@/components/ui/dotted-divider';
import { Toggle } from '@/components/ui/toggle';
import { PRESET_COVERS } from '@/constants/covers';
import { C, T } from '@/constants/theme';
import {
  CAMERAS,
  EXPORT_OPTIONS,
  PARTICIPANT_TIERS,
  SHOT_OPTIONS,
  useCreateEvent,
  type RevealOption,
} from '@/context/create-event-context';
import { errorMessage } from '@/hooks/use-async';
import { createEvent, type ExportDays } from '@/lib/events';
import { formatDateTime } from '@/lib/format';

const NAME_SUGGESTIONS = ['Salo-salo', 'Handaan', 'Debu', 'Reunion'];
const MAX_NAME_LENGTH = 60;

const REVEAL_OPTIONS: Option<RevealOption>[] = [
  { value: 'during', label: 'During the roll', description: 'Photos show up as soon as they’re taken' },
  { value: 'after', label: 'When the roll closes', description: 'Everyone sees them together at the end' },
  { value: 'delay', label: 'A day after it closes', description: '24 hours of suspense, like real film' },
];

const EXPORT_SHEET_OPTIONS: Option<ExportDays>[] = EXPORT_OPTIONS.map((o) => ({
  value: o.days,
  label: o.label,
  description: o.desc,
}));

const PARTICIPANT_OPTIONS: Option<string>[] = PARTICIPANT_TIERS.map((t) => ({
  value: t.id,
  label: t.count === 'unlimited' ? 'Unlimited people' : `Up to ${t.count} people`,
  trailing: t.priceFormatted,
}));

const SHOT_SHEET_OPTIONS: Option<string>[] = SHOT_OPTIONS.map((s) => ({
  value: s.id,
  label: s.value === 'unlimited' ? 'Unlimited shots' : `${s.value} shots`,
  trailing: s.priceFormatted,
}));

const FILM_OPTIONS: Option<string>[] = CAMERAS.map((c) => ({
  value: c.id,
  label: c.name,
  description: c.desc,
  image: c.image,
  trailing: c.priceFormatted,
}));

type SheetName = 'cover' | 'date' | 'reveal' | 'export' | 'participants' | 'shots' | 'film' | null;

interface SettingRowProps {
  ios: 'calendar' | 'timer' | 'square.and.arrow.down' | 'person' | 'viewfinder' | 'sparkles';
  material: 'calendar_today' | 'timer' | 'download' | 'person' | 'center_focus_strong' | 'auto_awesome';
  label: string;
  value: string;
  onPress: () => void;
}

function SettingRow({ ios, material, label, value, onPress }: SettingRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={onPress}>
      <Icon ios={ios} material={material} size={19} color={C.onSurface} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
      <Icon ios="chevron.right" material="chevron_right" size={14} color={C.textMuted} />
    </Pressable>
  );
}

export default function NewRollScreen() {
  const router = useRouter();
  const draft = useCreateEvent();
  const [openSheet, setOpenSheet] = useState<SheetName>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { cover } = draft;
  const coverSource =
    cover.kind === 'preset'
      ? (PRESET_COVERS.find((p) => p.id === cover.id) ?? PRESET_COVERS[0]).src
      : { uri: cover.uri };
  const revealLabel = REVEAL_OPTIONS.find((o) => o.value === draft.revealOption)?.label ?? '';
  const canSubmit = draft.name.trim().length > 0 && !isSubmitting;
  const close = () => setOpenSheet(null);

  async function handleSubmit() {
    if (draft.name.trim().length === 0) {
      setSubmitError('Give your roll a name first.');
      return;
    }
    if (draft.endsAt <= new Date()) {
      setSubmitError('The ending date has already passed. Pick a time in the future.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const created = await createEvent({
        name: draft.name.trim(),
        endsAt: draft.endsAt,
        revealOption: draft.revealOption,
        exportDays: draft.exportDays,
        maxParticipants:
          draft.selectedParticipant.count === 'unlimited' ? null : draft.selectedParticipant.count,
        shotsPerPerson: draft.selectedShot.value === 'unlimited' ? null : draft.selectedShot.value,
        everyoneCanSee: draft.everyoneCanSee,
        cameraId: draft.cameraId,
        cover: draft.cover,
      });
      draft.reset();
      router.dismissAll();
      router.push({
        pathname: '/roll/[id]',
        params: created.coverUploaded ? { id: created.id } : { id: created.id, notice: 'cover-failed' },
      });
    } catch (e) {
      setSubmitError(errorMessage(e));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={10}
          style={styles.closeBtn}
          onPress={() => router.back()}>
          <Icon ios="xmark" material="close" size={18} color={C.onSurface} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>New roll</Text>
              <TextInput
                style={styles.nameInput}
                value={draft.name}
                onChangeText={draft.setName}
                placeholder="Name your roll"
                placeholderTextColor="rgba(255,255,255,0.28)"
                maxLength={MAX_NAME_LENGTH}
                accessibilityLabel="Roll name"
                multiline
                blurOnSubmit
                returnKeyType="done"
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change cover photo"
              style={({ pressed }) => [styles.cover, pressed && styles.pressed]}
              onPress={() => setOpenSheet('cover')}>
              <Image source={coverSource} style={StyleSheet.absoluteFill} contentFit="cover" />
              <View style={styles.coverBadge}>
                <Icon ios="camera.fill" material="photo_camera" size={12} color={C.white} />
              </View>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {NAME_SUGGESTIONS.map((s) => (
              <Pressable
                key={s}
                accessibilityRole="button"
                style={({ pressed }) => [styles.chip, draft.name === s && styles.chipActive, pressed && styles.pressed]}
                onPress={() => draft.setName(s)}>
                <Text style={[styles.chipText, draft.name === s && styles.chipTextActive]}>{s}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.eyebrow}>Roll settings</Text>
          <View style={styles.group}>
            <SettingRow
              ios="calendar"
              material="calendar_today"
              label="Ending date"
              value={formatDateTime(draft.endsAt)}
              onPress={() => setOpenSheet('date')}
            />
            <SettingRow
              ios="timer"
              material="timer"
              label="Reveal time"
              value={revealLabel}
              onPress={() => setOpenSheet('reveal')}
            />
            <SettingRow
              ios="square.and.arrow.down"
              material="download"
              label="Export window"
              value={draft.selectedExport.label}
              onPress={() => setOpenSheet('export')}
            />
          </View>

          <DottedDivider />

          <View style={styles.group}>
            <SettingRow
              ios="person"
              material="person"
              label="Participants"
              value={
                draft.selectedParticipant.count === 'unlimited'
                  ? 'Unlimited'
                  : `${draft.selectedParticipant.count} people`
              }
              onPress={() => setOpenSheet('participants')}
            />
            <SettingRow
              ios="viewfinder"
              material="center_focus_strong"
              label="Shots per person"
              value={draft.selectedShot.value === 'unlimited' ? 'Unlimited' : String(draft.selectedShot.value)}
              onPress={() => setOpenSheet('shots')}
            />
            <SettingRow
              ios="sparkles"
              material="auto_awesome"
              label="Film type"
              value={draft.selectedCamera.name}
              onPress={() => setOpenSheet('film')}
            />
            <View style={styles.row}>
              <Icon
                ios={draft.everyoneCanSee ? 'lock.open' : 'lock'}
                material={draft.everyoneCanSee ? 'lock_open' : 'lock'}
                size={19}
                color={C.onSurface}
              />
              <View style={styles.flex}>
                <Text style={styles.rowLabel}>Shared album</Text>
                <Text style={styles.rowHint}>
                  {draft.everyoneCanSee
                    ? 'Everyone sees all photos once revealed'
                    : 'Only you see everyone’s photos'}
                </Text>
              </View>
              <Toggle
                accessibilityLabel="Shared album"
                value={draft.everyoneCanSee}
                onValueChange={draft.setEveryoneCanSee}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        {submitError && (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {submitError}
          </Text>
        )}
        <View style={styles.footerRow}>
          <View>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.total}>{draft.isFree ? 'Free' : draft.totalPhpFormatted}</Text>
          </View>
          <Button
            label="Start roll"
            style={styles.flex}
            disabled={!canSubmit}
            isLoading={isSubmitting}
            onPress={handleSubmit}
          />
        </View>
      </View>

      <CoverSheet
        visible={openSheet === 'cover'}
        onClose={close}
        selected={draft.cover}
        onSelect={draft.setCover}
      />
      {openSheet === 'date' && (
        <DateSheet
          visible
          onClose={close}
          date={draft.finishDate}
          time={draft.finishTime}
          onConfirm={(date, time) => {
            draft.setFinishDate(date);
            draft.setFinishTime(time);
          }}
        />
      )}
      <OptionSheet
        visible={openSheet === 'reveal'}
        onClose={close}
        title="Reveal time"
        subtitle="Like film, photos stay hidden until they develop."
        options={REVEAL_OPTIONS}
        selected={draft.revealOption}
        onSelect={draft.setRevealOption}
      />
      <OptionSheet
        visible={openSheet === 'export'}
        onClose={close}
        title="Export window"
        subtitle="How long everyone can save the photos after the reveal."
        options={EXPORT_SHEET_OPTIONS}
        selected={draft.exportDays}
        onSelect={draft.setExportDays}
      />
      <OptionSheet
        visible={openSheet === 'participants'}
        onClose={close}
        title="Participants"
        subtitle="Including you."
        options={PARTICIPANT_OPTIONS}
        selected={draft.participantTierId}
        onSelect={draft.setParticipantTierId}
      />
      <OptionSheet
        visible={openSheet === 'shots'}
        onClose={close}
        title="Shots per person"
        subtitle="Fewer shots, more thoughtful photos."
        options={SHOT_SHEET_OPTIONS}
        selected={draft.shotOptionId}
        onSelect={draft.setShotOptionId}
      />
      <OptionSheet
        visible={openSheet === 'film'}
        onClose={close}
        title="Film type"
        options={FILM_OPTIONS}
        selected={draft.cameraId}
        onSelect={draft.setCameraId}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },

  topBar: { paddingHorizontal: 16, paddingTop: 4 },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.hairline,
  },

  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  headerText: { flex: 1, gap: 6 },
  eyebrow: { ...T.eyebrow },
  nameInput: {
    ...T.headlineLgMobile,
    fontSize: 34,
    lineHeight: 40,
    padding: 0,
    minHeight: 44,
    // The serif text itself shows focus; drop the browser's default ring.
    outlineWidth: 0,
  },
  cover: {
    width: 88,
    height: 110,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: C.card,
  },
  coverBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  chips: { gap: 8, paddingBottom: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.hairline,
    backgroundColor: C.card,
  },
  chipActive: { borderColor: C.primary },
  chipText: { ...T.caption, fontSize: 14, color: C.textSoft },
  chipTextActive: { color: C.primary },

  group: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.hairline,
  },
  rowLabel: { ...T.bodyMd, fontSize: 16 },
  rowHint: { ...T.caption },
  rowValue: { ...T.caption, fontSize: 14, flex: 1, textAlign: 'right' },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: C.hairline,
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  totalLabel: { ...T.caption, fontSize: 12 },
  total: { ...T.italic, fontSize: 22, lineHeight: 26 },
  error: { ...T.caption, fontSize: 14, color: C.error, textAlign: 'center' },
});
