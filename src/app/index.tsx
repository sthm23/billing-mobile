import { AuthStatusEnum, useAuth } from '@/provider/AuthProvider';
import { Redirect } from 'expo-router';

export default function Index() {
  const { authStatus, isAuthenticated } = useAuth();

  if (authStatus === AuthStatusEnum.Loading) {
    return null;
  }

  if (authStatus === AuthStatusEnum.Authenticated && isAuthenticated) {
    return <Redirect href="/(tabs)/(products)" />;
  }

  return <Redirect href="/login" />;
}

