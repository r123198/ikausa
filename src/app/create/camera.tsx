import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CameraBody } from '@/components/create/camera-body';
import { WizardScreen } from '@/components/create/wizard-screen';
import { C, T } from '@/constants/theme';
import { useCreateEvent } from '@/context/create-event-context';
import { filmById, FILMS } from '@/lib/film/films';

const FAN = [
  { rotate: '-7deg', translateY: 18 },
  { rotate: '0deg', translateY: 0 },
  { rotate: '7deg', translateY: 18 },
];

export default function CameraStep() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { cameraId, setCameraId } = useCreateEvent();
  const film = filmById(cameraId);
  const cardWidth = Math.min(width * 0.46, 240);

  return (
    <WizardScreen
      step={4}
      title="Which camera would you like to use?"
      subtitle={'Choose a look that fits your event.\n*Original photos are always saved too.'}
      onNext={() => router.push('/create/cover')}>
      <View style={[styles.fan, { height: cardWidth * 1.35 + 30 }]} accessibilityLabel={`${film.name} sample photos`}>
        {film.samples.map((src, i) => (
          <View
            key={`${film.id}-${i}`}
            style={[
              styles.card,
              {
                width: cardWidth,
                height: cardWidth * 1.3,
                zIndex: i === 1 ? 2 : 1,
                marginLeft: i === 0 ? 0 : -cardWidth * 0.45,
                transform: [{ rotate: FAN[i].rotate }, { translateY: FAN[i].translateY }],
              },
            ]}>
            <Image source={src} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          </View>
        ))}
      </View>

      <View style={styles.rule} />

      <View style={styles.bodies} accessibilityRole="radiogroup">
        {FILMS.map((f) => (
          <Pressable
            key={f.id}
            accessibilityRole="radio"
            accessibilityLabel={f.name}
            accessibilityState={{ checked: f.id === film.id }}
            hitSlop={4}
            onPress={() => setCameraId(f.id)}>
            <CameraBody film={f} isSelected={f.id === film.id} />
          </Pressable>
        ))}
      </View>

      <View style={styles.caption}>
        <Text style={styles.name}>{film.name}</Text>
        <Text style={styles.desc}>{film.desc}</Text>
      </View>
    </WizardScreen>
  );
}

const styles = StyleSheet.create({
  fan: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 8 },
  card: {
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.5)',
  },
  rule: { height: 1, backgroundColor: C.hairline },
  bodies: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  caption: { alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  name: { ...T.eyebrow, color: C.onSurface, fontSize: 13 },
  desc: { ...T.bodyMd, fontSize: 15, lineHeight: 22, color: C.textMuted, textAlign: 'center' },
});
