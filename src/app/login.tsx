import { LoginPage } from '@/screens/login/LoginPage';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from '@/components/base/SafeAreaView';

export default function login() {
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-bg">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <LoginPage />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
