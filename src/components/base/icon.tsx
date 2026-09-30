import React from 'react';
import {
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  X,
  Check,
  type LucideIcon,
} from 'lucide-react-native';

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * Icon exports
 *
 * Экспортирует базовые иконки из lucide-react-native.
 * Используйте как компоненты: <ArrowUpIcon size={20} color="#000" />
 */

export const ArrowUpIcon: LucideIcon = ArrowUp;
export const ArrowDownIcon: LucideIcon = ArrowDown;
export const ChevronDownIcon: LucideIcon = ChevronDown;
export const ChevronLeftIcon: LucideIcon = ChevronLeft;
export const ChevronRightIcon: LucideIcon = ChevronRight;
export const ChevronUpIcon: LucideIcon = ChevronUp;
export const CloseIcon: LucideIcon = X;
export const CheckIcon: LucideIcon = Check;
