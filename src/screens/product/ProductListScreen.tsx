import { Divider } from '@/components/ui/divider';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { ActionButtons } from '@/components/product/ActionButtons';
import { EmptyProductList } from '@/components/product/EmptyProductList';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/product/ProductCardSkeleton';
import { ProductListHeader } from '@/components/product/ProductListHeader';
import { SearchBar } from '@/components/product/SearchBar';
import { mockProducts } from '@/mocks/products.mock';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList } from 'react-native';

export default function ProductListScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mock: Using static data for now
  const products = mockProducts;

  const handleProductPress = (productId: string) => {
    router.push(`/(tabs)/(products)/${productId}`);
  };

  const handleCreatePress = () => {
    // Disabled for now
    console.log('Create product pressed');
  };

  const handleScanPress = () => {
    // Disabled for now
    console.log('Scan pressed');
  };

  const handleFilterPress = () => {
    // Disabled for now
    console.log('Filter pressed');
  };

  return (
    <VStack className="flex-1 bg-background">
      {/* Header */}
      <ProductListHeader onCreatePress={handleCreatePress} />

      {/* Search Bar & Action Buttons */}
      <HStack className="px-4 pb-3 gap-2">
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        <ActionButtons
          onScanPress={handleScanPress}
          onFilterPress={handleFilterPress}
        />
      </HStack>

      {/* Product List */}
      {isLoading ? (
        <VStack className="px-4 gap-3">
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </VStack>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard product={item} onPress={handleProductPress} />
          )}
          ItemSeparatorComponent={() => <Divider className="my-2" />}
          ListEmptyComponent={<EmptyProductList onCreatePress={handleCreatePress} />}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 16,
            flexGrow: products.length === 0 ? 1 : undefined,
          }}
        />
      )}
    </VStack>
  );
}
