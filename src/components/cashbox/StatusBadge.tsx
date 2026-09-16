import { Badge, BadgeText } from '@/components/ui/badge';

interface StatusBadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ label, variant = 'default', size = 'sm' }: StatusBadgeProps) {
  return (
    <Badge
      size={size}
      variant="solid"
      action={variant === 'success' ? 'success' : variant === 'error' ? 'error' : 'muted'}
      className="rounded-md"
    >
      <BadgeText className="text-xs">
        {label}
      </BadgeText>
    </Badge>
  );
}
