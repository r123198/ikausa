import { Modal, Share, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { C, T } from '@/constants/theme';
import { inviteUrl } from '@/lib/invite';

interface CreatedDialogProps {
  name: string;
  inviteCode: string;
  onDone: () => void;
}

export function CreatedDialog({ name, inviteCode, onDone }: CreatedDialogProps) {
  const url = inviteUrl(inviteCode);

  async function handleShare() {
    try {
      await Share.share({ title: `Join ${name}`, message: `Shoot "${name}" with me on Ikausa: ${url}`, url });
    } catch (error) {
      console.error('Share failed', error);
    }
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDone}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal>
          <View style={styles.logo}>
            <Logo size={52} />
          </View>
          <Text style={styles.title} accessibilityRole="header">
            Roll created!
          </Text>
          <Text style={styles.body}>Your roll “{name}” is ready.</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Share code</Text>
            <Text style={styles.code} selectable>
              {inviteCode}
            </Text>
            <Text style={styles.link} selectable numberOfLines={2}>
              {url}
            </Text>
          </View>
          <Button
            label="Share invite link"
            icon={<Icon ios="square.and.arrow.up" material="ios_share" size={18} color={C.onPrimary} />}
            onPress={handleShare}
          />
          <Button label="Open roll" variant="outline" onPress={onDone} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    padding: 24,
    gap: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.hairline,
  },
  logo: { alignItems: 'center' },
  title: { ...T.headlineMd, fontSize: 28, textAlign: 'center' },
  body: { ...T.bodyMd, fontSize: 15, color: C.textSoft, textAlign: 'center' },
  codeBox: { borderRadius: 18, padding: 16, gap: 4, alignItems: 'center', backgroundColor: C.cardRaised },
  codeLabel: { ...T.eyebrow, fontSize: 10 },
  code: { ...T.italic, fontSize: 26, lineHeight: 32, letterSpacing: 4 },
  link: { ...T.caption, fontSize: 12, textAlign: 'center' },
});
