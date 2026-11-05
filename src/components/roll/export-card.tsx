import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeOut,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Icon } from '@/components/icon';
import { Button } from '@/components/ui/button';
import { C, T } from '@/constants/theme';
import type { ExportVia } from '@/lib/export-common';
import { pluralize } from '@/lib/format';

export type ExportState =
  | { kind: 'running'; done: number; total: number }
  /** iPhone/iPad web: photos are fetched and waiting for the tap that opens the share sheet. */
  | { kind: 'ready'; count: number; failed: number }
  | { kind: 'done'; saved: number; failed: number; via: ExportVia }
  | { kind: 'error'; message: string };

interface ExportCardProps {
  state: ExportState;
  rollFileName: string;
  onRetry: () => void;
  onDismiss: () => void;
  onSaveToPhotos: () => void;
}

function doneCaption(via: ExportVia, rollFileName: string): string {
  switch (via) {
    case 'library':
      return 'They’re in your Photos app.';
    case 'share':
      return 'If you chose Save Images, they’re in your Photos app.';
    case 'zip':
      return `Check your downloads for ${rollFileName}.`;
  }
}

const IS_WEB = Platform.OS === 'web';
const BAR_MS = 280;
const ENTER = FadeInDown.duration(240).reduceMotion(ReduceMotion.System);
const EXIT = FadeOut.duration(160).reduceMotion(ReduceMotion.System);

/** Thin amber bar; grows with scaleX so it stays on the compositor. */
function ProgressBar({ fraction }: { fraction: number }) {
  const progress = useSharedValue(fraction);
  useEffect(() => {
    progress.value = withTiming(fraction, {
      duration: BAR_MS,
      easing: Easing.out(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    });
  }, [fraction, progress]);
  const fill = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.value }] }));
  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, fill]} />
    </View>
  );
}

function Running({ done, total }: { done: number; total: number }) {
  const isPacking = IS_WEB && done === total;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={IS_WEB ? 'Preparing download' : 'Saving to Photos'}
      accessibilityValue={{ min: 0, max: total, now: done, text: `${done} of ${total}` }}
      style={styles.body}>
      <View style={styles.runningTop}>
        <Text style={styles.eyebrow}>{IS_WEB ? 'Preparing your download' : 'Saving to Photos'}</Text>
        <Text style={styles.counter}>
          <Text style={styles.counterDone}>{done}</Text>
          <Text style={styles.counterTotal}> of {total}</Text>
        </Text>
      </View>
      <ProgressBar fraction={total === 0 ? 0 : done / total} />
      <Text style={styles.caption}>
        {isPacking
          ? 'Starting your download…'
          : IS_WEB
            ? 'Packing every photo into one file.'
            : 'Keep Ikausa open until it finishes.'}
      </Text>
    </View>
  );
}

function Outcome({
  tone,
  title,
  caption,
  onRetry,
  onDismiss,
}: {
  tone: 'success' | 'warning';
  title: string;
  caption: string;
  onRetry?: () => void;
  onDismiss: () => void;
}) {
  const isSuccess = tone === 'success';
  return (
    <View style={styles.body} accessibilityLiveRegion="polite">
      <View style={styles.outcomeRow}>
        <View style={[styles.badge, isSuccess ? styles.badgeSuccess : styles.badgeWarning]}>
          <Icon
            ios={isSuccess ? 'checkmark' : 'exclamationmark'}
            material={isSuccess ? 'check' : 'priority_high'}
            size={16}
            color={isSuccess ? C.onPrimary : C.background}
          />
        </View>
        <View style={styles.outcomeText}>
          <Text style={styles.outcomeTitle}>{title}</Text>
          <Text style={styles.caption}>{caption}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          hitSlop={10}
          onPress={onDismiss}
          style={({ pressed }) => [styles.dismiss, pressed && styles.pressed]}>
          <Icon ios="xmark" material="close" size={14} color={C.textMuted} />
        </Pressable>
      </View>
      {onRetry && <Button label="Try again" variant="secondary" size="sm" onPress={onRetry} />}
    </View>
  );
}

function ReadyToSave({
  count,
  failed,
  onSave,
  onDismiss,
}: {
  count: number;
  failed: number;
  onSave: () => void;
  onDismiss: () => void;
}) {
  const option = count === 1 ? 'Save Image' : `Save ${count} Images`;
  return (
    <View style={styles.body} accessibilityLiveRegion="polite">
      <View style={styles.outcomeRow}>
        <View style={[styles.badge, styles.badgeSuccess]}>
          <Icon ios="photo.on.rectangle" material="photo_library" size={15} color={C.onPrimary} />
        </View>
        <View style={styles.outcomeText}>
          <Text style={styles.outcomeTitle}>{pluralize(count, 'photo')} ready</Text>
          <Text style={styles.caption}>
            Tap Save to Photos, then choose “{option}”.
            {failed > 0 ? ` ${pluralize(failed, 'photo')} couldn’t be downloaded.` : ''}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          hitSlop={10}
          onPress={onDismiss}
          style={({ pressed }) => [styles.dismiss, pressed && styles.pressed]}>
          <Icon ios="xmark" material="close" size={14} color={C.textMuted} />
        </Pressable>
      </View>
      <Button
        label="Save to Photos"
        icon={<Icon ios="square.and.arrow.down" material="download" size={16} color={C.onPrimary} />}
        onPress={onSave}
      />
    </View>
  );
}

/** Live export progress under the roll's title, then the result. */
export function ExportCard({ state, rollFileName, onRetry, onDismiss, onSaveToPhotos }: ExportCardProps) {
  return (
    <Animated.View entering={ENTER} exiting={EXIT} style={styles.card}>
      {state.kind === 'running' && <Running done={state.done} total={state.total} />}
      {state.kind === 'ready' && (
        <ReadyToSave count={state.count} failed={state.failed} onSave={onSaveToPhotos} onDismiss={onDismiss} />
      )}
      {state.kind === 'done' && state.failed === 0 && (
        <Outcome
          tone="success"
          title={`Saved ${pluralize(state.saved, 'photo')}`}
          caption={doneCaption(state.via, rollFileName)}
          onDismiss={onDismiss}
        />
      )}
      {state.kind === 'done' && state.failed > 0 && (
        <Outcome
          tone="warning"
          title={`Saved ${state.saved} of ${state.saved + state.failed}`}
          caption={`${pluralize(state.failed, 'photo')} couldn’t be saved. Try again for the rest.`}
          onRetry={onRetry}
          onDismiss={onDismiss}
        />
      )}
      {state.kind === 'error' && (
        <Outcome tone="warning" title="Couldn’t export" caption={state.message} onRetry={onRetry} onDismiss={onDismiss} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.hairline,
    overflow: 'hidden',
  },
  body: { padding: 16, gap: 12 },
  pressed: { opacity: 0.7 },

  runningTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  eyebrow: { ...T.eyebrow, color: C.primary },
  counter: { textAlign: 'right' },
  counterDone: { ...T.italic, fontSize: 26, lineHeight: 30, color: C.onSurface },
  counterTotal: { ...T.caption, fontSize: 14, color: C.textMuted },

  track: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  fill: {
    height: '100%',
    width: '100%',
    borderRadius: 3,
    backgroundColor: C.primary,
    transformOrigin: 'left',
  },
  caption: { ...T.caption, fontSize: 13, lineHeight: 18, color: C.textMuted },

  outcomeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  badgeSuccess: { backgroundColor: C.primary },
  badgeWarning: { backgroundColor: C.error },
  outcomeText: { flex: 1, gap: 2 },
  outcomeTitle: { ...T.title, fontSize: 19, lineHeight: 24 },
  dismiss: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surfaceHigh,
  },
});
