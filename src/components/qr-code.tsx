import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { toQR } from 'toqr';

const DARK = '#131313';
const LIGHT = '#ffffff';

interface QrCodeProps {
  value: string;
  /** Rendered width/height of the code itself, excluding the quiet zone. */
  size: number;
}

export function QrCode({ value, size }: QrCodeProps) {
  const matrix = useMemo(() => toQR(value), [value]);
  const modules = Math.sqrt(matrix.length);
  const moduleSize = size / modules;

  return (
    <View style={styles.quietZone} accessibilityRole="image" accessibilityLabel="QR code">
      {Array.from({ length: modules }, (_, y) => (
        <View key={y} style={styles.row}>
          {Array.from({ length: modules }, (_, x) => (
            <View
              key={x}
              style={{
                width: moduleSize,
                height: moduleSize,
                backgroundColor: matrix[y * modules + x] ? DARK : LIGHT,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  quietZone: { backgroundColor: LIGHT, padding: 14, borderRadius: 16 },
  row: { flexDirection: 'row' },
});
