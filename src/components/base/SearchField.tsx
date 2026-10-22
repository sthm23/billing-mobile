import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/libs/utils';
import { ScanBarcode, Search, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';

export interface SearchFieldProps extends Omit<TextInputProps, 'className'> {
  /**
   * Shows the accent scan button on the right
   */
  onScanPress?: () => void;
  /**
   * `card` — on `bg` (default), `sunken` — inside a card
   */
  variant?: 'card' | 'sunken';
  className?: string;
}

/**
 * SearchField — pill search input with optional barcode scan (STHM)
 *
 * Shows a clear button while there is text and `onChangeText` is set.
 *
 * @example
 * <SearchField
 *   value={query}
 *   onChangeText={setQuery}
 *   placeholder={t('product.searchPlaceholder')}
 *   onScanPress={openScanner}
 * />
 */
export function SearchField({
  value,
  onChangeText,
  onScanPress,
  variant = 'card',
  placeholder,
  className,
  ...props
}: SearchFieldProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const hasValue = Boolean(value && value.length > 0);

  return (
    <View
      className={cn(
        'flex-row items-center h-12 rounded-pill pl-4 pr-1.5 gap-2.5',
        variant === 'card' ? 'bg-card' : 'bg-sunken',
        className,
      )}
    >
      <Search size={20} color={colors.muted} strokeWidth={2} />
      <TextInput
        className="flex-1 min-w-0 h-full font-onest text-[15px] text-ink"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? t('common.searchPlaceholder')}
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        autoCorrect={false}
        accessibilityRole="search"
        {...props}
      />
      {hasValue && onChangeText ? (
        <Pressable
          onPress={() => onChangeText('')}
          className={cn(
            'w-9 h-9 rounded-full items-center justify-center active:opacity-80',
            variant === 'card' ? 'bg-sunken' : 'bg-card',
          )}
          accessibilityRole="button"
          accessibilityLabel={t('common.clear')}
        >
          <X size={16} color={colors.ink} strokeWidth={2.2} />
        </Pressable>
      ) : null}
      {onScanPress ? (
        <Pressable
          onPress={onScanPress}
          className="w-9 h-9 rounded-full items-center justify-center bg-accent active:opacity-80"
          accessibilityRole="button"
          accessibilityLabel={t('common.scan')}
        >
          <ScanBarcode size={18} color={colors.onAccent} strokeWidth={2.2} />
        </Pressable>
      ) : null}
    </View>
  );
}
