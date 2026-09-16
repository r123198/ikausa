import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toQR } from 'toqr';

import { C, Fonts, T } from '@/constants/theme';

const INVITE_CODE = 'LOLA-2024';
const INVITE_URL = `https://ikausa.app/join/${INVITE_CODE}`;

const PRESET_COVERS = [
  { id: '1', title: 'Beach Gathering', src: require('@/assets/images/samples/trvl_4.jpg') },
  { id: '2', title: 'Lake Boat', src: require('@/assets/images/samples/trvl_1.jpg') },
  { id: '3', title: 'Sunset Plane', src: require('@/assets/images/samples/trvl_2.jpg') },
  { id: '4', title: 'Mountain Lake', src: require('@/assets/images/samples/trvl_3.jpg') },
  { id: '5', title: 'Coastal View', src: require('@/assets/images/samples/trvl_5.jpg') },
];

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
  const { height: screenHeight } = useWindowDimensions();
  const heroTopPadding = Math.max(220, Math.round(screenHeight * 0.33));
  const [currentCover, setCurrentCover] = useState<any>(PRESET_COVERS[0].src);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  // Generate real QR code matrix using toqr
  const qrMatrix = useMemo(() => {
    try {
      return toQR(INVITE_URL);
    } catch {
      return new Uint8Array(0);
    }
  }, []);

  const qrSize = Math.sqrt(qrMatrix.length);
  const moduleSize = 4.2;

  // Share invitation card via native Share sheet
  const handleShare = async () => {
    try {
      await Share.share({
        title: "Join 'Handaan ni Lola' on Ikausa!",
        message: `📸 You're invited to join my film roll 'Handaan ni Lola' on Ikausa!\n\nUse invite code: ${INVITE_CODE}\nOr join directly: ${INVITE_URL}\n\nLet's capture analog memories together!`,
        url: INVITE_URL,
      });
    } catch (error) {
      console.error('Error sharing invitation card:', error);
    }
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
                setCurrentCover({ uri: event.target.result as string });
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
    if (urlInput.trim()) {
      setCurrentCover({ uri: urlInput.trim() });
      setUrlInput('');
      setIsPickerOpen(false);
    }
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
          <Pressable style={styles.bareBackBtn} onPress={() => router.back()} hitSlop={14}>
            <Text style={styles.bareBackIcon}>←</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingTop: heroTopPadding }]}
          showsVerticalScrollIndicator={false}>
          {/* Upper Hero: Pulled down with Title label at the center */}
          <View style={styles.upperHero}>
            {/* Centered Serif Title */}
            <Text style={styles.eventTitle}>Handaan ni{'\n'}Lola</Text>

            {/* 3 Key Stats: Moments, Left, People */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Moments</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statNumber}>4d 2h</Text>
                <Text style={styles.statLabel}>Left</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statNumber}>1</Text>
                <Text style={styles.statLabel}>People ›</Text>
              </View>
            </View>

            {/* Action Buttons Row: White Camera Pill + QR Code + Download/Share */}
            <View style={styles.actionRow}>
              {/* Primary Action: White camera pill button */}
              <Pressable
                style={styles.cameraPillBtn}
                onPress={() => setIsPickerOpen(true)}
                hitSlop={4}>
                <View style={styles.cameraIcon}>
                  <View style={styles.cameraIconTopNotch} />
                  <View style={styles.cameraIconBody}>
                    <View style={styles.cameraIconLens} />
                    <View style={styles.cameraIconFlash} />
                  </View>
                </View>
              </Pressable>

              {/* QR Code Action Button */}
              <Pressable
                style={styles.squareGlassBtn}
                onPress={() => setShowQrModal(true)}
                hitSlop={8}>
                <View style={styles.qrIconWrap}>
                  <View style={styles.qrIconRow}>
                    <View style={styles.qrIconSquare} />
                    <View style={styles.qrIconSquare} />
                  </View>
                  <View style={styles.qrIconRow}>
                    <View style={styles.qrIconSquare} />
                    <View style={styles.qrIconSquare} />
                  </View>
                </View>
              </Pressable>

              {/* Share / Download Action Button */}
              <Pressable style={styles.squareGlassBtn} onPress={handleShare} hitSlop={8}>
                <View style={styles.downloadIconWrap}>
                  <Text style={styles.downloadArrow}>↓</Text>
                  <View style={styles.downloadTray} />
                </View>
              </Pressable>
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

      {/* Real Functional QR Code Modal */}
      <Modal
        visible={showQrModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQrModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowQrModal(false)}>
          <Pressable style={styles.qrModalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalTopBar}>
              <Text style={styles.qrModalTitle}>Scan to Join Roll</Text>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setShowQrModal(false)}
                hitSlop={12}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            {/* Real QR Code Matrix */}
            <View style={styles.qrWhiteContainer}>
              {qrSize > 0 ? (
                <View style={styles.qrGrid}>
                  {Array.from({ length: qrSize }).map((_, y) => (
                    <View key={y} style={styles.qrRow}>
                      {Array.from({ length: qrSize }).map((_, x) => (
                        <View
                          key={x}
                          style={{
                            width: moduleSize,
                            height: moduleSize,
                            backgroundColor: qrMatrix[y * qrSize + x]
                              ? '#131313'
                              : '#ffffff',
                          }}
                        />
                      ))}
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.qrFallbackText}>▦</Text>
              )}
            </View>

            <Text style={styles.qrModalSubtitle}>
              Guests can scan this QR code to join Handaan ni Lola
            </Text>

            <View style={styles.inviteCodeBadge}>
              <Text style={styles.inviteCodeLabel}>Invite Code</Text>
              <Text style={styles.inviteCodeValue}>{INVITE_CODE}</Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
                    setCurrentCover(preset.src);
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
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
  bareBackIcon: {
    fontSize: 26,
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
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

  /* Action Buttons Row */
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    paddingTop: 8,
  },
  cameraPillBtn: {
    flex: 1,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  cameraIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconTopNotch: {
    width: 8,
    height: 2.5,
    backgroundColor: '#111111',
    borderTopLeftRadius: 1.5,
    borderTopRightRadius: 1.5,
  },
  cameraIconBody: {
    width: 24,
    height: 17,
    backgroundColor: '#111111',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cameraIconLens: {
    width: 8.5,
    height: 8.5,
    borderRadius: 4.5,
    borderWidth: 1.6,
    borderColor: '#ffffff',
  },
  cameraIconFlash: {
    position: 'absolute',
    top: 2.5,
    right: 3.5,
    width: 2.5,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: '#ffffff',
  },

  squareGlassBtn: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(28, 28, 28, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  /* QR Icon Vector */
  qrIconWrap: {
    width: 20,
    height: 20,
    justifyContent: 'space-between',
  },
  qrIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  qrIconSquare: {
    width: 8,
    height: 8,
    borderRadius: 2,
    borderWidth: 1.6,
    borderColor: '#ffffff',
  },

  /* Download / Share Icon Vector */
  downloadIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
  },
  downloadArrow: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 14,
    fontWeight: '600',
    marginTop: -2,
  },
  downloadTray: {
    width: 16,
    height: 5,
    borderBottomWidth: 1.8,
    borderLeftWidth: 1.8,
    borderRightWidth: 1.8,
    borderColor: '#ffffff',
    borderRadius: 1,
    marginTop: 2,
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
  qrModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: C.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
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
  qrWhiteContainer: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  qrGrid: {
    backgroundColor: '#ffffff',
  },
  qrRow: {
    flexDirection: 'row',
  },
  qrFallbackText: {
    fontSize: 64,
    color: '#111111',
  },
  qrModalSubtitle: {
    ...T.bodyMd,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  inviteCodeBadge: {
    width: '100%',
    backgroundColor: C.surfaceHigh,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inviteCodeLabel: {
    ...T.label,
    fontSize: 11,
    color: C.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  inviteCodeValue: {
    fontFamily: Fonts.mono,
    fontSize: 15,
    fontWeight: '700',
    color: C.primary,
    letterSpacing: 2,
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
