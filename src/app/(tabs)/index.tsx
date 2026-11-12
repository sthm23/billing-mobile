import { isAdmin } from '@/libs/roles';
import { useAuth } from '@/provider/AuthProvider';
import { Redirect } from 'expo-router';

/** Tabs entry: the platform admin starts on Profile (stores), staff — on Products. */
const index = () => {
  const { user } = useAuth();

  return <Redirect href={isAdmin(user) ? './(profile)' : './(products)'} />;
};

export default index;
