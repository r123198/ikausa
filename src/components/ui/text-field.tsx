import type { ComponentProps } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { C, T } from '@/constants/theme';

type TextFieldProps = ComponentProps<typeof TextInput> & { label: string };

export function TextField({ label, style, ...inputProps }: TextFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={C.textMuted}
        accessibilityLabel={label}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { ...T.caption, fontSize: 13, fontWeight: '600', color: C.textSoft },
  input: {
    ...T.bodyMd,
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.hairline,
    backgroundColor: C.cardRaised,
    outlineWidth: 0,
  },
});
