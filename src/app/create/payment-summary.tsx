import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, T } from '@/constants/theme';

const LINE_ITEMS = [
  { label: 'Disposable Camera Roll', value: 'Free' },
  { label: '5 Participants', value: 'Free' },
  { label: '24 shots per person', value: 'Free' },
];

export default function PaymentSummaryScreen() {
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
        <Text style={styles.headline}>Review your roll</Text>
        <Text style={styles.subtext}>Everything looks good — confirm to start your event.</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryEventName}>Handaan ni Lola</Text>
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>Free</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {LINE_ITEMS.map((item, i) => (
            <View key={i} style={styles.lineItem}>
              <Text style={styles.lineItemLabel}>{item.label}</Text>
              <Text style={styles.lineItemValue}>{item.value}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₱0.00</Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Event Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>◷</Text>
            <View>
              <Text style={styles.detailLabel}>Closes</Text>
              <Text style={styles.detailValue}>Mar 20, 2026 · 1:58 AM</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>◎</Text>
            <View>
              <Text style={styles.detailLabel}>Reveal</Text>
              <Text style={styles.detailValue}>During event</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>◈</Text>
            <View>
              <Text style={styles.detailLabel}>Camera</Text>
              <Text style={styles.detailValue}>Disposable · 24 shots</Text>
            </View>
          </View>
        </View>

        <Text style={styles.finePrint}>
          By confirming, you agree to the Sari-Sari Film Club terms of service. No
          payment is charged for this plan.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.confirmBtn}
          onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.confirmBtnLabel}>Start My Film Roll</Text>
          <Text style={styles.confirmBtnIcon}>◉</Text>
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
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32, gap: 16 },

  headline: { ...T.headlineLgMobile, color: C.onSurface, textAlign: 'center' },
  subtext: {
    ...T.bodyMd,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 8,
  },

  summaryCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: `${C.outlineVariant}33`,
    gap: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryEventName: { ...T.headlineMd, fontSize: 22, color: C.onSurface },
  freeBadge: {
    backgroundColor: `${C.primary}1a`,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: `${C.primary}4d`,
  },
  freeBadgeText: { ...T.label, color: C.primary },

  divider: { height: 1, backgroundColor: `${C.outlineVariant}33` },

  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lineItemLabel: { ...T.bodyMd, color: C.onSurfaceVariant },
  lineItemValue: { ...T.bodyMd, color: C.onSurface, fontWeight: '500' },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { ...T.headlineMd, fontSize: 20, color: C.onSurface },
  totalValue: { ...T.headlineMd, fontSize: 20, color: C.primary },

  detailsCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: `${C.outlineVariant}33`,
    gap: 16,
  },
  detailsTitle: { ...T.label, textTransform: 'uppercase', letterSpacing: 1.5, color: C.onSurfaceVariant },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  detailIcon: { fontSize: 20, color: C.onSurfaceVariant, marginTop: 2 },
  detailLabel: { ...T.label, color: C.onSurfaceVariant, marginBottom: 4 },
  detailValue: { ...T.bodyMd, color: C.onSurface },

  finePrint: {
    ...T.bodyMd,
    fontSize: 12,
    color: C.onSurfaceVariant,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 18,
  },

  footer: { paddingHorizontal: 24, paddingBottom: 48, paddingTop: 8 },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: C.primary,
    paddingVertical: 18,
    borderRadius: 100,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  confirmBtnLabel: {
    ...T.label,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: C.onPrimary,
  },
  confirmBtnIcon: { fontSize: 16, color: C.onPrimary },
});
