import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { WizardScreen } from '@/components/create/wizard-screen';
import { Icon } from '@/components/icon';
import { C, T } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useCreateEvent, type RevealOption } from '@/context/create-event-context';

const PREVIEW_BLUR = 28;

const OPTIONS: {
  id: RevealOption;
  label: string;
  ios: 'eye' | 'hourglass' | 'timer';
  material: 'visibility' | 'hourglass_top' | 'timer';
  detail: string;
  overlay: string | null;
}[] = [
  {
    id: 'during',
    label: 'During\nEvent',
    ios: 'eye',
    material: 'visibility',
    detail: 'Everyone sees photos as soon as they’re taken.',
    overlay: null,
  },
  {
    id: 'after',
    label: 'After\nEvent',
    ios: 'hourglass',
    material: 'hourglass_top',
    detail: 'Photos stay hidden and develop the moment the roll closes.',
    overlay: 'Develops at close',
  },
  {
    id: 'delay',
    label: 'Additional\nDelay',
    ios: 'timer',
    material: 'timer',
    detail: 'Photos develop 24 hours after the roll closes, like real film.',
    overlay: '+24h after close',
  },
];

const PREVIEWS = [
  require('@/assets/images/samples/trvl_1.jpg'),
  require('@/assets/images/samples/trvl_3.jpg'),
];

export default function RevealStep() {
  const router = useRouter();
  const { session } = useAuth();
  const { revealOption, setRevealOption } = useCreateEvent();
  const selected = OPTIONS.find((o) => o.id === revealOption) ?? OPTIONS[0];
  const owner = (session?.user.user_metadata.display_name as string | undefined)?.split(/\s+/)[0] ?? 'You';

  return (
    <WizardScreen
      step={3}
      title="When should we reveal your photos?"
      subtitle="Like film, photos can stay hidden until they develop. Choose when everyone gets to see them."
      onNext={() => router.push('/create/camera')}>
      <View style={styles.previews}>
        {PREVIEWS.map((src, i) => (
          <View key={i} style={styles.preview}>
            <Image
              source={src}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              blurRadius={selected.overlay ? PREVIEW_BLUR : 0}
              transition={250}
            />
            <Text style={styles.previewName}>{i === 0 ? owner : 'Friend'}</Text>
            {selected.overlay && (
              <View style={styles.overlay}>
                <Icon ios={selected.ios} material={selected.material} size={18} color={C.white} />
                <Text style={styles.overlayText}>{selected.overlay}</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={styles.options} accessibilityRole="radiogroup">
        {OPTIONS.map((o) => {
          const isSelected = o.id === revealOption;
          return (
            <Pressable
              key={o.id}
              accessibilityRole="radio"
              accessibilityLabel={o.label.replace('\n', ' ')}
              accessibilityState={{ checked: isSelected }}
              style={({ pressed }) => [styles.option, isSelected && styles.optionActive, pressed && styles.pressed]}
              onPress={() => setRevealOption(o.id)}>
              <Icon ios={o.ios} material={o.material} size={18} color={isSelected ? C.primary : C.textSoft} />
              <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.detail}>{selected.detail}</Text>
    </WizardScreen>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
  previews: { flexDirection: 'row', gap: 12 },
  preview: {
    flex: 1,
    aspectRatio: 0.72,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: C.card,
  },
  previewName: {
    ...T.caption,
    color: 'rgba(255,255,255,0.85)',
    padding: 14,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  overlayText: { ...T.caption, fontSize: 13, color: C.white, fontWeight: '600' },
  options: { flexDirection: 'row', gap: 10 },
  option: {
    flex: 1,
    minHeight: 112,
    padding: 16,
    borderRadius: 22,
    justifyContent: 'space-between',
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionActive: { borderColor: C.primary, backgroundColor: 'rgba(255,196,153,0.08)' },
  optionLabel: { ...T.bodyMd, fontSize: 15, lineHeight: 20 },
  optionLabelActive: { color: C.primary },
  detail: { ...T.caption, fontSize: 14, textAlign: 'center' },
});
