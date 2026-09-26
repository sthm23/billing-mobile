import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { TrashIcon } from '@/components/ui/icon';
import { Order } from '@/services/order/order.type';
import { useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { RectButton, Swipeable } from 'react-native-gesture-handler';
import { OrderCard } from './OrderCard';

interface SwipeableOrderCardProps {
  order: Order;
  onDelete?: (orderId: string) => void;
  onPress?: () => void;
}

export function SwipeableOrderCard({ order, onDelete, onPress }: SwipeableOrderCardProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const handleDelete = () => {
    swipeableRef.current?.close();
    if (onDelete) {
      onDelete(order.id);
    }
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.deleteAction,
          {
            transform: [{ scale }],
          },
        ]}
      >
        <RectButton style={styles.deleteButton} onPress={handleDelete}>
          <Box className="items-center justify-center w-full h-full">
            <TrashIcon size="xl" className="text-white" />
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
      <Pressable onPress={onPress} className="active:opacity-90">
        <OrderCard order={order} />
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  deleteAction: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
    marginRight: 8,
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
