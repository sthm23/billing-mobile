import { Box } from '@/components/base';
import { getMainImageUrl } from '@/libs/product-utils';
import { Image } from 'expo-image';
import { ImageIcon } from 'lucide-react-native';
import { useState } from 'react';

interface ProductImageProps {
  images?: { url: string; id: string; isMain: boolean }[];
  productName: string;
  size?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
}

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-20 w-20',
  lg: 'h-24 w-24',
};

const iconSizes = {
  sm: 24,
  md: 32,
  lg: 40,
};

export function ProductImage({ images, productName, size = 'md', onPress }: ProductImageProps) {
  const imageUrl = getMainImageUrl(images);
  const [hasError, setHasError] = useState(false);

  if (!imageUrl || hasError) {
    return (
      <Box
        className={`${sizeClasses[size]} rounded-lg overflow-hidden bg-background-50 border border-border items-center justify-center`}
      >
        <ImageIcon size={iconSizes[size]} color="#9CA3AF" />
      </Box>
    );
  }

  return (
    <Box
      className={`${sizeClasses[size]} rounded-lg overflow-hidden bg-background-50`}
      onTouchEnd={onPress}
    >
      <Image
        source={{ uri: imageUrl }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        alt={productName}
        onError={() => setHasError(true)}
        transition={200}
      />
    </Box>
  );
}
