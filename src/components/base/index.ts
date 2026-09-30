/**
 * Base Components — чистые React Native компоненты
 *
 * Эти компоненты заменяют GlueStack UI и используют только
 * нативные React Native компоненты + NativeWind для стилизации.
 */

// Layout
export { Box, type BoxProps } from './Box';
export { VStack, type VStackProps } from './VStack';
export { HStack, type HStackProps } from './HStack';
export { Center, type CenterProps } from './Center';
export { Divider, type DividerProps } from './Divider';

// Typography
export { Text, type TextProps } from './Text';
export { Heading, type HeadingProps } from './Heading';

// Interactive
export { Pressable, type PressableProps } from './Pressable';
export {
  Button,
  ButtonText,
  ButtonIcon,
  type ButtonProps,
  type ButtonTextProps,
  type ButtonIconProps,
} from './Button';

// Forms
export {
  Input,
  InputField,
  type InputProps,
  type InputFieldProps,
} from './Input';
export { TextArea, type TextAreaProps } from './TextArea';
export {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
  type FormControlProps,
  type FormControlLabelProps,
  type FormControlLabelTextProps,
  type FormControlErrorProps,
  type FormControlErrorTextProps,
  type FormControlHelperProps,
  type FormControlHelperTextProps,
} from './form-control';
export {
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
  SelectItem,
  type SelectProps,
  type SelectTriggerProps,
  type SelectInputProps,
  type SelectIconProps,
  type SelectPortalProps,
  type SelectBackdropProps,
  type SelectContentProps,
  type SelectDragIndicatorWrapperProps,
  type SelectDragIndicatorProps,
  type SelectItemProps,
} from './select';

// Overlays
export { Modal, type ModalProps } from './Modal';
export {
  BottomSheet,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetProps,
  type BottomSheetRef,
} from './BottomSheet';
export {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicatorWrapper,
  ActionsheetDragIndicator,
  type ActionsheetProps,
  type ActionsheetContentProps,
  type ActionsheetBackdropProps,
  type ActionsheetDragIndicatorWrapperProps,
  type ActionsheetDragIndicatorProps,
} from './actionsheet';
export {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  type AlertDialogProps,
  type AlertDialogBackdropProps,
  type AlertDialogContentProps,
  type AlertDialogHeaderProps,
  type AlertDialogBodyProps,
  type AlertDialogFooterProps,
} from './alert-dialog';

// Feedback
export { Spinner, type SpinnerProps } from './Spinner';

// Display
export { Card, type CardProps } from './Card';
export {
  Avatar,
  AvatarImage,
  AvatarFallbackText,
  type AvatarProps,
  type AvatarImageProps,
  type AvatarFallbackTextProps,
} from './avatar';
export {
  Badge,
  BadgeText,
  type BadgeProps,
  type BadgeTextProps,
} from './badge';

// Icons
export {
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CloseIcon,
  CheckIcon,
  type IconProps,
} from './icon';
