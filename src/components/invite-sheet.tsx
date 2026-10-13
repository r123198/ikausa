import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { QrCode } from '@/components/qr-code';
import { Button } from '@/components/ui/button';
import { DottedDivider } from '@/components/ui/dotted-divider';
import { Sheet } from '@/components/ui/sheet';
import { C, T } from '@/constants/theme';
import { inviteUrl } from '@/lib/invite';

const QR_SIZE = 176;
const COPIED_RESET_MS = 2000;

interface InviteSheetProps {
  visible: boolean;
  onClose: () => void;
  eventName: string;
  inviteCode: string;
}

export function InviteSheet({ visible, onClose, eventName, inviteCode }: InviteSheetProps) {
  const url = inviteUrl(inviteCode);
  const [isCopied, setIsCopied] = useState(false);

  async function handleShare() {
    try {
      await Share.share({
        title: `Join ${eventName}`,
        message: `Shoot "${eventName}" with me on Ikausa: ${url}`,
        url,
      });
    } catch (error) {
      console.error('Share failed', error);
    }
  }

  async function handleCopy() {
    await Clipboard.setStringAsync(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), COPIED_RESET_MS);
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Shoot it together"
      subtitle={`Let friends frame ${eventName} too, your night through their lens.`}>
      <DottedDivider />

      <View style={styles.qr}>
        <QrCode value={url} size={QR_SIZE} />
        <Text style={styles.code} selectable accessibilityLabel={`Invite code ${inviteCode}`}>
          {inviteCode}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          label="Share link"
          variant="outline"
          size="sm"
          style={styles.action}
          icon={<Icon ios="link" material="link" size={16} color={C.onSurface} />}
          onPress={handleShare}
        />
        <Button
          label={isCopied ? 'Copied' : 'Copy link'}
          variant="outline"
          size="sm"
          style={styles.action}
          icon={
            <Icon
              ios={isCopied ? 'checkmark' : 'doc.on.doc'}
              material={isCopied ? 'check' : 'content_copy'}
              size={16}
              color={C.onSurface}
            />
          }
          onPress={handleCopy}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  qr: { alignItems: 'center', gap: 12, paddingTop: 4 },
  code: { ...T.italic, fontSize: 18, letterSpacing: 4, color: C.textSoft },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  action: { minWidth: 140 },
});
