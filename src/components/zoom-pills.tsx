import { Pressable, StyleSheet, Text, View } from 'react-native';

import { C } from '@/constants/theme';

interface ZoomPillsProps {
  hasUltraWide: boolean;
  isUltraWide: boolean;
  isZoomed: boolean;
  onSelectLens: (ultraWide: boolean) => void;
}

/**
 * iPhone-style lens buttons. Shown when there's a 0.5× lens to switch to, or
 * as a single 1× button to reset after pinching.
 */
export function ZoomPills({ hasUltraWide, isUltraWide, isZoomed, onSelectLens }: ZoomPillsProps) {
  if (!hasUltraWide && !isZoomed) return null;

  const stops = [
    ...(hasUltraWide ? [{ ultraWide: true, short: '.5', full: '0.5×' }] : []),
    { ultraWide: false, short: '1', full: '1×' },
  ];

  return (
    <View style={styles.row}>
      {stops.map((stop) => {
        const isActive = stop.ultraWide === isUltraWide;
        return (
          <Pressable
            key={stop.full}
            accessibilityRole="button"
            accessibilityLabel={`${stop.full} zoom`}
            accessibilityState={{ selected: isActive }}
            hitSlop={6}
            style={[styles.pill, isActive && styles.pillActive]}
            onPress={() => onSelectLens(stop.ultraWide)}>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {isActive ? stop.full : stop.short}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 4,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  pill: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  pillActive: { width: 38, height: 38, borderRadius: 19 },
  label: { color: C.white, fontSize: 11, fontWeight: '600' },
  labelActive: { color: C.primary, fontSize: 13 },
});
