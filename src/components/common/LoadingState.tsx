import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { ActivityIndicator } from 'react-native';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <Box className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" />
      {message && (
        <Text size="lg" className="mt-4">
          {message}
        </Text>
      )}
    </Box>
  );
}
