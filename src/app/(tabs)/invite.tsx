import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, T } from '@/constants/theme';

export default function InviteScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Invite</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Join a roll</Text>
          <Text style={styles.sectionSubtext}>
            Enter an invite code to join a friend's film roll.
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.codeInput}
              placeholder="Enter invite code"
              placeholderTextColor={`${C.onSurfaceVariant}66`}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Pressable
              style={styles.joinBtn}
              onPress={() => router.push('/join/LOLA-2024')}>
              <Text style={styles.joinBtnText}>Join</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Share your roll</Text>
          <Text style={styles.sectionSubtext}>
            Invite friends to shoot on your active film rolls.
          </Text>

          <View style={styles.rollRow}>
            <View style={styles.rollInfo}>
              <View style={styles.rollDot} />
              <View style={styles.rollTextWrap}>
                <Text style={styles.rollName}>Brian's party</Text>
                <Text style={styles.rollCode}>Code: BRIA-2024</Text>
              </View>
            </View>
            <Pressable style={styles.shareBtn}>
              <Text style={styles.shareBtnText}>Share</Text>
              <Text style={styles.shareBtnIcon}>↑</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>◎</Text>
          <Text style={styles.emptyTitle}>Share the vibe</Text>
          <Text style={styles.emptyText}>
            Each roll has a unique code and QR card. Send it to your barkada and shoot together.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },

  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerTitle: { ...T.headlineMd, color: C.onSurface },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 120, gap: 24 },

  section: { gap: 12 },
  sectionLabel: { ...T.headlineMd, fontSize: 20, color: C.onSurface },
  sectionSubtext: { ...T.bodyMd, color: C.onSurfaceVariant, lineHeight: 22 },

  inputRow: { flexDirection: 'row', gap: 10 },
  codeInput: {
    flex: 1,
    ...T.bodyMd,
    color: C.onSurface,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: `${C.outlineVariant}66`,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  joinBtn: {
    backgroundColor: C.secondaryFixed,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtnText: { ...T.bodyMd, fontWeight: '600', color: C.onSecondaryFixed },

  divider: { height: 1, backgroundColor: `${C.outlineVariant}1a` },

  rollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: `${C.outlineVariant}33`,
  },
  rollInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rollDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4ade80',
  },
  rollTextWrap: { gap: 2 },
  rollName: { ...T.bodyMd, fontWeight: '600', color: C.onSurface },
  rollCode: { ...T.label, color: C.onSurfaceVariant },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },
  shareBtnText: { ...T.label, color: C.onSurface },
  shareBtnIcon: { fontSize: 14, color: C.onSurface },

  emptyCard: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${C.outlineVariant}1a`,
    gap: 12,
  },
  emptyIcon: { fontSize: 40, color: C.onSurfaceVariant, opacity: 0.4 },
  emptyTitle: { ...T.headlineMd, fontSize: 18, color: C.onSurface },
  emptyText: {
    ...T.bodyMd,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
  },
});
