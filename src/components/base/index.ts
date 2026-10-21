/**
 * Base Components — STHM design primitives
 *
 * Pure React Native components styled with NativeWind and the STHM tokens
 * from src/global.css. See COMPONENTS.md for the API.
 */

// Layout
export { Box, type BoxProps } from './Box';
export { Center, type CenterProps } from './Center';
export { Divider, type DividerProps } from './Divider';
export { HStack, type HStackProps } from './HStack';
export { VStack, type VStackProps } from './VStack';

// Typography
export { Heading, type HeadingProps } from './Heading';
export { Money, type MoneyProps } from './Money';
export { Text, type TextProps } from './Text';

// Interactive
export {
  Button, ButtonIcon, ButtonText, type ButtonIconComponent, type ButtonIconProps, type ButtonProps,
  type ButtonTextProps
} from './Button';
export { Chip, type ChipProps } from './Chip';
export { IconButton, type IconButtonProps } from './IconButton';
export { Pressable, type PressableProps } from './Pressable';
export { Segmented, type SegmentedOption, type SegmentedProps } from './Segmented';
export { Stepper, type StepperProps } from './Stepper';

// Forms
export {
  FormControl, FormControlError,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText, FormControlLabel,
  FormControlLabelText, type FormControlErrorProps,
  type FormControlErrorTextProps,
  type FormControlHelperProps,
  type FormControlHelperTextProps, type FormControlLabelProps,
  type FormControlLabelTextProps, type FormControlProps
} from './form-control';
export {
  Input,
  InputField, type InputFieldProps, type InputProps
} from './Input';
export { SearchField, type SearchFieldProps } from './SearchField';
export {
  Select, type SelectItemProps, type SelectProps
} from './select';
export { TextArea, type TextAreaProps } from './TextArea';

// Overlays
export {
  AlertDialog,
  AlertDialogBackdrop, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, type AlertDialogBackdropProps, type AlertDialogBodyProps, type AlertDialogContentProps, type AlertDialogFooterProps, type AlertDialogHeaderProps, type AlertDialogProps
} from './alert-dialog';
export { Modal, type ModalProps } from './Modal';

// Feedback
export { Spinner, type SpinnerProps } from './Spinner';

// Display
export {
  Avatar, AvatarFallbackText, AvatarImage, type AvatarFallbackTextProps, type AvatarImageProps, type AvatarProps
} from './avatar';
export { Card, type CardProps } from './Card';
export { HeroCard, type HeroCardProps, type HeroCardTile } from './HeroCard';
export { ListCard, type ListCardProps } from './ListCard';
export { PhotoPlaceholder, type PhotoPlaceholderProps } from './PhotoPlaceholder';
export { StatusBadge, type StatusBadgeProps, type StatusTone } from './StatusBadge';

// Icons
export {
  ArrowDownIcon, ArrowUpIcon, CheckIcon, ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CloseIcon, type IconProps
} from './icon';
export { SafeAreaView, type SafeAreaViewProps } from './SafeAreaView';
