import { Badge, BadgeText } from '../ui/badge';

interface QuantityBadgeProps {
  quantity: number;
  variant: 'outline' | 'default' | 'secondary' | 'destructive';
}

export function QuantityBadge({ quantity, variant }: QuantityBadgeProps) {
  return (
    <Badge variant={variant} className="bg-purple-500">
      <BadgeText>{quantity}</BadgeText>
    </Badge>
  );
}
