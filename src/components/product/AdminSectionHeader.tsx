import { Button, HStack, Text, VStack } from '@/components/base';
import { Trash2 } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';

interface AdminSectionHeaderProps {
  title: string;
  subtitle?: string;
  onDelete?: () => void;
}

export function AdminSectionHeader({ title, subtitle, onDelete }: AdminSectionHeaderProps) {
  const colors = useTheme();

  return (
    <HStack className="items-center justify-between py-2">
      <VStack gap={0}>
        <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </Text>
        {subtitle && (
          <Text className="text-xs text-muted-foreground opacity-70">{subtitle}</Text>
        )}
      </VStack>
      {onDelete && (
        <Button variant="destructive" size="sm" className="w-10 h-10" onPress={onDelete}>
          <Trash2 size={18} color="#FFFFFF" />
        </Button>
      )}
    </HStack>
  );
}
