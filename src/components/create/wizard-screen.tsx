import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StepDots } from '@/components/create/step-dots';
import { Icon } from '@/components/icon';
import { C, T } from '@/constants/theme';

interface WizardScreenProps {
  step: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  nextLabel?: string;
  canContinue?: boolean;
  isBusy?: boolean;
  onNext: () => void;
  /** Shown above the footer, e.g. a validation hint or error. */
  footerNote?: string | null;
  scroll?: boolean;
}

/** Shared frame for the create-roll steps: back, centered serif title, dots + Next. */
export function WizardScreen({
  step,
  title,
  subtitle,
  children,
  nextLabel = 'Next',
  canContinue = true,
  isBusy = false,
  onNext,
  footerNote,
  scroll = true,
}: WizardScreenProps) {
  const router = useRouter();
  const header = (
    <View style={styles.header}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={step === 1 ? 'Close' : 'Back'}
          hitSlop={10}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
          <Icon ios="chevron.left" material="arrow_back" size={20} color={C.onSurface} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {header}
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, styles.flex]}>
            {header}
            {children}
          </View>
        )}
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        {footerNote && (
          <Text style={styles.footerNote} accessibilityLiveRegion="polite">
            {footerNote}
          </Text>
        )}
        <View style={styles.footerRow}>
          <StepDots step={step} />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canContinue || isBusy, busy: isBusy }}
            disabled={!canContinue || isBusy}
            style={({ pressed }) => [
              styles.next,
              (!canContinue || isBusy) && styles.nextDisabled,
              pressed && styles.pressed,
            ]}
            onPress={onNext}>
            {isBusy && <ActivityIndicator color={C.onPrimary} />}
            <Text style={styles.nextLabel}>{nextLabel}</Text>
            {!isBusy && <Icon ios="arrow.right" material="arrow_forward" size={16} color={C.onPrimary} />}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
  topBar: { paddingHorizontal: 20, paddingTop: 4 },
  backBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.hairline,
  },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, gap: 24 },
  header: { alignItems: 'center', gap: 10, paddingHorizontal: 12 },
  title: { ...T.headlineLgMobile, fontSize: 32, lineHeight: 38, textAlign: 'center' },
  subtitle: { ...T.bodyMd, fontSize: 15, lineHeight: 22, color: C.textMuted, textAlign: 'center' },
  footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 10 },
  footerNote: { ...T.caption, fontSize: 14, color: C.error, textAlign: 'center' },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  next: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 52,
    paddingHorizontal: 24,
    borderRadius: 18,
    backgroundColor: C.primary,
  },
  nextDisabled: { opacity: 0.4 },
  nextLabel: { ...T.bodyMd, fontWeight: '700', color: C.onPrimary },
});
