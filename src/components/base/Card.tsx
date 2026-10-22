import { cn } from '@/libs/utils';
import { View, type ViewProps } from 'react-native';

export interface CardProps extends ViewProps {
  /**
   * `default` — white block on `bg`; `hero` — the one dark main block of a screen;
   * `sunken` — plate inside a card.
   */
  variant?: 'default' | 'hero' | 'sunken';
  /**
   * Additional className for styling
   */
  className?: string;
}

const variantClasses = {
  default: 'bg-card rounded-xl',
  hero: 'bg-hero rounded-2xl',
  sunken: 'bg-sunken rounded-md',
};

/**
 * Card — content block (STHM)
 *
 * No shadows: blocks are separated by color (`card` on `bg`).
 * For totals with an amount and two plates use `HeroCard`.
 *
 * @example
 * <Card className="gap-3">
 *   <Text className="type-subhead text-ink">Остатки и цены</Text>
 * </Card>
 *
 * @example
 * <Card variant="hero">
 *   <Text className="type-heading text-hero-ink">Strapela 6м</Text>
 * </Card>
 */
export function Card({ variant = 'default', className, ...props }: CardProps) {
  return <View className={cn('p-4', variantClasses[variant], className)} {...props} />;
}
