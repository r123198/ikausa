import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { ZoomablePhoto } from '@/components/zoomable-photo';
import { C, T } from '@/constants/theme';

interface PhotoViewerProps {
  /** Most recent first. */
  urls: string[];
  /** Optional line under the counter for each photo, e.g. who took it. */
  captions?: string[];
  initialIndex: number;
  onClose: () => void;
}

/** Full-screen photos you swipe left and right through and pinch to zoom, like the iPhone Photos app. */
export function PhotoViewer({ urls, captions, initialIndex, onClose }: PhotoViewerProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const caption = captions?.[index];

  function handleScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  }

  return (
    <Modal visible animationType="fade" onRequestClose={onClose} supportedOrientations={['portrait']}>
      {/* Modals render outside the app's root view, so gestures need their own root. */}
      <GestureHandlerRootView style={styles.root}>
        <FlatList
          data={urls}
          keyExtractor={(url) => url}
          horizontal
          pagingEnabled
          scrollEnabled={!isZoomed}
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={handleScrollEnd}
          renderItem={({ item }) => (
            <ZoomablePhoto
              url={item}
              width={width}
              height={height}
              isZoomed={isZoomed}
              onZoomChange={setIsZoomed}
            />
          )}
        />

        <View style={[styles.header, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={10}
            style={styles.closeBtn}
            onPress={onClose}>
            <Icon ios="xmark" material="close" size={20} color={C.white} />
          </Pressable>
          <View style={styles.titleBlock} accessibilityLiveRegion="polite">
            <Text style={styles.counter}>
              {index + 1} of {urls.length}
            </Text>
            {caption && (
              <Text style={styles.caption} numberOfLines={1}>
                {caption}
              </Text>
            )}
          </View>
          <View style={styles.closeBtn} />
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.black },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  titleBlock: { flex: 1, alignItems: 'center', gap: 2 },
  counter: { ...T.caption, color: C.white, fontSize: 14 },
  caption: { ...T.caption, color: C.textSoft, fontSize: 13 },
});
