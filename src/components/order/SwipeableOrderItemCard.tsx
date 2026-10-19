import { Text } from '@/components/base';
import { useTheme } from '@/hooks/use-theme';
import { OrderDetailItem } from '@/services/order/order.type';
import { Trash2 } from 'lucide-react-native';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated } from 'react-native';
import { RectButton, Swipeable } from 'react-native-gesture-handler';
import { OrderItemCard } from './OrderItemCard';

interface SwipeableOrderItemCardProps {
  item: OrderDetailItem;
  index: number;
  onDelete?: (itemId: string) => void;
  onQuantityChange?: (itemId: string, delta: number) => void;
}

/**
 * Order line with swipe-left to delete.
 */
export function SwipeableOrderItemCard({
  item,
  index,
  onDelete,
  onQuantityChange,
}: SwipeableOrderItemCardProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const colors = useTheme();
  const { t } = useTranslation();

  const handleDelete = () => {
    swipeableRef.current?.close();
    onDelete?.(item.id);
  };

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-84, 0],
      outputRange: [1, 0.6],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={{ width: 92, paddingLeft: 8, transform: [{ scale }] }}>
        <RectButton
          onPress={handleDelete}
          style={{ flex: 1, borderRadius: 24, backgroundColor: colors.errBg, alignItems: 'center', justifyContent: 'center', gap: 4 }}
        >
          <Trash2 size={20} color={colors.errFg} strokeWidth={2} />
          <Text className="font-onest-semibold text-xs text-err-fg">{t('order.delete')}</Text>
        </RectButton>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      rightThreshold={40}
      renderRightActions={renderRightActions}
      overshootRight={false}
    >
      <OrderItemCard
        item={item}
        index={index}
        showDivider={false}
        onQuantityChange={onQuantityChange}
      />
    </Swipeable>
  );
}
