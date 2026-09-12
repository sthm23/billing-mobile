import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';

export function ProductCardSkeleton() {
  return (
    <Box className="flex-row bg-card rounded-lg p-4">
      {/* Image Skeleton */}
      <Box className="h-20 w-20 bg-background-100 rounded-lg" />

      {/* Info Skeleton */}
      <VStack className="flex-1 ml-3 justify-between">
        {/* Name */}
        <Box className="h-5 w-32 bg-background-100 rounded" />

        {/* Category */}
        <Box className="h-4 w-20 bg-background-50 rounded mt-2" />

        {/* Description */}
        <Box className="h-4 w-40 bg-background-50 rounded mt-2" />

        {/* Warehouse */}
        <Box className="h-4 w-24 bg-background-50 rounded mt-2" />
      </VStack>

      {/* Right Section Skeleton */}
      <VStack className="items-end justify-between ml-2">
        {/* Quantity Badge */}
        <Box className="h-8 w-12 bg-background-100 rounded" />

        {/* Price */}
        <Box className="h-5 w-32 bg-background-100 rounded mt-auto" />
      </VStack>
    </Box>
  );
}
