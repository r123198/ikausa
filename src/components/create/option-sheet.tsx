import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Sheet } from '@/components/ui/sheet';
import { C, T } from '@/constants/theme';

export interface Option<V> {
  value: V;
  label: string;
  description?: string;
  /** Right-aligned extra text, e.g. a price. */
  trailing?: string;
  image?: number;
}

interface OptionSheetProps<V> {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  options: Option<V>[];
  selected: V;
  onSelect: (value: V) => void;
}

/** Pick one value from a list; closes as soon as something is chosen. */
export function OptionSheet<V extends string | number>({
  visible,
  onClose,
  title,
  subtitle,
  options,
  selected,
  onSelect,
}: OptionSheetProps<V>) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title} subtitle={subtitle}>
      <View style={styles.list} accessibilityRole="radiogroup">
        {options.map((option) => {
          const isSelected = option.value === selected;
          return (
            <Pressable
              key={String(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              style={({ pressed }) => [
                styles.row,
                isSelected && styles.rowSelected,
                pressed && styles.pressed,
              ]}
              onPress={() => {
                onSelect(option.value);
                onClose();
              }}>
              {option.image !== undefined && (
                <Image source={option.image} style={styles.thumb} contentFit="cover" />
              )}
              <View style={styles.text}>
                <Text style={[styles.label, isSelected && styles.labelSelected]}>{option.label}</Text>
                {option.description && <Text style={styles.description}>{option.description}</Text>}
              </View>
              {option.trailing && <Text style={styles.trailing}>{option.trailing}</Text>}
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 60,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: C.cardRaised,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowSelected: { borderColor: C.primary, backgroundColor: 'rgba(255,196,153,0.08)' },
  pressed: { opacity: 0.85 },
  thumb: { width: 44, height: 44, borderRadius: 10 },
  text: { flex: 1, gap: 2 },
  label: { ...T.bodyMd, fontWeight: '600' },
  labelSelected: { color: C.primary },
  description: { ...T.caption },
  trailing: { ...T.caption, fontSize: 14, color: C.textSoft },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: C.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: C.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },
});
