import { PhotoPlaceholder } from '@/components/base';
import { getMainImageUrl } from '@/libs/product-utils';
import { cn } from '@/libs/utils';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable } from 'react-native';

interface ProductImageProps {
  images?: { url: string; id: string; isMain: boolean }[];
  productName: string;
  /**
   * `sm` 44px, `md` 56px (list rows), `lg` 64px
   */
  size?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
}

const sizeClasses = {
  sm: 'w-11 h-11 rounded-sm',
  md: 'w-14 h-14 rounded-[14px]',
  lg: 'w-16 h-16 rounded-[14px]',
};

/**
 * Product thumbnail: main image, or the STHM photo placeholder when there is
 * no image or it fails to load.
 */
export function ProductImage({ images, productName, size = 'md', onPress }: ProductImageProps) {
  const imageUrl = getMainImageUrl(images);
  const [hasError, setHasError] = useState(false);

  if (!imageUrl || hasError) {
    return <PhotoPlaceholder size={size} />;
  }

  return (
    <Pressable
      className={cn('overflow-hidden bg-ph-bg', sizeClasses[size])}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'imagebutton' : 'image'}
      accessibilityLabel={productName}
    >
      <Image
        source={{ uri: imageUrl }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        alt={productName}
        onError={() => setHasError(true)}
        transition={200}
      />
    </Pressable>
  );
}
