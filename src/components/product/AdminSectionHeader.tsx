import { Button, ButtonIcon } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Trash2 } from 'lucide-react-native';

interface AdminSectionHeaderProps {
  title: string;
  subtitle?: string;
  onDelete?: () => void;
}

export function AdminSectionHeader({ title, subtitle, onDelete }: AdminSectionHeaderProps) {
  return (
    <HStack className="items-center justify-between py-2">
      <VStack className="gap-0">
        <Text className="text-xs font-semibold text-typography-500 uppercase tracking-wider">
          {title}
        </Text>
        {subtitle && (
          <Text className="text-xs text-typography-400">{subtitle}</Text>
        )}
      </VStack>
      {onDelete && (
        <Button variant="destructive" size="icon" onPress={onDelete}>
          <ButtonIcon as={Trash2} />
        </Button>
      )}
    </HStack>
  );
}
