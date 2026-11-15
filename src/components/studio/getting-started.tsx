// The three steps of running an event in Studio, for organizers who are new to it.
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { C, T } from '@/constants/theme';

interface Step {
  title: string;
  body: string;
  isDone: boolean;
}

interface GettingStartedProps {
  hasEvent: boolean;
  hasPhotos: boolean;
  onCreate: () => void;
}

export function GettingStarted({ hasEvent, hasPhotos, onCreate }: GettingStartedProps) {
  const steps: Step[] = [
    {
      title: 'Create an event',
      body: 'Name it, pick a plan for the number of guests and set when the roll closes.',
      isDone: hasEvent,
    },
    {
      title: 'Get guests shooting',
      body: 'Open the event and put its QR code at the venue. The print kit has a poster and table cards. Photos stay hidden until the reveal.',
      isDone: hasPhotos,
    },
    {
      title: 'Hand off to your client',
      body: 'After the reveal, send your client a host link from the event page so they can see and download every photo.',
      isDone: false,
    },
  ];
  const current = steps.findIndex((step) => !step.isDone);

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <Text style={[T.eyebrow, styles.eyebrow]}>Getting started</Text>
        <Text style={styles.title}>How Studio works</Text>
      </View>
      <View style={styles.steps}>
        {steps.map((step, index) => {
          const isCurrent = index === current;
          return (
            <View key={step.title} style={[styles.step, isCurrent && styles.stepCurrent]}>
              <View style={[styles.badge, step.isDone && styles.badgeDone, isCurrent && styles.badgeCurrent]}>
                <Text style={[styles.badgeText, step.isDone && styles.badgeTextDone, isCurrent && styles.badgeTextOn]}>
                  {step.isDone ? '✓' : index + 1}
                </Text>
              </View>
              <Text style={[styles.stepTitle, step.isDone && styles.stepTitleDone]}>{step.title}</Text>
              <Text style={styles.stepBody}>{step.body}</Text>
              {isCurrent && index === 0 && (
                <Button label="Create your first event" onPress={onCreate} style={styles.cta} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 16 },
  head: { gap: 4 },
  eyebrow: { color: C.primary },
  title: { ...T.title, fontSize: 26, lineHeight: 32 },
  steps: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  step: {
    flexGrow: 1,
    flexBasis: 260,
    padding: 20,
    gap: 8,
    borderRadius: 18,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.hairline,
  },
  stepCurrent: { backgroundColor: C.cardRaised, borderColor: 'rgba(255,196,153,0.45)' },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.outlineVariant,
    marginBottom: 4,
  },
  badgeDone: { backgroundColor: C.surfaceHighest, borderColor: C.surfaceHighest },
  badgeCurrent: { backgroundColor: C.primary, borderColor: C.primary },
  badgeText: { ...T.caption, fontSize: 13, fontWeight: '600', color: C.textMuted },
  badgeTextDone: { color: C.onSurface },
  badgeTextOn: { color: C.onPrimary },
  stepTitle: { ...T.bodyMd, fontWeight: '600' },
  stepTitleDone: { color: C.textMuted },
  stepBody: { ...T.caption, fontSize: 14, lineHeight: 20, color: C.textSoft },
  cta: { alignSelf: 'flex-start', marginTop: 8 },
});
