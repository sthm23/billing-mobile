import { Text } from '@/components/base';
import type { ButtonIconComponent } from '@/components/base';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/libs/utils';
import React from 'react';
import { View } from 'react-native';

interface EmptyStateProps {
  /**
   * Main line («Ничего не найдено»)
   */
  message: string;
  /**
   * Hint under the message
   */
  description?: string;
  /**
   * Lucide icon shown in a round plate
   */
  icon?: ButtonIconComponent;
  /**
   * Actions (buttons) under the text
   */
  children?: React.ReactNode;
  /**
   * Render as a white card (inside lists on `bg`)
   */
  card?: boolean;
  className?: string;
}

/**
 * EmptyState — empty list / no results (STHM)
 *
 * @example
 * <EmptyState icon={Search} message="Ничего не найдено" description="Проверьте название или отсканируйте штрихкод" card />
 */
export function EmptyState({ message, description, icon: Icon, children, card = false, className }: EmptyStateProps) {
  const colors = useTheme();

  return (
    <View
      className={cn(
        'items-center justify-center gap-2.5 px-5 py-7',
        card ? 'bg-card rounded-xl' : 'flex-1 py-10',
        className,
      )}
    >
      {Icon ? (
        <View className="w-13 h-13 rounded-full bg-sunken items-center justify-center">
          <Icon size={24} color={colors.muted} strokeWidth={2} />
        </View>
      ) : null}
      <Text className="font-onest-semibold text-base text-ink text-center">{message}</Text>
      {description ? (
        <Text className="font-onest text-[13px] leading-[19px] text-muted text-center">{description}</Text>
      ) : null}
      {children ? <View className="flex-row gap-2 pt-1.5">{children}</View> : null}
    </View>
  );
}
