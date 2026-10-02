import React from 'react';
import { View, Image, Text, type ViewProps, type ImageProps } from 'react-native';
import { cn } from '@/libs/utils';

export interface AvatarProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface AvatarImageProps extends Omit<ImageProps, 'source'> {
  source?: ImageProps['source'];
  alt?: string;
  className?: string;
}

export interface AvatarFallbackTextProps {
  className?: string;
  children: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'text-3xl',
};

/**
 * Avatar — аватар пользователя
 *
 * Круглое изображение профиля с поддержкой fallback текста (инициалов).
 *
 * @example
 * // С изображением
 * <Avatar>
 *   <AvatarImage source={{ uri: user.avatarUrl }} alt={user.name} />
 *   <AvatarFallbackText>{user.initials}</AvatarFallbackText>
 * </Avatar>
 *
 * @example
 * // Только с инициалами
 * <Avatar>
 *   <AvatarFallbackText>JD</AvatarFallbackText>
 * </Avatar>
 *
 * @example
 * // С размером
 * <Avatar size="lg">
 *   <AvatarFallbackText>JD</AvatarFallbackText>
 * </Avatar>
 */
export function Avatar({ className, children, size = 'md', ...props }: AvatarProps) {
  return (
    <View
      className={cn(
        'rounded-full bg-primary items-center justify-center overflow-hidden',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}

/**
 * AvatarImage — изображение аватара
 */
export function AvatarImage({ source, alt, className, ...props }: AvatarImageProps) {
  if (!source) return null;

  return (
    <Image
      source={source}
      className={cn('w-full h-full', className)}
      accessibilityLabel={alt}
      {...props}
    />
  );
}

/**
 * AvatarFallbackText — текст-заглушка (инициалы)
 *
 * Отображается когда нет изображения.
 * Автоматически извлекает первые буквы из имени.
 */
export function AvatarFallbackText({ children, className }: AvatarFallbackTextProps) {
  // Extract initials from full name (e.g., "John Doe" -> "JD")
  const initials = children
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Text
      className={cn(
        'font-semibold text-white',
        className
      )}
    >
      {initials}
    </Text>
  );
}
