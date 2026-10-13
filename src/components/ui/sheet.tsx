import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, T } from '@/constants/theme';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/** Bottom sheet with a grab handle, serif title and scrollable body. */
export function Sheet({ visible, onClose, title, subtitle, children }: SheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.handle} />
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title} accessibilityRole="header">
                {title}
              </Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    maxHeight: '88%',
    backgroundColor: C.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: 8,
  },
  body: { paddingHorizontal: 24, paddingTop: 12, gap: 18 },
  header: { gap: 6 },
  title: { ...T.headlineMd, fontSize: 26, lineHeight: 32 },
  subtitle: { ...T.bodyMd, fontSize: 15, lineHeight: 21, color: C.textMuted },
});
