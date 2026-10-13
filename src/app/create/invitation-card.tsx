import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { PRESET_COVERS } from '@/constants/covers';
import { C, Fonts, T } from '@/constants/theme';
import { useCreateEvent, type CoverChoice } from '@/context/create-event-context';
import { timeUntil } from '@/lib/format';

// Gradual fade starting from upper-middle down to solid dark velvet (#131313) at bottom
const FADE_SLICE_COUNT = 32;
const FADE_SLICES = Array.from({ length: FADE_SLICE_COUNT }).map((_, i) => {
  const progress = i / (FADE_SLICE_COUNT - 1); // 0.0 to 1.0
  if (progress < 0.28) return 0;
  const t = (progress - 0.28) / 0.48;
  if (t >= 1) return 0.98;
  return Math.min(0.98, Number((Math.pow(t, 1.6) * 0.98).toFixed(3)));
});

export default function InvitationCardScreen() {
  const router = useRouter();
  const { formattedName, cover, setCover, endsAt } = useCreateEvent();
  const { height: screenHeight } = useWindowDimensions();
  const heroTopPadding = Math.max(220, Math.round(screenHeight * 0.33));
  const currentCover =
    cover.kind === 'preset'
      ? (PRESET_COVERS.find((p) => p.id === cover.id) ?? PRESET_COVERS[0]).src
      : { uri: cover.uri };
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  const updateCover = (next: CoverChoice) => {
    setCover(next);
  };

  // Upload image handler
  const handleUploadFromDevice = () => {
    if (Platform.OS === 'web') {
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e: any) => {
          const file = e.target?.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                updateCover({ kind: 'uri', uri: event.target.result as string });
                setIsPickerOpen(false);
              }
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      } catch (err) {
        console.error('File input error:', err);
      }
    } else {
      setIsPickerOpen(true);
    }
  };

  const handleApplyUrl = () => {
    const url = urlInput.trim();
    if (!/^https:\/\/\S+$/i.test(url)) {
      setUrlError('Enter an image link that starts with https://');
      return;
    }
    updateCover({ kind: 'uri', uri: url });
    setUrlInput('');
    setUrlError(null);
    setIsPickerOpen(false);
  };

  return (
    <View style={styles.container}>
      {/* Full-bleed cover image encapsulating the whole page as a background */}
      <Image source={currentCover} style={styles.bgCoverImage} contentFit="cover" />

      {/* Gradual fade overlay from top to bottom matching the reference image */}
      <View style={styles.gradientFadeContainer} pointerEvents="none">
        {FADE_SLICES.map((opacity, idx) => (
          <View key={idx} style={[styles.fadeSlice, { opacity }]} />
        ))}
      </View>

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Bare top navigation row: Only the bare back button */}
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={styles.bareBackBtn}
            onPress={() => router.back()}
            hitSlop={14}>
            <Icon ios="chevron.left" material="arrow_back" size={22} color="#ffffff" />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingTop: heroTopPadding }]}
          showsVerticalScrollIndicator={false}>
          {/* Upper Hero: Pulled down with Title label at the center */}
          <View style={styles.upperHero}>
            {/* Centered Serif Title */}
            <Text style={styles.eventTitle}>{formattedName}</Text>

            {/* 3 Key Stats: Moments, Left, People */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Moments</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{timeUntil(endsAt)}</Text>
                <Text style={styles.statLabel}>Left</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statNumber}>1</Text>
                <Text style={styles.statLabel}>People</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Bar: Edit Photo and Continue */}
        <View style={styles.bottomBar}>
          <Pressable
            style={styles.secondaryChangeBtn}
            onPress={() => setIsPickerOpen(true)}
            hitSlop={6}>
            <Text style={styles.secondaryChangeText}>Edit Photo</Text>
          </Pressable>

          <Pressable
            style={styles.continueBtn}
            onPress={() => router.push('/create/payment-summary')}>
            <Text style={styles.continueBtnText}>Continue</Text>
            <Text style={styles.continueBtnIcon}>→</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Upload Image / Change Cover Modal */}
      <Modal
        visible={isPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setIsPickerOpen(false)}>
          <Pressable style={styles.pickerModalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalTopBar}>
              <Text style={styles.qrModalTitle}>Change Cover Photo</Text>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setIsPickerOpen(false)}
                hitSlop={12}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            {/* Upload from device action */}
            <Pressable style={styles.uploadActionBtn} onPress={handleUploadFromDevice}>
              <Text style={styles.uploadActionIcon}>📁</Text>
              <Text style={styles.uploadActionText}>
                {Platform.OS === 'web'
                  ? 'Upload Photo from Device'
                  : 'Upload Custom Photo'}
              </Text>
            </Pressable>

            {/* Preset Covers Carousel */}
            <Text style={styles.presetsTitle}>Or select a curated cover:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetsRow}>
              {PRESET_COVERS.map((preset) => (
                <Pressable
                  key={preset.id}
                  style={styles.presetThumbWrap}
                  onPress={() => {
                    updateCover({ kind: 'preset', id: preset.id });
                    setIsPickerOpen(false);
                  }}>
                  <Image source={preset.src} style={styles.presetThumbImg} contentFit="cover" />
                  <Text style={styles.presetThumbLabel} numberOfLines={1}>
                    {preset.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Custom URL Input */}
            <Text style={styles.urlInputTitle}>Or paste image URL:</Text>
            <View style={styles.urlInputRow}>
              <TextInput
                style={styles.urlInput}
                placeholder="https://images.unsplash.com/..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={urlInput}
                onChangeText={setUrlInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable style={styles.urlApplyBtn} onPress={handleApplyUrl}>
                <Text style={styles.urlApplyBtnText}>Apply</Text>
              </Pressable>
            </View>
            {urlError && <Text style={styles.urlError}>{urlError}</Text>}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  urlError: { ...T.bodyMd, fontSize: 13, color: C.error },
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  safe: {
    flex: 1,
  },

  /* Background image encapsulating the whole page without any blocks */
  bgCoverImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  /* Gradual fade overlay from transparent top to solid dark bottom */
  gradientFadeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'column',
    experimental_backgroundImage:
      'linear-gradient(180deg, rgba(19, 19, 19, 0) 0%, rgba(19, 19, 19, 0) 28%, rgba(19, 19, 19, 0.28) 45%, rgba(19, 19, 19, 0.72) 65%, rgba(19, 19, 19, 0.96) 80%, #131313 100%)',
  },
  fadeSlice: {
    flex: 1,
    width: '100%',
    backgroundColor: '#131313',
  },

  /* Bare Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  bareBackBtn: {
    padding: 6,
    alignSelf: 'flex-start',
  },

  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 36,
  },

  /* Upper Hero: Pulled down with Title centered */
  upperHero: {
    alignItems: 'center',
    gap: 26,
  },
  eventTitle: {
    fontFamily: Fonts.playfair,
    fontSize: 38,
    lineHeight: 46,
    textAlign: 'center',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },

  /* 3 Key Stats */
  statsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 16,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontFamily: Fonts.playfair,
    fontStyle: 'italic',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '600',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  statLabel: {
    ...T.bodyMd,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.82)',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  /* Bottom Bar */
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'rgba(18, 18, 18, 0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  secondaryChangeBtn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  secondaryChangeText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  continueBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 100,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
  },
  continueBtnIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
  },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  qrModalTitle: {
    ...T.headlineMd,
    fontSize: 20,
    color: '#ffffff',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalCloseText: {
    fontSize: 18,
    color: C.onSurfaceVariant,
  },

  /* Change Cover Modal */
  pickerModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: C.surface,
    borderRadius: 24,
    padding: 22,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
  },
  uploadActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.surfaceHigh,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  uploadActionIcon: {
    fontSize: 18,
  },
  uploadActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.onSurface,
  },
  presetsTitle: {
    ...T.bodyMd,
    fontSize: 13,
    color: C.onSurfaceVariant,
  },
  presetsRow: {
    gap: 12,
    paddingVertical: 4,
  },
  presetThumbWrap: {
    width: 90,
    alignItems: 'center',
    gap: 6,
  },
  presetThumbImg: {
    width: 90,
    height: 115,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  presetThumbLabel: {
    fontSize: 11,
    color: C.onSurface,
    fontWeight: '500',
  },
  urlInputTitle: {
    ...T.bodyMd,
    fontSize: 13,
    color: C.onSurfaceVariant,
  },
  urlInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  urlInput: {
    flex: 1,
    backgroundColor: C.surfaceLowest,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: C.onSurface,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  urlApplyBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  urlApplyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.onPrimary,
  },
});
