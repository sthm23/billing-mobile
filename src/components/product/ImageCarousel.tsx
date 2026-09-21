import { Box } from '@/components/ui/box';
import { Icon } from '@/components/ui/icon';
import { Image } from 'expo-image';
import { ImageIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Dimensions, FlatList, ViewToken } from 'react-native';

interface ImageCarouselProps {
  images: { url: string; id: string; isMain: boolean }[];
  productName: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_HEIGHT = 260;

export function ImageCarousel({ images, productName }: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setActiveIndex(viewableItems[0].index ?? 0);
      }
    }
  ).current;

  if (!images || images.length === 0) {
    return (
      <Box
        className="bg-background-50 border-b border-border items-center justify-center"
        style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }}
      >
        <Icon as={ImageIcon} size="xl" className="text-typography-300" />
      </Box>
    );
  }

  return (
    <Box>
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
            style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }}
            contentFit="cover"
            alt={productName}
          />
        )}
      />

      {images.length > 1 && (
        <Box className="flex-row justify-center items-center gap-1.5 py-2">
          {images.map((_, index) => (
            <Box
              key={index}
              className={`rounded-full ${
                index === activeIndex
                  ? 'bg-primary w-4 h-1.5'
                  : 'bg-typography-300 w-1.5 h-1.5'
              }`}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
