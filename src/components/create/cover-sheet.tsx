import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { PRESET_COVERS } from '@/constants/covers';
import { C, T } from '@/constants/theme';
import type { CoverChoice } from '@/context/create-event-context';

const PICK_QUALITY = 0.85;

interface CoverSheetProps {
  visible: boolean;
  onClose: () => void;
  selected: CoverChoice;
  onSelect: (cover: CoverChoice) => void;
}

export function CoverSheet({ visible, onClose, selected, onSelect }: CoverSheetProps) {
  const [error, setError] = useState<string | null>(null);

  function choose(cover: CoverChoice) {
    onSelect(cover);
    onClose();
  }

  async function pickFromLibrary() {
    setError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [3, 4],
        quality: PICK_QUALITY,
      });
      if (!result.canceled && result.assets[0]) {
        choose({ kind: 'uri', uri: result.assets[0].uri });
      }
    } catch (e) {
      console.error('Image picker failed', e);
      setError("Couldn't open your photos. Check the app's photo permission.");
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="Cover photo" subtitle="It's the first thing guests see.">
      <Button
        label="Choose from library"
        variant="outline"
        icon={<Icon ios="photo" material="add_photo_alternate" size={18} color={C.onSurface} />}
        onPress={pickFromLibrary}
      />
      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.eyebrow}>Or pick one of ours</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {PRESET_COVERS.map((preset) => {
          const isSelected = selected.kind === 'preset' && selected.id === preset.id;
          return (
            <Pressable
              key={preset.id}
              accessibilityRole="radio"
              accessibilityLabel={preset.title}
              accessibilityState={{ checked: isSelected }}
              style={[styles.preset, isSelected && styles.presetSelected]}
              onPress={() => choose({ kind: 'preset', id: preset.id })}>
              <Image source={preset.src} style={StyleSheet.absoluteFill} contentFit="cover" />
            </Pressable>
          );
        })}
      </ScrollView>
      <View />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  eyebrow: { ...T.eyebrow },
  row: { gap: 10 },
  preset: {
    width: 96,
    height: 128,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: C.cardRaised,
  },
  presetSelected: { borderColor: C.primary },
  error: { ...T.caption, color: C.error },
});
