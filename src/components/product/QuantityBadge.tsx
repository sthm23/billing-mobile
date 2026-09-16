import { Badge, BadgeText } from '../ui/badge';

interface QuantityBadgeProps {
  quantity: number;
  variant: 'outline' | 'default' | 'secondary' | 'destructive' | 'success' | 'warn';
}

const variants = {
  success: 'bg-green-500',
  warn: 'bg-yellow-500',
  outline: 'bg-transparent',
  default: 'bg-purple-500',
  secondary: 'bg-gray-500',
  destructive: 'bg-red-500'
}

export function QuantityBadge({ quantity, variant }: QuantityBadgeProps) {
  return (
    <Badge variant='default' className={variants[variant]}>
      <BadgeText>{quantity}</BadgeText>
    </Badge>
  );
}
