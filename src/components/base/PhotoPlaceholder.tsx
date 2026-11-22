import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/libs/utils';
import { ImageIcon } from 'lucide-react-native';
import { View, type ViewProps } from 'react-native';

export interface PhotoPlaceholderProps extends ViewProps {
  /**
   * `sm` 44px, `md` 56px (list rows), `lg` 64px, `hero` full width × 260px (product details)
   */
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
}

const sizeClasses = {
  sm: 'w-11 h-11 rounded-sm',
  md: 'w-14 h-14 rounded-[14px]',
  lg: 'w-16 h-16 rounded-[14px]',
  hero: 'w-full h-[260px] rounded-2xl',
};

const iconSizes = { sm: 20, md: 24, lg: 26, hero: 64 };

/**
 * PhotoPlaceholder — product image stand-in (STHM)
 *
 * @example
 * <PhotoPlaceholder size="md" />
 */
export function PhotoPlaceholder({ size = 'md', className, ...props }: PhotoPlaceholderProps) {
  const colors = useTheme();

  return (
    <View
      className={cn('bg-ph-bg items-center justify-center', sizeClasses[size], className)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      {...props}
    >
      <ImageIcon size={iconSizes[size]} color={colors.phFg} strokeWidth={size === 'hero' ? 1.25 : 1.75} />
    </View>
  );
}
