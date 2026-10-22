import { cn } from '@/libs/utils';
import React, { createContext, useContext } from 'react';
import { Image, View, type ImageProps, type ViewProps } from 'react-native';
import { Text } from './Text';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
type AvatarTone = 'sunken' | 'accent' | 'primary';

export interface AvatarProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
  /**
   * `sm` 32px, `md` 44px (list rows), `lg` 64px, `xl` 96px
   */
  size?: AvatarSize;
  /**
   * `sunken` — neutral (default), `accent` — current user / highlighted, `primary` — black
   */
  tone?: AvatarTone;
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

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-11 h-11',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const textSizeClasses: Record<AvatarSize, string> = {
  sm: 'text-xs',
  md: 'text-[13px]',
  lg: 'text-xl',
  xl: 'text-3xl',
};

const toneClasses: Record<AvatarTone, { box: string; text: string }> = {
  sunken: { box: 'bg-sunken', text: 'text-ink' },
  accent: { box: 'bg-accent', text: 'text-on-accent' },
  primary: { box: 'bg-primary', text: 'text-on-primary' },
};

const AvatarContext = createContext<{ size: AvatarSize; tone: AvatarTone }>({ size: 'md', tone: 'sunken' });

/**
 * Avatar — round avatar with image or initials (STHM)
 *
 * @example
 * <Avatar tone="accent" size="lg">
 *   <AvatarFallbackText>{user.fullName}</AvatarFallbackText>
 * </Avatar>
 *
 * @example
 * <Avatar>
 *   <AvatarImage source={{ uri: user.avatarUrl }} alt={user.fullName} />
 *   <AvatarFallbackText>{user.fullName}</AvatarFallbackText>
 * </Avatar>
 */
export function Avatar({ className, children, size = 'md', tone = 'sunken', ...props }: AvatarProps) {
  return (
    <AvatarContext.Provider value={{ size, tone }}>
      <View
        className={cn(
          'rounded-full items-center justify-center overflow-hidden',
          toneClasses[tone].box,
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </View>
    </AvatarContext.Provider>
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
 * AvatarFallbackText — инициалы из имени ("Тухтамишев Санжар" → "ТС")
 */
export function AvatarFallbackText({ children, className }: AvatarFallbackTextProps) {
  const { size, tone } = useContext(AvatarContext);
  const initials = children
    .split(' ')
    .filter(Boolean)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Text
      className={cn('font-onest-bold', textSizeClasses[size], toneClasses[tone].text, className)}
    >
      {initials}
    </Text>
  );
}
