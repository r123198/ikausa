import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, T } from '@/constants/theme';

const SAMPLES = [
  require('@/assets/images/samples/trvl_1.jpg'),
  require('@/assets/images/samples/trvl_2.jpg'),
];

/**
 * Options mapped to Flutter's standard Material Outlined Icons:
 * - 'during': Icons.visibility_outlined (iOS SF Symbol: 'eye')
 * - 'after':  Icons.schedule_outlined   (iOS SF Symbol: 'clock')
 * - 'delay':  Icons.hourglass_empty_outlined (iOS SF Symbol: 'hourglass')
 */
const OPTIONS = [
  {
    id: 'during',
    flutterIcon: 'Icons.visibility_outlined',
    symbolName: { ios: 'eye' as const, android: 'visibility' as const, web: 'visibility' as const },
    label: 'During\nEvent',
  },
  {
    id: 'after',
    flutterIcon: 'Icons.schedule_outlined',
    symbolName: { ios: 'clock' as const, android: 'schedule' as const, web: 'schedule' as const },
    label: 'After\nEvent',
  },
  {
    id: 'delay',
    flutterIcon: 'Icons.hourglass_empty_outlined',
    symbolName: { ios: 'hourglass' as const, android: 'hourglass_empty' as const, web: 'hourglass_empty' as const },
    label: 'Additional\nDelay',
  },
];

/**
 * Vector Outlined Fallback for Flutter `Icons.visibility_outlined` / SF Symbol `eye`.
 * Clean, hollow eye outline with an outlined pupil ring.
 */
function VisibilityOutlinedIcon({ color, size = 24 }: { color: string; size?: number }) {
  const width = size;
  const height = size * 0.62;
  const pupilSize = size * 0.28;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width,
          height,
          borderRadius: height / 2,
          borderWidth: 1.8,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
        }}>
        <View
          style={{
            width: pupilSize,
            height: pupilSize,
            borderRadius: pupilSize / 2,
            borderWidth: 1.8,
            borderColor: color,
            backgroundColor: 'transparent',
          }}
        />
      </View>
    </View>
  );
}

/**
 * Vector Outlined Fallback for Flutter `Icons.schedule_outlined` / SF Symbol `clock`.
 * Clean circular outline with hollow interior and L-shaped clock hands.
 */
function ScheduleOutlinedIcon({ color, size = 24 }: { color: string; size?: number }) {
  const diameter = size * 0.88;
  const stroke = 1.8;
  const center = diameter / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
          borderWidth: stroke,
          borderColor: color,
          backgroundColor: 'transparent',
        }}>
        {/* Minute hand pointing to 12 */}
        <View
          style={{
            position: 'absolute',
            width: stroke,
            height: diameter * 0.32,
            backgroundColor: color,
            top: center * 0.35,
            left: center - stroke / 2,
            borderRadius: stroke / 2,
          }}
        />
        {/* Hour hand pointing to 3 */}
        <View
          style={{
            position: 'absolute',
            width: diameter * 0.26,
            height: stroke,
            backgroundColor: color,
            top: center - stroke / 2,
            left: center - stroke / 2,
            borderRadius: stroke / 2,
          }}
        />
        {/* Pivot dot */}
        <View
          style={{
            position: 'absolute',
            width: stroke * 1.3,
            height: stroke * 1.3,
            borderRadius: (stroke * 1.3) / 2,
            backgroundColor: color,
            top: center - (stroke * 1.3) / 2,
            left: center - (stroke * 1.3) / 2,
          }}
        />
      </View>
    </View>
  );
}

/**
 * Vector Outlined Fallback for Flutter `Icons.hourglass_empty_outlined` / SF Symbol `hourglass`.
 * Clean hollow hourglass outline with top and bottom plates and meeting funnels.
 */
function HourglassOutlinedIcon({ color, size = 24 }: { color: string; size?: number }) {
  const plateWidth = size * 0.72;
  const stroke = 1.8;
  const halfH = size * 0.36;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Top Plate */}
      <View
        style={{
          width: plateWidth,
          height: stroke,
          borderRadius: stroke / 2,
          backgroundColor: color,
        }}
      />

      {/* Hourglass body */}
      <View style={{ width: plateWidth, height: halfH * 2, alignItems: 'center', justifyContent: 'center' }}>
        {/* Top chamber diagonals */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: plateWidth * 0.12,
            width: stroke,
            height: halfH,
            backgroundColor: color,
            borderRadius: stroke / 2,
            transform: [{ rotate: '-24deg' }],
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: plateWidth * 0.12,
            width: stroke,
            height: halfH,
            backgroundColor: color,
            borderRadius: stroke / 2,
            transform: [{ rotate: '24deg' }],
          }}
        />

        {/* Center waist */}
        <View
          style={{
            position: 'absolute',
            width: stroke * 1.8,
            height: stroke,
            backgroundColor: color,
            borderRadius: stroke / 2,
          }}
        />

        {/* Bottom chamber diagonals */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: plateWidth * 0.12,
            width: stroke,
            height: halfH,
            backgroundColor: color,
            borderRadius: stroke / 2,
            transform: [{ rotate: '24deg' }],
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            right: plateWidth * 0.12,
            width: stroke,
            height: halfH,
            backgroundColor: color,
            borderRadius: stroke / 2,
            transform: [{ rotate: '-24deg' }],
          }}
        />
      </View>

      {/* Bottom Plate */}
      <View
        style={{
          width: plateWidth,
          height: stroke,
          borderRadius: stroke / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

function renderFallbackIcon(id: string, color: string) {
  if (id === 'during') return <VisibilityOutlinedIcon color={color} />;
  if (id === 'after') return <ScheduleOutlinedIcon color={color} />;
  return <HourglassOutlinedIcon color={color} />;
}

export default function RevealSettingsScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState('during');

  return (
    <SafeAreaView style={styles.safe}>
      {/* Bare back button matching minimal design */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={12}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.top}>
          <Text style={styles.headline}>When should we reveal{'\n'}your photos?</Text>
          <Text style={styles.subtext}>
            Photos are hidden by default during the event. You can select when the
            photos will be revealed.
          </Text>
        </View>

        {/* Analog Photo Cards Preview */}
        <View style={styles.photoCards}>
          <View style={[styles.photoCard, { transform: [{ rotate: '-2deg' }] }]}>
            <Image source={SAMPLES[0]} style={styles.photoCardImg} contentFit="cover" />
            <Text style={styles.photoCardLabel}>Yen.K</Text>
          </View>
          <View style={[styles.photoCard, { transform: [{ rotate: '2deg' }], marginTop: 16 }]}>
            <Image source={SAMPLES[1]} style={styles.photoCardImg} contentFit="cover" />
            <Text style={styles.photoCardLabel}>Brian.S</Text>
          </View>
        </View>

        {/* Options Grid with Outlined Flutter Icons & Refined Color Design */}
        <View style={styles.optionsGrid}>
          {OPTIONS.map((opt) => {
            const isActive = selected === opt.id;
            const iconColor = isActive ? C.primary : C.outline;

            return (
              <Pressable
                key={opt.id}
                style={[
                  styles.optCard,
                  isActive && styles.optCardActive,
                ]}
                onPress={() => setSelected(opt.id)}>
                {/* Outlined Icon Container */}
                <View
                  style={[
                    styles.iconBox,
                    isActive && styles.iconBoxActive,
                  ]}>
                  <SymbolView
                    name={opt.symbolName}
                    size={24}
                    type="monochrome"
                    weight="regular"
                    tintColor={iconColor}
                    fallback={renderFallbackIcon(opt.id, iconColor)}
                  />
                </View>

                {/* Option Label */}
                <Text
                  style={[
                    styles.optLabel,
                    isActive && styles.optLabelActive,
                  ]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <View style={styles.dots}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.dot, i === 2 && styles.dotActive]} />
          ))}
        </View>
        <Pressable
          style={styles.nextBtn}
          onPress={() => router.push('/create/guest-settings')}>
          <Text style={styles.nextBtnLabel}>Next</Text>
          <Text style={styles.nextBtnIcon}>→</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backBtn: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  backIcon: {
    fontSize: 24,
    color: C.onSurface,
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  top: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headline: {
    ...T.headlineLgMobile,
    textAlign: 'center',
    color: C.onSurface,
    marginBottom: 10,
  },
  subtext: {
    ...T.bodyMd,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 290,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },

  /* Photo Cards */
  photoCards: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  photoCard: {
    flex: 1,
    aspectRatio: 4 / 5,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  photoCardImg: {
    width: '100%',
    height: '100%',
  },
  photoCardLabel: {
    position: 'absolute',
    top: 12,
    left: 12,
    ...T.bodyMd,
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  /* Options Grid */
  optionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  optCard: {
    flex: 1,
    minHeight: 126,
    borderRadius: 18,
    padding: 16,
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  optCardActive: {
    backgroundColor: 'rgba(255, 196, 153, 0.08)',
    borderWidth: 1.5,
    borderColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },

  /* Outlined Icon Box */
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: {
    backgroundColor: 'rgba(255, 196, 153, 0.14)',
    borderColor: 'rgba(255, 196, 153, 0.32)',
  },

  /* Option Typography */
  optLabel: {
    ...T.bodyMd,
    fontSize: 13.5,
    fontWeight: '500',
    color: C.onSurfaceVariant,
    lineHeight: 18,
    opacity: 0.75,
  },
  optLabelActive: {
    color: '#ffffff',
    fontWeight: '700',
    opacity: 1,
  },

  /* Footer */
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 16,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.surfaceHighest,
  },
  dotActive: {
    backgroundColor: C.onSurface,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.secondaryFixed,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 100,
  },
  nextBtnLabel: {
    ...T.label,
    textTransform: 'uppercase',
    color: C.onSecondaryFixed,
  },
  nextBtnIcon: {
    fontSize: 16,
    color: C.onSecondaryFixed,
  },
});
