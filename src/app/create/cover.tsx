import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoverSheet } from '@/components/create/cover-sheet';
import { WizardScreen } from '@/components/create/wizard-screen';
import { Icon } from '@/components/icon';
import { RollHero } from '@/components/roll-hero';
import { Button } from '@/components/ui/button';
import { PRESET_COVERS } from '@/constants/covers';
import { C, T } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useCreateEvent } from '@/context/create-event-context';
import { timeUntil } from '@/lib/format';

const PHONE_WIDTH = 210;

export default function CoverStep() {
  const router = useRouter();
  const { session } = useAuth();
  const draft = useCreateEvent();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { cover } = draft;
  const coverSource =
    cover.kind === 'preset'
      ? (PRESET_COVERS.find((p) => p.id === cover.id) ?? PRESET_COVERS[0]).src
      : { uri: cover.uri };
  const host = (session?.user.user_metadata.display_name as string | undefined) ?? 'you';
  const shots = draft.selectedShot.value === 'unlimited' ? 'Unlimited' : String(draft.selectedShot.value);
  const name = draft.name.trim() || 'Your roll';

  return (
    <WizardScreen
      step={5}
      title="Design your invitation card."
      subtitle="The cover is the first thing guests see when they’re invited to your roll."
      onNext={() => router.push('/create/guests')}>
      <View style={styles.card}>
        <View style={styles.phone} accessibilityLabel="Invitation preview">
          <Image source={coverSource} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.2)', '#000']}
            locations={[0.35, 0.6, 0.92]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.notch} />
          <View style={styles.phoneBody}>
            <View style={styles.invitedChip}>
              <Icon ios="person.fill" material="person" size={9} color={C.textSoft} />
              <Text style={styles.invitedText}>Invited by {host}</Text>
            </View>
            <Text style={styles.phoneTitle} numberOfLines={2}>
              {name}
            </Text>
            <View style={styles.phoneMeta}>
              <Icon ios="clock" material="schedule" size={9} color={C.textSoft} />
              <Text style={styles.phoneMetaText}>{timeUntil(draft.endsAt)}</Text>
              <Icon ios="camera.fill" material="photo_camera" size={9} color={C.textSoft} />
              <Text style={styles.phoneMetaText}>{shots} shots each</Text>
            </View>
            <View style={styles.phoneButton}>
              <Text style={styles.phoneButtonText}>Join roll</Text>
            </View>
          </View>
        </View>

        <View style={styles.rule} />

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            onPress={() => setIsPickerOpen(true)}>
            <Icon ios="photo" material="add_photo_alternate" size={18} color={C.onSurface} />
            <Text style={styles.actionText}>Edit cover image</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            onPress={() => setIsPreviewOpen(true)}>
            <Icon ios="eye" material="visibility" size={18} color={C.onSurface} />
            <Text style={styles.actionText}>Preview</Text>
          </Pressable>
        </View>
      </View>

      <CoverSheet
        visible={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        selected={draft.cover}
        onSelect={draft.setCover}
      />

      <Modal visible={isPreviewOpen} animationType="slide" onRequestClose={() => setIsPreviewOpen(false)}>
        <View style={styles.previewRoot}>
          <RollHero
            cover={null}
            coverSource={coverSource}
            eyebrow={`Invited by ${host}`}
            title={name}
            stats={[
              { value: shots, label: 'Shots each' },
              { value: timeUntil(draft.endsAt), label: 'Left' },
              { value: '1', label: 'People' },
            ]}
          />
          <SafeAreaView edges={['bottom']} style={styles.previewFooter}>
            <Text style={styles.previewNote}>This is what guests see when they open your invite.</Text>
            <Button label="Close preview" variant="outline" onPress={() => setIsPreviewOpen(false)} />
          </SafeAreaView>
        </View>
      </Modal>
    </WizardScreen>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.8 },
  card: {
    borderRadius: 28,
    padding: 20,
    gap: 18,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.hairline,
    alignItems: 'center',
  },
  phone: {
    width: PHONE_WIDTH,
    aspectRatio: 0.49,
    borderRadius: 34,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#3a3a44',
    backgroundColor: '#000',
    justifyContent: 'flex-end',
  },
  notch: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    width: 62,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#000',
  },
  phoneBody: { padding: 12, gap: 7, alignItems: 'center' },
  invitedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  invitedText: { ...T.caption, fontSize: 9, lineHeight: 12, color: C.textSoft },
  phoneTitle: { ...T.title, fontSize: 18, lineHeight: 22, color: C.white, textAlign: 'center' },
  phoneMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  phoneMetaText: { ...T.caption, fontSize: 9, lineHeight: 12, color: C.textSoft, marginRight: 4 },
  phoneButton: {
    alignSelf: 'stretch',
    marginTop: 4,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: C.primary,
  },
  phoneButtonText: { ...T.caption, fontSize: 10, lineHeight: 13, color: C.onPrimary, fontWeight: '700' },
  rule: { alignSelf: 'stretch', height: 1, backgroundColor: C.hairline },
  actions: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: C.cardRaised,
  },
  actionText: { ...T.bodyMd, fontSize: 15 },
  previewRoot: { flex: 1, backgroundColor: C.background, justifyContent: 'space-between' },
  previewFooter: { padding: 20, gap: 12 },
  previewNote: { ...T.caption, fontSize: 14, textAlign: 'center' },
});
