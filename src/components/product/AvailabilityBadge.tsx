import { Badge, BadgeText } from '@/components/ui/badge';

interface AvailabilityBadgeProps {
  isAvailable: boolean;
}

export function AvailabilityBadge({ isAvailable }: AvailabilityBadgeProps) {
  return (
    <Badge
      variant="solid"
      action={isAvailable ? 'success' : 'error'}
      className="rounded-full px-3 py-1"
    >
      <BadgeText className="text-xs font-medium">
        {isAvailable ? 'В наличии' : 'Нет в наличии'}
      </BadgeText>
    </Badge>
  );
}
