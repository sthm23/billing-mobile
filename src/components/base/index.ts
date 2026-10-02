/**
 * Base Components — чистые React Native компоненты
 *
 * Эти компоненты заменяют GlueStack UI и используют только
 * нативные React Native компоненты + NativeWind для стилизации.
 */

// Layout
export { Box, type BoxProps } from './Box';
export { Center, type CenterProps } from './Center';
export { Divider, type DividerProps } from './Divider';
export { HStack, type HStackProps } from './HStack';
export { VStack, type VStackProps } from './VStack';

// Typography
export { Heading, type HeadingProps } from './Heading';
export { Text, type TextProps } from './Text';

// Interactive
export {
  Button, ButtonIcon, ButtonText, type ButtonIconProps, type ButtonProps,
  type ButtonTextProps
} from './Button';
export { Pressable, type PressableProps } from './Pressable';

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
export {
  Select, type SelectItemProps, type SelectProps
} from './select';
export { TextArea, type TextAreaProps } from './TextArea';


export {
  AlertDialog,
  AlertDialogBackdrop, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, type AlertDialogBackdropProps, type AlertDialogBodyProps, type AlertDialogContentProps, type AlertDialogFooterProps, type AlertDialogHeaderProps, type AlertDialogProps
} from './alert-dialog';
export {
  BottomSheet,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetProps,
  type BottomSheetRef
} from './BottomSheet';
export { Modal, type ModalProps } from './Modal';

// Feedback
export { Spinner, type SpinnerProps } from './Spinner';

// Display
export {
  Avatar, AvatarFallbackText, AvatarImage, type AvatarFallbackTextProps, type AvatarImageProps, type AvatarProps
} from './avatar';
export {
  Badge,
  BadgeText,
  type BadgeProps,
  type BadgeTextProps
} from './badge';
export { Card, type CardProps } from './Card';

// Icons
export {
  ArrowDownIcon, ArrowUpIcon, CheckIcon, ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CloseIcon, type IconProps
} from './icon';

