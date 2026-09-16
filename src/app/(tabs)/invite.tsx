import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Modal,
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

const INVITE_CODE = 'EMMA-2024';
const INVITE_URL = `https://ikausa.app/join/${INVITE_CODE}`;

// Sample gallery photos matching the reference screen (with author labels)
const SAMPLE_GALLERY_PHOTOS = [
  {
    id: '1',
    src: require('@/assets/images/samples/trvl_4.jpg'),
    author: 'Brian.S',
    aspectRatio: 3 / 4,
  },
  {
    id: '2',
    src: require('@/assets/images/samples/trvl_3.jpg'),
    author: 'Yen.K',
    aspectRatio: 4 / 5,
  },
  {
    id: '3',
    src: require('@/assets/images/samples/trvl_1.jpg'),
    author: 'Rafael.T',
    aspectRatio: 4 / 5,
  },
  {
    id: '4',
    src: require('@/assets/images/samples/trvl_5.jpg'),
    author: 'Sarah.M',
    aspectRatio: 3 / 4,
  },
  {
    id: '5',
    src: require('@/assets/images/samples/trvl_2.jpg'),
    author: 'Brian.S',
    aspectRatio: 4 / 5,
  },
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

export default function InviteScreen() {
  const router = useRouter();
  const { height: screenHeight } = useWindowDimensions();
  const heroTopPadding = Math.max(220, Math.round(screenHeight * 0.33));
  const [photos, setPhotos] = useState<typeof SAMPLE_GALLERY_PHOTOS>(SAMPLE_GALLERY_PHOTOS);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');

  const hasPhotos = photos.length > 0;

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

  // Native share handler
  const handleShare = async () => {
    try {
      await Share.share({
        title: "Emma & Daniel's Wedding day on Ikausa",
        message: `📸 Join our film roll 'Emma & Daniel's Wedding day' on Ikausa!\n\nUse invite code: ${INVITE_CODE}\nOr join directly: ${INVITE_URL}\n\nLet's capture analog memories together!`,
        url: INVITE_URL,
      });
    } catch (error) {
      console.error('Error sharing invite:', error);
    }
  };

  const handleJoinWithCode = () => {
    if (joinCodeInput.trim()) {
      const code = joinCodeInput.trim().toUpperCase();
      setShowJoinModal(false);
      setJoinCodeInput('');
      router.push(`/join/${code}`);
    }
  };

  // Split gallery photos into two columns for natural masonry layout
  const col1 = photos.filter((_, i) => i % 2 === 0);
  const col2 = photos.filter((_, i) => i % 2 === 1);

  return (
    <View style={styles.container}>
      {/* Full-bleed cover image encapsulating the whole page as a background */}
      <Image
        source={require('@/assets/images/samples/trvl_4.jpg')}
        style={styles.bgCoverImage}
        contentFit="cover"
      />

      {/* Gradual fade overlay from top to bottom matching the reference image */}
      <View style={styles.gradientFadeContainer} pointerEvents="none">
        {FADE_SLICES.map((opacity, idx) => (
          <View key={idx} style={[styles.fadeSlice, { opacity }]} />
        ))}
      </View>

      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            !hasPhotos && { paddingTop: heroTopPadding, paddingBottom: 60 },
          ]}
          showsVerticalScrollIndicator={false}>
          {/* Top subtle bar: Join with code + interactive Empty/Populated toggle */}
          <View style={styles.topActionRow}>
            {/* Quick switcher to test empty setup state vs populated gallery */}
            <Pressable
              style={styles.modeToggleBtn}
              onPress={() => setPhotos((prev) => (prev.length > 0 ? [] : SAMPLE_GALLERY_PHOTOS))}
              hitSlop={8}>
              <Text style={styles.modeToggleText}>
                {hasPhotos ? '● Photos Live' : '○ Setup Mode'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.joinWithCodeBtn}
              onPress={() => setShowJoinModal(true)}
              hitSlop={10}>
              <Text style={styles.joinWithCodeText}>Join with code ›</Text>
            </Pressable>
          </View>

          {/* Upper Half: Event Title & Details matching reference */}
          <View style={styles.upperHero}>
            {/* Centered Serif Title */}
            <Text style={styles.eventTitle}>Emma & Daniel's{'\n'}Wedding day</Text>

            {/* 3 Key Stats: Moments, Left, People */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{hasPhotos ? '4,293' : '0'}</Text>
                <Text style={styles.statLabel}>Moments</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statNumber}>1d 23m</Text>
                <Text style={styles.statLabel}>Left</Text>
              </View>

              <Pressable
                style={styles.statItem}
                onPress={() => router.push(`/roll/sample-1`)}>
                <Text style={styles.statNumber}>203</Text>
                <Text style={styles.statLabel}>People ›</Text>
              </Pressable>
            </View>

            {/* Action Bar: Camera Pill + QR Code + Share */}
            <View style={styles.actionRow}>
              {/* Primary Action: White camera pill button */}
              <Pressable
                style={styles.cameraPillBtn}
                onPress={() => router.push('/camera/viewfinder')}>
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
              <Pressable
                style={styles.squareGlassBtn}
                onPress={handleShare}
                hitSlop={8}>
                <View style={styles.downloadIconWrap}>
                  <Text style={styles.downloadArrow}>↓</Text>
                  <View style={styles.downloadTray} />
                </View>
              </Pressable>
            </View>
          </View>

          {/* If there are images already: Show the images below as shown in the image */}
          {hasPhotos && (
            <View style={styles.galleryGrid}>
              {/* Column 1 */}
              <View style={styles.galleryCol}>
                {col1.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[styles.photoCard, { aspectRatio: item.aspectRatio }]}
                    onPress={() => router.push(`/gallery/${item.id}`)}>
                    <Image source={item.src} style={styles.photoImg} contentFit="cover" />
                    <View style={styles.photoVignette} />
                    <Text style={styles.photoAuthorLabel}>{item.author}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Column 2 */}
              <View style={styles.galleryCol}>
                {col2.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[styles.photoCard, { aspectRatio: item.aspectRatio }]}
                    onPress={() => router.push(`/gallery/${item.id}`)}>
                    <Image source={item.src} style={styles.photoImg} contentFit="cover" />
                    <View style={styles.photoVignette} />
                    <Text style={styles.photoAuthorLabel}>{item.author}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* If there are none and we are just setting it up: What shows is the upper half */}
          {!hasPhotos && (
            <View style={styles.emptyNoticeCard}>
              <Text style={styles.emptyNoticeBadge}>READY FOR CAPTURE</Text>
              <Text style={styles.emptyNoticeText}>
                No photos taken yet. Tap the camera above or share your code to start capturing moments.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* QR Code Modal */}
      <Modal
        visible={showQrModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQrModal(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowQrModal(false)}>
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

            {/* Real QR Code */}
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
              Point any camera at this QR code to join Emma & Daniel's Wedding day
            </Text>

            <View style={styles.inviteCodeBadge}>
              <Text style={styles.inviteCodeLabel}>Invite Code</Text>
              <Text style={styles.inviteCodeValue}>{INVITE_CODE}</Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Join With Code Modal */}
      <Modal
        visible={showJoinModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowJoinModal(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowJoinModal(false)}>
          <Pressable style={styles.joinModalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalTopBar}>
              <Text style={styles.joinModalTitle}>Enter Invite Code</Text>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setShowJoinModal(false)}
                hitSlop={12}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.joinModalSub}>
              Enter the 8-character roll code shared with you to start taking photos.
            </Text>

            <TextInput
              style={styles.joinCodeInput}
              placeholder="e.g. LOLA-2024"
              placeholderTextColor="rgba(255, 255, 255, 0.35)"
              value={joinCodeInput}
              onChangeText={setJoinCodeInput}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <Pressable style={styles.joinSubmitBtn} onPress={handleJoinWithCode}>
              <Text style={styles.joinSubmitBtnText}>Join Roll</Text>
            </Pressable>
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

  /* Cover image encapsulating the whole page as a background */
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

  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120, // Extra clearance for floating bottom navigation bar
    gap: 20,
  },
  contentEmpty: {
    paddingBottom: 40,
  },

  /* Top Action Row */
  topActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  modeToggleBtn: {
    backgroundColor: 'rgba(20, 20, 20, 0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modeToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  joinWithCodeBtn: {
    backgroundColor: 'rgba(20, 20, 20, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  joinWithCodeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
  },

  /* Upper Hero Section matching reference image */
  upperHero: {
    alignItems: 'center',
    gap: 24,
    paddingBottom: 8,
  },
  eventTitle: {
    fontFamily: Fonts.playfair,
    fontSize: 34,
    lineHeight: 42,
    textAlign: 'center',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  /* 3 Key Stats: Moments, Left, People */
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
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '600',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  statLabel: {
    ...T.bodyMd,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.72)',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  /* Action Buttons Row: Camera Pill + QR Code + Share */
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  cameraPillBtn: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
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
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(32, 31, 31, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
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

  /* Lower Half: 2-Column Photo Gallery */
  galleryGrid: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  galleryCol: {
    flex: 1,
    gap: 12,
  },
  photoCard: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  photoVignette: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  photoAuthorLabel: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    fontFamily: Fonts.playfair,
    fontStyle: 'italic',
    fontSize: 16,
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  /* Notice shown when setting up / no photos */
  emptyNoticeCard: {
    backgroundColor: 'rgba(24, 24, 24, 0.65)',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  emptyNoticeBadge: {
    ...T.label,
    fontSize: 11,
    color: C.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  emptyNoticeText: {
    ...T.bodyMd,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 18,
  },

  /* QR Modal Styles */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
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

  /* Join Modal Styles */
  joinModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: C.surface,
    borderRadius: 24,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
  },
  joinModalTitle: {
    ...T.headlineMd,
    fontSize: 20,
    color: '#ffffff',
  },
  joinModalSub: {
    ...T.bodyMd,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
  joinCodeInput: {
    backgroundColor: C.surfaceLowest,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontFamily: Fonts.mono,
    color: '#ffffff',
    letterSpacing: 3,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  joinSubmitBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 100,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinSubmitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
  },
});
