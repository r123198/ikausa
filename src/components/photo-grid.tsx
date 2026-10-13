import { StyleSheet, View } from 'react-native';

import { PhotoTile } from '@/components/photo-tile';
import type { Photo } from '@/lib/events';

const GAP = 8;
const COLUMNS = 2;
/** Portrait prints, like the camera's 3:4 frame. */
const HEIGHT_RATIO = 4 / 3;

interface PhotoGridProps {
  photos: Photo[];
  width: number;
}

export function PhotoGrid({ photos, width }: PhotoGridProps) {
  const tileWidth = (width - GAP * (COLUMNS - 1)) / COLUMNS;

  return (
    <View style={styles.grid}>
      {photos.map((photo) => (
        <PhotoTile
          key={photo.id}
          url={photo.url}
          authorName={photo.authorName}
          width={tileWidth}
          height={tileWidth * HEIGHT_RATIO}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
});
