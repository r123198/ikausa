import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, T } from '@/constants/theme';

export default function InvitationCardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.backBtnWrap} onPress={() => router.back()}>
          <View style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </View>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.headline}>Your invitation card</Text>
        <Text style={styles.subtext}>
          Share this card with your guests so they can join your film roll.
        </Text>

        <View style={styles.card}>
          <View style={styles.cardHero}>
            <Image
              source={require('@/assets/images/samples/trvl_4.jpg')}
              style={styles.cardHeroImg}
              contentFit="cover"
            />
            <View style={styles.cardHeroOverlay} />
            <View style={styles.cardHeroText}>
              <Text style={styles.cardBy}>Invited by Rafael</Text>
              <Text style={styles.cardTitle}>Handaan ni Lola</Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.statGrid}>
              <View style={styles.statCard}>
                <View style={styles.statAccent} />
                <View style={styles.statContent}>
                  <Text style={styles.statLabel}>Remaining</Text>
                  <Text style={styles.statValue}>4d 2h</Text>
                </View>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statAccent, styles.statAccentSecondary]} />
                <View style={styles.statContent}>
                  <Text style={styles.statLabel}>Capacity</Text>
                  <Text style={styles.statValue}>24 shots</Text>
                </View>
              </View>
            </View>

            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrIcon}>▦</Text>
              <Text style={styles.qrLabel}>Scan to join</Text>
            </View>

            <View style={styles.codeRow}>
              <Text style={styles.codeLabel}>Code</Text>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>LOLA-2024</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.shareBtn}>
          <Text style={styles.shareBtnLabel}>Share Card</Text>
          <Text style={styles.shareBtnIcon}>↑</Text>
        </Pressable>
        <Pressable
          style={styles.nextBtn}
          onPress={() => router.push('/create/payment-summary')}>
          <Text style={styles.nextBtnLabel}>Continue</Text>
          <Text style={styles.nextBtnIcon}>→</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: { paddingHorizontal: 24, paddingTop: 8 },
  backBtnWrap: {},
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${C.outlineVariant}33`,
  },
  backIcon: { fontSize: 20, color: C.onSurface },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },

  headline: {
    ...T.headlineLgMobile,
    textAlign: 'center',
    color: C.onSurface,
    marginBottom: 8,
  },
  subtext: {
    ...T.bodyMd,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 32,
  },

  card: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: `${C.outlineVariant}33`,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
  },
  cardHero: { height: 280, position: 'relative' },
  cardHeroImg: { width: '100%', height: '100%' },
  cardHeroOverlay: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'transparent',
  },
  cardHeroText: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 28,
  },
  cardBy: {
    ...T.label,
    color: C.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  cardTitle: { ...T.headlineLgMobile, color: C.onSurface },

  cardBody: { padding: 24, gap: 20 },
  statGrid: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: C.surfaceHigh,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: `${C.outlineVariant}33`,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  statAccent: {
    width: 4,
    borderRadius: 2,
    backgroundColor: `${C.primary}80`,
    marginRight: 12,
  },
  statAccentSecondary: { backgroundColor: `${C.secondaryFixedDim}80` },
  statContent: { gap: 6 },
  statLabel: {
    ...T.label,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: C.onSurfaceVariant,
  },
  statValue: { ...T.bodyLg, color: C.onSurface },

  qrPlaceholder: {
    height: 160,
    backgroundColor: C.surfaceLowest,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: `${C.outlineVariant}1a`,
  },
  qrIcon: { fontSize: 64, color: C.onSurfaceVariant, opacity: 0.4 },
  qrLabel: { ...T.label, textTransform: 'uppercase', color: C.onSurfaceVariant, opacity: 0.5 },

  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codeLabel: { ...T.bodyMd, color: C.onSurfaceVariant },
  codeBox: {
    backgroundColor: C.surfaceHigh,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${C.outlineVariant}33`,
  },
  codeText: { ...T.monoBold, fontFamily: 'SpaceMono-Bold', fontSize: 14, color: C.primary },

  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 16,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    paddingVertical: 16,
    borderRadius: 100,
  },
  shareBtnLabel: { ...T.bodyMd, fontWeight: '500', color: C.onSurface },
  shareBtnIcon: { fontSize: 16, color: C.onSurface },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.secondaryFixed,
    paddingVertical: 16,
    borderRadius: 100,
  },
  nextBtnLabel: { ...T.bodyMd, fontWeight: '600', color: C.onSecondaryFixed },
  nextBtnIcon: { fontSize: 16, color: C.onSecondaryFixed },
});
