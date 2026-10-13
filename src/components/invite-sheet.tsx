import { Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { QrCode } from '@/components/qr-code';
import { Button } from '@/components/ui/button';
import { C, T } from '@/constants/theme';
import { inviteUrl } from '@/lib/invite';

const QR_SIZE = 200;

interface InviteSheetProps {
  visible: boolean;
  onClose: () => void;
  eventName: string;
  inviteCode: string;
}

export function InviteSheet({ visible, onClose, eventName, inviteCode }: InviteSheetProps) {
  const insets = useSafeAreaInsets();
  const url = inviteUrl(inviteCode);

  async function handleShare() {
    try {
      await Share.share({
        title: `Join ${eventName}`,
        message: `You're invited to shoot photos at "${eventName}" on Ikausa.\nJoin here: ${url}\nOr enter code ${inviteCode}`,
        url,
      });
    } catch (error) {
      console.error('Share failed', error);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close invite" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            Invite friends to {eventName}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            hitSlop={12}
            style={styles.close}>
            <Icon ios="xmark" material="close" size={18} color={C.onSurfaceVariant} />
          </Pressable>
        </View>
        <Text style={styles.subtitle}>
          They can scan this code with their phone camera, or you can send them the link.
        </Text>

        <View style={styles.qrWrap}>
          <QrCode value={url} size={QR_SIZE} />
        </View>

        <View style={styles.codeRow}>
          <Text style={styles.codeLabel}>Invite code</Text>
          <Text style={styles.code} selectable>
            {inviteCode}
          </Text>
        </View>

        <Button
          label="Share invite link"
          onPress={handleShare}
          icon={<Icon ios="square.and.arrow.up" material="ios_share" size={20} color={C.onPrimary} />}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 10,
    gap: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.outlineVariant,
    marginBottom: 6,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { ...T.headlineMd, fontSize: 24, lineHeight: 30, flex: 1 },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surfaceHighest,
  },
  subtitle: { ...T.bodyMd, fontSize: 15, lineHeight: 22, color: C.onSurfaceVariant },
  qrWrap: { alignItems: 'center', paddingVertical: 4 },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: C.surfaceHigh,
  },
  codeLabel: { ...T.bodyMd, fontSize: 14, color: C.onSurfaceVariant },
  code: { ...T.bodyLg, fontWeight: '700', letterSpacing: 3, color: C.onSurface },
});
