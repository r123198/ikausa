import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { StepDots } from '@/components/step-dots';
import { C, T } from '@/constants/theme';
import { EXPORT_OPTIONS, useCreateEvent } from '@/context/create-event-context';

export default function ExportWindowScreen() {
  const router = useRouter();
  const { exportDays, setExportDays } = useCreateEvent();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.backBtn}
          onPress={() => router.back()}>
          <Icon ios="chevron.left" material="arrow_back" size={22} color={C.primary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.headline}>How long can guests export?</Text>
        <Text style={styles.subtext}>
          Once the photos are revealed, everyone can save them to their phone for this long.
          After that, exporting closes.
        </Text>

        <View style={styles.options} accessibilityRole="radiogroup">
          {EXPORT_OPTIONS.map((option) => {
            const isActive = option.days === exportDays;
            return (
              <Pressable
                key={option.days}
                accessibilityRole="radio"
                accessibilityState={{ checked: isActive }}
                style={({ pressed }) => [
                  styles.option,
                  isActive && styles.optionActive,
                  pressed && styles.pressed,
                ]}
                onPress={() => setExportDays(option.days)}>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                    {option.label}
                  </Text>
                  <Text style={styles.optionDesc}>{option.desc}</Text>
                </View>
                <View style={[styles.radio, isActive && styles.radioActive]}>
                  {isActive && <View style={styles.radioDot} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <StepDots step={4} />
        <Pressable
          accessibilityRole="button"
          style={styles.nextBtn}
          onPress={() => router.push('/create/guest-settings')}>
          <Text style={styles.nextBtnLabel}>Next</Text>
          <Icon ios="arrow.right" material="arrow_forward" size={20} color={C.onPrimaryFixed} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  pressed: { opacity: 0.85 },

  header: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32, gap: 12 },

  headline: { ...T.headlineLgMobile },
  subtext: { ...T.bodyMd, color: C.onSurfaceVariant, marginBottom: 20 },

  options: { gap: 12 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  optionActive: { borderColor: C.primary, backgroundColor: 'rgba(255,196,153,0.08)' },
  optionText: { flex: 1, gap: 4 },
  optionLabel: { ...T.headlineMd, fontSize: 22, lineHeight: 28 },
  optionLabelActive: { color: C.primary },
  optionDesc: { ...T.bodyMd, fontSize: 15, lineHeight: 22, color: C.onSurfaceVariant },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: C.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.primary },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 24,
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
  },
  nextBtnLabel: { ...T.bodyLg, fontWeight: '700', color: C.onPrimaryFixed },
});
