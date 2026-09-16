import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';

interface EmptyStateProps {
  message: string;
  className?: string;
}

export function EmptyState({ message, className }: EmptyStateProps) {
  return (
    <Box className={`flex-1 items-center justify-center py-10 ${className || ''}`}>
      <Text size="lg" className="text-typography-500">
        {message}
      </Text>
    </Box>
  );
}
