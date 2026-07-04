

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/provider/AuthProvider';
import { SafeAreaView } from 'react-native-safe-area-context';

const Profile = () => {
    const {logout} = useAuth();
    const handleLogout = () => {
        logout();
    }
  return (
    <SafeAreaView edges={['top']} className="flex-1 items-center justify-center bg-surface dark:bg-surface-dark">
        <ThemedView type='surface' className="items-center justify-center">
            <ThemedText type='title'>Profile page</ThemedText>
            <Button onPress={handleLogout}>Logout</Button>
        </ThemedView>
    </SafeAreaView>
  )
}

export default Profile