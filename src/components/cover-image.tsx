import { Image } from 'expo-image';
import { StyleSheet, View, type ImageStyle, type StyleProp } from 'react-native';

import { LogoWatermark } from '@/components/logo';
import { useCoverSource } from '@/constants/covers';
import { C } from '@/constants/theme';

interface CoverImageProps {
  cover: string | null;
  style: StyleProp<ImageStyle>;
}

/** An event's cover, or a neutral placeholder while it loads / when there is none. */
export function CoverImage({ cover, style }: CoverImageProps) {
  const source = useCoverSource(cover);
  return source ? (
    <Image source={source} style={style} contentFit="cover" transition={200} />
  ) : (
    <View style={[style, styles.fallback]}>
      <LogoWatermark />
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { backgroundColor: C.cardRaised },
});
