import { Box, Spinner, Text } from '@/components/base';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <Box className="flex-1 items-center justify-center gap-4">
      <Spinner size="lg" />
      {message && (
        <Text className="font-onest-medium text-[15px] text-muted">
          {message}
        </Text>
      )}
    </Box>
  );
}
