import { Box, Text } from '@/components/base';

interface EmptyStateProps {
  message: string;
  className?: string;
}

export function EmptyState({ message, className }: EmptyStateProps) {
  return (
    <Box className={`flex-1 items-center justify-center py-10 ${className || ''}`}>
      <Text variant="large" className="text-muted-foreground">
        {message}
      </Text>
    </Box>
  );
}
