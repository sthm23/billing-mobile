
import { LoginPage } from '@/screens/login/LoginPage';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function login() {
  return (
    <SafeAreaView edges={['top']} className='h-full w-full bg-background'>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className='flex-1'
      >
        <LoginPage />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}