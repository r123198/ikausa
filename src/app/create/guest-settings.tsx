import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, Fonts, T } from '@/constants/theme';

/**
 * Exchange rate for USD to PHP conversion.
 * Formula: Math.ceil(usd * USD_TO_PHP_RATE) - 0.01
 * Converted one by one, rounded up to the highest whole number and minus 0.01,
 * resulting in '.99' ending in Philippine Pesos (₱).
 */
export const USD_TO_PHP_RATE = 62;

export function formatPhpPrice(usd: number): string {
  if (usd === 0) return 'Free';
  const php = Math.ceil(usd * USD_TO_PHP_RATE) - 0.01;
  return `₱${php.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export interface ParticipantTier {
  id: string;
  count: number | 'unlimited';
  displayCount: string;
  title: string;
  usdPrice: number;
  priceFormatted: string;
  isFree: boolean;
}

export const PARTICIPANT_TIERS: ParticipantTier[] = [
  {
    id: '5',
    count: 5,
    displayCount: '5',
    title: 'Up to\n5 Participants',
    usdPrice: 0,
    priceFormatted: 'Free',
    isFree: true,
  },
  {
    id: '10',
    count: 10,
    displayCount: '10',
    title: 'Up to\n10 Participants',
    usdPrice: 1.99,
    priceFormatted: formatPhpPrice(1.99),
    isFree: false,
  },
  {
    id: '25',
    count: 25,
    displayCount: '25',
    title: 'Up to\n25 Participants',
    usdPrice: 4.99,
    priceFormatted: formatPhpPrice(4.99),
    isFree: false,
  },
  {
    id: '50',
    count: 50,
    displayCount: '50',
    title: 'Up to\n50 Participants',
    usdPrice: 14.99,
    priceFormatted: formatPhpPrice(14.99),
    isFree: false,
  },
  {
    id: '100',
    count: 100,
    displayCount: '100',
    title: 'Up to\n100 Participants',
    usdPrice: 29.99,
    priceFormatted: formatPhpPrice(29.99),
    isFree: false,
  },
  {
    id: '150',
    count: 150,
    displayCount: '150',
    title: 'Up to\n150 Participants',
    usdPrice: 49.99,
    priceFormatted: formatPhpPrice(49.99),
    isFree: false,
  },
  {
    id: '200',
    count: 200,
    displayCount: '200',
    title: 'Up to\n200 Participants',
    usdPrice: 69.99,
    priceFormatted: formatPhpPrice(69.99),
    isFree: false,
  },
  {
    id: 'unlimited',
    count: 'unlimited',
    displayCount: '∞',
    title: 'Unlimited\nParticipants',
    usdPrice: 99.99,
    priceFormatted: formatPhpPrice(99.99),
    isFree: false,
  },
];

export interface ShotOption {
  id: string;
  value: number | 'unlimited';
  label: string;
  usdPrice: number;
  priceFormatted: string;
  isFree: boolean;
}

export const SHOT_OPTIONS: ShotOption[] = [
  { id: '5', value: 5, label: '5', usdPrice: 0, priceFormatted: 'Free', isFree: true },
  { id: '10', value: 10, label: '10', usdPrice: 0, priceFormatted: 'Free', isFree: true },
  { id: '16', value: 16, label: '16', usdPrice: 0, priceFormatted: 'Free', isFree: true },
  { id: '24', value: 24, label: '24', usdPrice: 0, priceFormatted: 'Free', isFree: true },
  { id: '36', value: 36, label: '36', usdPrice: 0, priceFormatted: 'Free', isFree: true },
  {
    id: 'unlimited',
    value: 'unlimited',
    label: '∞',
    usdPrice: 9.99,
    priceFormatted: formatPhpPrice(9.99),
    isFree: false,
  },
];

const SAMPLES = [
  require('@/assets/images/samples/trvl_3.jpg'),
  require('@/assets/images/samples/trvl_4.jpg'),
  require('@/assets/images/samples/trvl_5.jpg'),
];

/**
 * 35mm Rolling Film Strip & Canister Component.
 * Replaces the arbitrary icon with an authentic analog 35mm film canister
 * and rolling negative film strip featuring sprocket perforations and frame numbers.
 */
function RollingFilmView({
  currentFrame,
  prevFrame,
}: {
  currentFrame: string;
  prevFrame: string;
}) {
  return (
    <View style={styles.filmRollWrap}>
      {/* 35mm Film Canister / Spool */}
      <View style={styles.canisterBody}>
        <View style={styles.canisterSpoolTop} />
        <View style={styles.canisterCylinder}>
          <View style={styles.canisterStripe} />
        </View>
        <View style={styles.canisterSpoolBottom} />
      </View>

      {/* Exposed Rolling Film Strip */}
      <View style={styles.filmStrip}>
        {/* Top sprocket holes */}
        <View style={styles.sprocketRow}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.sprocketHole} />
          ))}
        </View>

        {/* Center film frames */}
        <View style={styles.filmFrameArea}>
          {prevFrame ? (
            <>
              <Text style={styles.filmFramePrev}>{prevFrame}</Text>
              <View style={styles.filmFrameDivider} />
            </>
          ) : null}
          <Text style={styles.filmFrameCurrent}>{currentFrame}</Text>
        </View>

        {/* Bottom sprocket holes */}
        <View style={styles.sprocketRow}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.sprocketHole} />
          ))}
        </View>
      </View>
    </View>
  );
}

/**
 * Stylized Half-iPhone Camera Mockup.
 * Features an iPhone frame, Dynamic Island pill cutout, and the iconic
 * circular iPhone camera shutter button.
 */
function HalfIphoneView() {
  return (
    <View style={styles.iphoneBody}>
      {/* Dynamic Island pill */}
      <View style={styles.dynamicIsland}>
        <View style={styles.cameraDot} />
      </View>

      {/* Shutter Button centered in phone interface */}
      <View style={styles.iphoneShutterBtn}>
        <View style={styles.iphoneShutterInner} />
      </View>

      {/* Bottom home indicator line */}
      <View style={styles.homeIndicator} />
    </View>
  );
}

export default function GuestSettingsScreen() {
  const router = useRouter();
  const [selectedParticipantId, setSelectedParticipantId] = useState('5');
  const [selectedShotId, setSelectedShotId] = useState('24');
  const [visible, setVisible] = useState(true);

  const currentParticipant =
    PARTICIPANT_TIERS.find((p) => p.id === selectedParticipantId) || PARTICIPANT_TIERS[0];
  const currentShot =
    SHOT_OPTIONS.find((s) => s.id === selectedShotId) || SHOT_OPTIONS[3];

  const prevFrameNum =
    currentShot.value === 'unlimited'
      ? '36'
      : typeof currentShot.value === 'number' && currentShot.value > 5
      ? `${currentShot.value - 1}`
      : '';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Bare back button */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Top title with ample breathing room */}
        <View style={styles.top}>
          <Text style={styles.headline}>How many guests{'\n'}for your film?</Text>
          <Text style={styles.subtext}>
            Make sure all guests have a chance to take the most amazing photo from
            your event.
          </Text>
        </View>

        {/* 1. PARTICIPANTS SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{currentParticipant.title}</Text>
            {/* Bare text price indicator (no enclosing boxes or borders) */}
            <Text
              style={[
                styles.barePriceText,
                !currentParticipant.isFree && styles.barePriceTextPaid,
              ]}>
              {currentParticipant.priceFormatted}
            </Text>
          </View>

          {/* Selectable participant blocks (NO prices inside blocks, cleanly centered numbers) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.slotsScroll}>
            {PARTICIPANT_TIERS.map((tier) => {
              const isActive = selectedParticipantId === tier.id;
              return (
                <Pressable
                  key={tier.id}
                  style={[styles.slot, isActive && styles.slotActive]}
                  onPress={() => setSelectedParticipantId(tier.id)}>
                  <Text style={[styles.slotCount, isActive && styles.slotCountActive]}>
                    {tier.displayCount}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.divider} />

        {/* 2. SHOTS PER PERSON SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Shots per person</Text>
            {/* Bare text price indicator */}
            <Text
              style={[
                styles.barePriceText,
                !currentShot.isFree && styles.barePriceTextPaid,
              ]}>
              {currentShot.isFree ? 'Free' : currentShot.priceFormatted}
            </Text>
          </View>

          {/* Camera widget: 35mm Rolling Film on Left, Half-iPhone in Center, Photo Stack on Right */}
          <View style={styles.cameraWidget}>
            {/* Left side: Rolling film canister & film strip with frame numbers */}
            <RollingFilmView
              currentFrame={currentShot.label}
              prevFrame={prevFrameNum}
            />

            {/* Center: Half of an iPhone with Dynamic Island and Camera Shutter Button */}
            <HalfIphoneView />

            {/* Right side: Photo stack emerging from the camera */}
            <View style={styles.photoStack}>
              {SAMPLES.map((src, i) => {
                const rotations = [-12, 2, 14];
                return (
                  <Image
                    key={i}
                    source={src}
                    style={[
                      styles.photoStackItem,
                      { transform: [{ rotate: `${rotations[i]}deg` }] },
                      i === 1 && { zIndex: 10, top: 8 },
                      i === 2 && { zIndex: 5 },
                    ]}
                    contentFit="cover"
                  />
                );
              })}
            </View>
          </View>

          {/* Shot Options: Clean bare chips without text-clipping borders */}
          <View style={styles.shotOptions}>
            {SHOT_OPTIONS.map((opt) => {
              const isActive = selectedShotId === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  style={[styles.shotOption, isActive && styles.shotOptionActive]}
                  onPress={() => setSelectedShotId(opt.id)}>
                  <Text
                    style={[
                      styles.shotOptionText,
                      isActive && styles.shotOptionTextActive,
                    ]}>
                    {opt.label}
                  </Text>
                  {isActive && <View style={styles.shotOptionActiveBar} />}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.divider} />

        {/* 3. VISIBILITY PERMISSIONS SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Visibility permissions</Text>
          <View style={styles.toggleRow}>
            <Switch
              value={visible}
              onValueChange={setVisible}
              trackColor={{ false: C.surfaceHighest, true: C.primaryContainer }}
              thumbColor={C.onSurface}
            />
            <Text style={styles.toggleLabel}>Everyone can see all photos.</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <View style={styles.dots}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.dot, i === 4 && styles.dotActive]} />
          ))}
        </View>
        <Pressable
          style={styles.createBtn}
          onPress={() => router.push('/create/camera-selection')}>
          <Text style={styles.createBtnLabel}>Create</Text>
          <Text style={styles.createBtnIcon}>→</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: { paddingHorizontal: 20, paddingTop: 6 },
  backBtn: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  backIcon: { fontSize: 24, color: C.onSurface },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 32 },

  top: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  headline: {
    ...T.headlineLgMobile,
    fontSize: 30,
    lineHeight: 38,
    textAlign: 'center',
    color: C.onSurface,
    marginBottom: 8,
  },
  subtext: {
    ...T.bodyMd,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 320,
    alignSelf: 'center',
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },

  section: { gap: 14, marginBottom: 8 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sectionTitle: {
    ...T.headlineMd,
    fontSize: 24,
    color: C.onSurface,
    lineHeight: 30,
  },

  /* Bare text price indicators (no enclosing box or border) */
  barePriceText: {
    fontSize: 18,
    fontWeight: '600',
    color: C.onSurfaceVariant,
    fontFamily: Fonts.mono,
    lineHeight: 26,
  },
  barePriceTextPaid: {
    fontSize: 20,
    fontWeight: '700',
    color: C.primary,
  },

  /* Participant selectable blocks (clean numbers, NO prices inside) */
  slotsScroll: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
    paddingRight: 12,
  },
  slot: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotActive: {
    borderColor: C.primary,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 196, 153, 0.12)',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  slotCount: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: C.onSurface,
    fontFamily: Fonts.mono,
  },
  slotCountActive: {
    color: C.primary,
    fontWeight: '800',
  },

  divider: { height: 1, backgroundColor: `${C.outlineVariant}33`, marginVertical: 20 },

  sectionLabel: {
    ...T.label,
    fontSize: 12,
    lineHeight: 16,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    color: C.onSurfaceVariant,
  },

  /* Camera widget staging the iPhone in the center with rolling film & photo stack on the sides */
  cameraWidget: {
    height: 152,
    borderRadius: 28,
    backgroundColor: C.surfaceLowest,
    borderWidth: 1,
    borderColor: `${C.outlineVariant}33`,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
  },

  /* 35mm Rolling Film Component */
  filmRollWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  canisterBody: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
  },
  canisterSpoolTop: {
    width: 8,
    height: 3,
    backgroundColor: '#8a7e72',
    borderRadius: 1.5,
    marginBottom: 1,
  },
  canisterCylinder: {
    width: 18,
    height: 48,
    backgroundColor: '#262422',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3d3835',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  canisterStripe: {
    position: 'absolute',
    width: '100%',
    height: 14,
    backgroundColor: 'rgba(255, 196, 153, 0.25)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 196, 153, 0.4)',
  },
  canisterSpoolBottom: {
    width: 8,
    height: 3,
    backgroundColor: '#8a7e72',
    borderRadius: 1.5,
    marginTop: 1,
  },
  filmStrip: {
    height: 46,
    backgroundColor: '#171514',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    paddingHorizontal: 6,
    justifyContent: 'space-between',
    paddingVertical: 3,
    minWidth: 54,
  },
  sprocketRow: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'space-between',
  },
  sprocketHole: {
    width: 4,
    height: 3,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filmFrameArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  filmFramePrev: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255, 255, 255, 0.35)',
    fontFamily: Fonts.mono,
  },
  filmFrameDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filmFrameCurrent: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    color: C.primary,
    fontFamily: Fonts.mono,
  },

  /* Half-iPhone Camera Mockup in Center */
  iphoneBody: {
    width: 112,
    height: 144,
    backgroundColor: '#1b1a19',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    overflow: 'hidden',
  },
  dynamicIsland: {
    width: 34,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 5,
    marginTop: 2,
  },
  cameraDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
    backgroundColor: '#1d2731',
  },
  iphoneShutterBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3.5,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  iphoneShutterInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  homeIndicator: {
    width: 38,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 2,
  },

  /* Photo Stack on Right */
  photoStack: {
    width: 80,
    height: 80,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoStackItem: {
    position: 'absolute',
    width: 46,
    height: 50,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: C.secondaryFixed,
  },

  /* Shot Options: Clean bare items with accent underline, no clipping */
  shotOptions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  shotOption: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shotOptionActive: {
    backgroundColor: 'rgba(255, 196, 153, 0.12)',
  },
  shotOptionText: {
    fontSize: 16,
    lineHeight: 22,
    color: C.onSurface,
    fontWeight: '600',
    fontFamily: Fonts.mono,
  },
  shotOptionTextActive: {
    color: C.primary,
    fontWeight: '800',
  },
  shotOptionActiveBar: {
    position: 'absolute',
    bottom: 4,
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: C.primary,
  },

  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  toggleLabel: { ...T.bodyMd, fontSize: 15, color: C.onSurface },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 16,
  },
  dots: { flexDirection: 'row', gap: 10 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.surfaceHighest,
  },
  dotActive: {
    backgroundColor: C.onSurface,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.onSurface,
    paddingLeft: 24,
    paddingRight: 16,
    paddingVertical: 12,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  createBtnLabel: { ...T.label, textTransform: 'uppercase', color: C.background },
  createBtnIcon: { fontSize: 18, color: C.background },
});
