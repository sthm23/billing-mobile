import { SafeAreaView } from '@/components/base/SafeAreaView';
import { StoreSettingsScreen } from '@/screens/profile/StoreSettingsScreen';

/** Store modes (sales / rental) — OWNER only */
export default function StoreSettingsPage() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <StoreSettingsScreen />
    </SafeAreaView>
  );
}
