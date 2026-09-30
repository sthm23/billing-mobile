import { Box } from '@/components/base';
import CustomIcon from '@/icons/custom-icon';
import { IconNames } from '@/icons/icon.type';
import { OrderDetailItem } from '@/services/order/order.type';
import { useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { RectButton, Swipeable } from 'react-native-gesture-handler';
import { OrderItemCard } from './OrderItemCard';

interface SwipeableOrderItemCardProps {
  item: OrderDetailItem;
  index: number;
  onDelete?: (itemId: string) => void;
  onQuantityChange?: (itemId: string, delta: number) => void;
}

export function SwipeableOrderItemCard({
  item,
  index,
  onDelete,
  onQuantityChange,
}: SwipeableOrderItemCardProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const handleDelete = () => {
    swipeableRef.current?.close();
    onDelete?.(item.id);
  };

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.deleteAction, { transform: [{ scale }] }]}>
        <RectButton style={styles.deleteButton} onPress={handleDelete}>
          <Box className="items-center justify-center w-full h-full">
            <CustomIcon name={IconNames.TRASH} size={24} color="#FFFFFF" />
          </Box>
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
        showDivider={index > 0}
        onQuantityChange={onQuantityChange}
      />
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  deleteAction: {
    width: 72,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    marginRight: 4,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
