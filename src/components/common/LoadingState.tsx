import { Box, Text, Spinner } from '@/components/base';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <Box className="flex-1 items-center justify-center">
      <Spinner size="large" />
      {message && (
        <Text variant="large" className="mt-4">
          {message}
        </Text>
      )}
    </Box>
  );
}
