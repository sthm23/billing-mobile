import { PhotoPlaceholder } from '@/components/base';
import { cn } from '@/libs/utils';
import { Image } from 'expo-image';
import React, { useRef, useState } from 'react';
import { FlatList, View, ViewToken } from 'react-native';

interface ImageCarouselProps {
  images: { url: string; id: string; isMain: boolean }[];
  productName: string;
  /**
   * Content laid over the photo (back / edit buttons)
   */
  overlay?: React.ReactNode;
}

const IMAGE_HEIGHT = 260;

/**
 * Product photo gallery (STHM): rounded block, page dots over the photo.
 */
export function ImageCarousel({ images, productName, overlay }: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [width, setWidth] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setActiveIndex(viewableItems[0].index ?? 0);
      }
    }
  ).current;

  const hasImages = images && images.length > 0;

  return (
    <View
      className="relative rounded-2xl overflow-hidden bg-ph-bg"
      style={{ height: IMAGE_HEIGHT }}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {!hasImages ? (
        <PhotoPlaceholder size="hero" />
      ) : width > 0 ? (
        <FlatList
          data={images}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          renderItem={({ item }) => (
            <Image
              source={{ uri: item.url }}
              style={{ width, height: IMAGE_HEIGHT }}
              contentFit="cover"
              alt={productName}
            />
          )}
        />
      ) : null}

      {hasImages && images.length > 1 && (
        <View className="absolute bottom-3.5 left-0 right-0 flex-row justify-center gap-1.5" pointerEvents="none">
          {images.map((image, index) => (
            <View
              key={image.id}
              className={cn('h-1.5 rounded-full', index === activeIndex ? 'w-4.5 bg-ink' : 'w-1.5 bg-muted')}
            />
          ))}
        </View>
      )}

      {overlay ? (
        <View className="absolute top-3 left-3 right-3 flex-row justify-between" pointerEvents="box-none">
          {overlay}
        </View>
      ) : null}
    </View>
  );
}
