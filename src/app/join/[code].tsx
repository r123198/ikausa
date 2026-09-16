import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, T } from '@/constants/theme';

export default function JoinScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  const [name, setName] = useState('');

  return (
    <View style={styles.safe}>
      <View style={styles.heroSection}>
        <Image
          source={require('@/assets/images/samples/trvl_5.jpg')}
          style={styles.heroImg}
          contentFit="cover"
        />
        <View style={styles.heroGrad} />
        <SafeAreaView style={styles.heroText} edges={['top']}>
          <View style={styles.heroTextInner}>
            <Text style={styles.invitedBy}>Invited by yebin</Text>
            <Text style={styles.eventTitle}>Brian's party</Text>
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.body}>
        <View style={styles.statGrid}>
          <View style={styles.statCard}>
            <View style={styles.statAccent} />
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Remaining</Text>
              <Text style={styles.statValue}>4d 2h</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statAccent, styles.statAccentSec]} />
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Capacity</Text>
              <Text style={styles.statValue}>24 shots</Text>
            </View>
          </View>
        </View>

        <View style={styles.spacer} />

        <View style={styles.actionArea}>
          <View style={styles.divider} />

          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={`${C.onSurfaceVariant}80`}
              value={name}
              onChangeText={setName}
            />
            <Text style={styles.inputIcon}>◎</Text>
          </View>

          <Pressable
            style={styles.joinBtn}
            onPress={() => router.push('/camera/viewfinder')}>
            <Text style={styles.joinBtnIcon}>◉</Text>
            <Text style={styles.joinBtnLabel}>Take your camera</Text>
          </Pressable>

          <Text style={styles.noAccount}>No account required to join.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.surface },

  heroSection: { height: 440, position: 'relative' },
  heroImg: { width: '100%', height: '100%' },
  heroGrad: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'transparent',
  },
  heroText: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  heroTextInner: {
    padding: 24,
    paddingBottom: 28,
  },
  invitedBy: {
    ...T.label,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: C.primary,
    marginBottom: 8,
  },
  eventTitle: { ...T.headlineLgMobile, color: C.onSurface },

  body: { flex: 1, padding: 24 },

  statGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: C.surfaceHigh,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: `${C.outlineVariant}33`,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statAccent: {
    width: 4,
    borderRadius: 2,
    backgroundColor: `${C.primary}80`,
    marginRight: 12,
  },
  statAccentSec: { backgroundColor: `${C.secondaryFixedDim}80` },
  statContent: { gap: 8 },
  statLabel: {
    ...T.label,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: C.onSurfaceVariant,
  },
  statValue: { ...T.bodyLg, color: C.onSurface },

  spacer: { flex: 1 },

  actionArea: { gap: 16 },
  divider: { height: 1, backgroundColor: `${C.outlineVariant}1a` },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceLow,
    borderWidth: 1,
    borderColor: `${C.outlineVariant}80`,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    ...T.bodyMd,
    color: C.onSurface,
    paddingVertical: 16,
  },
  inputIcon: { fontSize: 20, color: `${C.onSurfaceVariant}80` },

  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.primary,
    borderRadius: 100,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: `${C.primaryFixedDim}33`,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  joinBtnIcon: { fontSize: 20, color: C.onPrimary },
  joinBtnLabel: {
    ...T.label,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: C.onPrimary,
  },

  noAccount: {
    ...T.bodyMd,
    fontSize: 13,
    color: `${C.onSurfaceVariant}99`,
    textAlign: 'center',
  },
});
