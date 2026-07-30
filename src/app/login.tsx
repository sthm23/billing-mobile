
import { useTheme } from '@/hooks/use-theme';
import { LoginPage } from '@/screens/login/LoginPage';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function login() {
  const color = useTheme()
  return (
    <SafeAreaView edges={['top']} className='h-full w-full px-4' style={{ backgroundColor: color.background }}>
      <LoginPage />
    </SafeAreaView>
  );
}