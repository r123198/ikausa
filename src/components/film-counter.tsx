import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { C, T } from '@/constants/theme';

interface FilmCounterProps {
  /** Frame number of the next shot (1-based), or null when unlimited. */
  frame: number | null;
  total: number | null;
}

/** Film-advance style counter: neighbouring frame numbers fade out on each side. */
export function FilmCounter({ frame, total }: FilmCounterProps) {
  const label =
    frame === null || total === null ? 'Unlimited shots' : `Frame ${frame} of ${total}`;

  return (
    <View style={styles.pill} accessibilityLabel={label}>
      <Icon ios="film" material="movie" size={16} color={C.textSoft} />
      {frame === null ? (
        <Text style={styles.current}>∞</Text>
      ) : (
        <View style={styles.numbers}>
          <Text style={styles.side}>{frame > 1 ? frame - 1 : ''}</Text>
          <Text style={styles.current}>{frame}</Text>
          <Text style={styles.side}>{total !== null && frame < total ? frame + 1 : ''}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 52,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: C.black,
    borderWidth: 1,
    borderColor: C.hairline,
  },
  numbers: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  side: { ...T.italic, fontSize: 16, lineHeight: 22, color: 'rgba(255,255,255,0.3)', minWidth: 14 },
  current: { ...T.italic, fontSize: 26, lineHeight: 30, color: C.white },
});
