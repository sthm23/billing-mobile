import { View } from 'react-native';

/**
 * Loading placeholder shaped like a product row.
 */
export function ProductCardSkeleton() {
  return (
    <View className="flex-row items-center gap-3 bg-card rounded-lg py-3 pl-3 pr-4" accessibilityElementsHidden>
      <View className="w-14 h-14 rounded-[14px] bg-sunken" />
      <View className="flex-1 gap-2">
        <View className="h-4 w-3/5 rounded-sm bg-sunken" />
        <View className="h-3 w-2/5 rounded-sm bg-sunken" />
      </View>
      <View className="items-end gap-2">
        <View className="h-4 w-20 rounded-sm bg-sunken" />
        <View className="h-4 w-12 rounded-pill bg-sunken" />
      </View>
    </View>
  );
}
