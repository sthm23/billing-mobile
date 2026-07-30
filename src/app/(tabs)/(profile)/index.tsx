import { useTheme } from '@/hooks/use-theme';
import MobileProfilePage from '@/screens/profile/MobileProfilePage';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function ProfileScreen() {
  const color = useTheme()


  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: color.background }}>
      <MobileProfilePage isActive={true} />
    </SafeAreaView>
  )
}