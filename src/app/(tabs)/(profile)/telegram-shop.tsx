import { SafeAreaView } from '@/components/base/SafeAreaView';
import { TelegramShopScreen } from '@/screens/telegram-shop/TelegramShopScreen';

/** «Telegram-магазин» — connecting the store's bot (owner); opened from Profile. */
export default function TelegramShopRoute() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <TelegramShopScreen />
    </SafeAreaView>
  );
}
