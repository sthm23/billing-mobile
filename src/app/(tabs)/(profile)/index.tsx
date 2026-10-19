import MobileProfilePage from '@/screens/profile/MobileProfilePage';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <MobileProfilePage />
    </SafeAreaView>
  );
}
