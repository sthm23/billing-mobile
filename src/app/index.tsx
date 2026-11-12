import { isAdmin, isStoreSuspended } from '@/libs/roles';
import { AuthStatusEnum, useAuth } from '@/provider/AuthProvider';
import { Redirect } from 'expo-router';

export default function Index() {
  const { authStatus, isAuthenticated, user } = useAuth();

  if (authStatus === AuthStatusEnum.Loading) {
    return null;
  }

  if (authStatus === AuthStatusEnum.Authenticated && isAuthenticated) {
    if (isStoreSuspended(user)) {
      return <Redirect href="/suspended" />;
    }
    // Platform admin has no store: Profile → «Магазины»
    return <Redirect href={isAdmin(user) ? '/(tabs)/(profile)' : '/(tabs)/(products)'} />;
  }

  return <Redirect href="/login" />;
}

