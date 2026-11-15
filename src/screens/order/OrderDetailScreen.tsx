import { Button } from '@/components/base';
import { EmptyState, LoadingState } from '@/components/common';
import { canLowerPrice } from '@/libs/roles';
import { useAuth } from '@/provider/AuthProvider';
import { useOrderById } from '@/services/order/order.queries';
import { OrderStatus } from '@/services/order/order.type';
import { router } from 'expo-router';
import { CircleAlert } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { OrderCartScreen } from './cart/OrderCartScreen';
import { OrderViewScreen } from './view/OrderViewScreen';

interface OrderDetailScreenProps {
  orderId: string;
}

/**
 * Order screen: CREATED/HOLD orders open in the cart for editing and
 * payment (someone else's open order — read-only for a seller); sold ones in
 * the read-only view (`OrderViewScreen`).
 */
export function OrderDetailScreen({ orderId }: OrderDetailScreenProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: order, isLoading, isError, refetch } = useOrderById(orderId);

  if (isLoading) {
    return <LoadingState message={t('common.loading')} />;
  }

  if (isError || !order) {
    return (
      <EmptyState icon={CircleAlert} message={t('order.errorLoadingOrder')}>
        <Button variant="secondary" onPress={() => router.back()}>
          {t('order.back')}
        </Button>
      </EmptyState>
    );
  }

  // Someone else's open order: a seller only looks at it (the backend rejects
  // the edit — owner / manager only)
  const editable = canLowerPrice(user) || order.cashier?.id === user?.staff?.id;
  if ((order.status === OrderStatus.CREATED || order.status === OrderStatus.HOLD) && editable) {
    return <OrderCartScreen order={order} />;
  }

  return <OrderViewScreen order={order} refetch={refetch} />;
}
