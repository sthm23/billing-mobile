import { Avatar, AvatarFallbackText, AvatarImage } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { ImageIcon } from '@/components/ui/icon';
import { getMainImageUrl } from '@/libs/product-utils';

interface ProductImageProps {
  images?: { url: string; id: string; isMain: boolean }[];
  productName: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-20 w-20',
  lg: 'h-24 w-24',
};

export function ProductImage({ images, productName, size = 'md' }: ProductImageProps) {
  const imageUrl = getMainImageUrl(images);

  return (
    <Avatar className={`${sizeClasses[size]} rounded-lg overflow-hidden bg-background-50`}>
      {imageUrl ? (
        <>
          <AvatarFallbackText>{productName}</AvatarFallbackText>
          <AvatarImage
            source={{ uri: imageUrl }}
            alt={productName}
            className="object-cover"
          />
        </>
      ) : (
        <Icon as={ImageIcon} size="xl" className="text-typography-400" />
      )}
    </Avatar>
  );
}
