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
  /** The signed-in user's id, so their own shots read "You". */
  currentUserId: string | undefined;
  onPressPhoto: (index: number) => void;
}

export function authorLabel(photo: Photo, currentUserId: string | undefined): string {
  return photo.userId === currentUserId ? 'You' : photo.authorName;
}

export function PhotoGrid({ photos, width, currentUserId, onPressPhoto }: PhotoGridProps) {
  const tileWidth = (width - GAP * (COLUMNS - 1)) / COLUMNS;

  return (
    <View style={styles.grid}>
      {photos.map((photo, index) => (
        <PhotoTile
          key={photo.id}
          url={photo.url}
          authorName={authorLabel(photo, currentUserId)}
          width={tileWidth}
          height={tileWidth * HEIGHT_RATIO}
          onPress={() => onPressPhoto(index)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
});
