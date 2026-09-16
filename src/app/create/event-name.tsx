import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, T } from '@/constants/theme';

const SUGGESTIONS = ['Salo-salo', 'Handaan', 'Debu', 'Reunion'];

export default function EventNameScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [activeSuggestion, setActiveSuggestion] = useState<string | null>(null);

  function handleSuggestion(s: string) {
    setName(s);
    setActiveSuggestion(s);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text style={styles.headline}>Anong ganap?</Text>

        <View style={styles.inputWrap}>
          <Text style={styles.inputIcon}>✎</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter event name"
            placeholderTextColor={`${C.onSurfaceVariant}55`}
            value={name}
            onChangeText={(t) => {
              setName(t);
              setActiveSuggestion(null);
            }}
            autoFocus
          />
        </View>

        <View style={styles.suggestionsSection}>
          <Text style={styles.suggestionsLabel}>Quick Suggestions</Text>
          <View style={styles.suggestionsGrid}>
            {SUGGESTIONS.map((s) => (
              <Pressable
                key={s}
                style={[styles.chip, activeSuggestion === s && styles.chipActive]}
                onPress={() => handleSuggestion(s)}>
                <Text
                  style={[
                    styles.chipText,
                    activeSuggestion === s && styles.chipTextActive,
                  ]}>
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <Pressable
          style={styles.nextBtn}
          onPress={() => router.push('/create/finish-time')}>
          <Text style={styles.nextBtnLabel}>Next</Text>
          <Text style={styles.nextBtnIcon}>→</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },

  header: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 24, color: C.primary },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },

  headline: { ...T.headlineLgMobile, color: C.onSurface, marginBottom: 40 },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  inputIcon: { fontSize: 18, color: C.primary, opacity: 0.6 },
  input: { flex: 1, ...T.bodyLg, color: C.onSurface, padding: 0 },

  suggestionsSection: { marginTop: 56 },
  suggestionsLabel: {
    ...T.label,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 3,
    color: C.onSurfaceVariant,
    opacity: 0.5,
    marginBottom: 24,
  },
  suggestionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chip: {
    width: '47%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: 'rgba(255,196,153,0.1)',
    borderColor: C.primary,
  },
  chipText: { ...T.headlineMd, fontSize: 20, color: C.onSurface },
  chipTextActive: { color: C.primary },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 24,
    backgroundColor: `${C.background}cc`,
  },
  dots: { flexDirection: 'row', gap: 10 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: `${C.onSurfaceVariant}33`,
  },
  dotActive: {
    backgroundColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.primaryFixed,
    paddingLeft: 32,
    paddingRight: 24,
    paddingVertical: 16,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  nextBtnLabel: { ...T.bodyLg, fontWeight: '700', color: C.onPrimaryFixed },
  nextBtnIcon: { fontSize: 20, color: C.onPrimaryFixed },
});
