import MobileProfilePage from '@/screens/profile/MobileProfilePage';
import { SafeAreaView } from '@/components/base/SafeAreaView';

export default function ProfileScreen() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <MobileProfilePage />
    </SafeAreaView>
  );
}
