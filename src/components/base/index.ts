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
export { Button, type ButtonProps } from './Button';

// Forms
export { Input, type InputProps } from './Input';
export { TextArea, type TextAreaProps } from './TextArea';

// Overlays
export { Modal, type ModalProps } from './Modal';
export { BottomSheet, type BottomSheetProps } from './BottomSheet';

// Feedback
export { Spinner, type SpinnerProps } from './Spinner';

// Components
export { Card, type CardProps } from './Card';
