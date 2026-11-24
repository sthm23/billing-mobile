import { Button, IconButton, Text } from '@/components/base';
import { Sheet } from '@/components/base/Sheet';
import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

interface ConfirmSheetProps {
  isOpen: boolean;
  /** Cancel, close button, swipe down or backdrop tap */
  onClose: () => void;
  title: string;
  /** What happens after the confirmation */
  message?: string;
  confirmLabel: string;
  /** @default t('common.cancel') */
  cancelLabel?: string;
  /** `danger` — destructive action (archive, close a cashbox), `primary` — a regular one */
  tone?: 'danger' | 'primary';
  /** The caller's mutation is pending: the confirm button spins, the sheet stays open */
  loading?: boolean;
  /** API error of the last attempt — shown inside the sheet, not as a toast behind it */
  error?: string | null;
  onConfirm: () => void;
}

/**
 * Confirmation in a bottom sheet (looks like «Деактивировать — шит»).
 * Use it instead of `Alert.alert`, which does nothing on web. The caller runs
 * the mutation in `onConfirm` and closes the sheet on success.
 *
 * @example
 * <ConfirmSheet
 *   isOpen={archiveOpen}
 *   onClose={() => setArchiveOpen(false)}
 *   title={t('product.archive.title')}
 *   message={t('product.archive.text', { name })}
 *   confirmLabel={t('product.archive.confirm')}
 *   tone="danger"
 *   loading={archive.isPending}
 *   error={archiveError}
 *   onConfirm={handleArchive}
 * />
 */
export function ConfirmSheet({
  isOpen,
  onClose,
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone = 'primary',
  loading = false,
  error,
  onConfirm,
}: ConfirmSheetProps) {
  const { t } = useTranslation();

  return (
    <Sheet isOpen={isOpen} onClose={onClose} size="auto">
      <View className="px-4 pt-1 pb-3 gap-3.5">
        <View className="flex-row items-start gap-2">
          <View className="flex-1 min-w-0 gap-1">
            <Text className="type-title text-ink" accessibilityRole="header">
              {title}
            </Text>
            {message ? <Text className="font-onest text-sm leading-5 text-muted">{message}</Text> : null}
          </View>
          <IconButton icon={X} variant="sunken" accessibilityLabel={t('common.close')} onPress={onClose} />
        </View>

        {error ? (
          <View className="bg-err-bg rounded-lg px-4 py-3" accessibilityRole="alert">
            <Text className="font-onest-semibold text-[13px] leading-[18px] text-err-fg">{error}</Text>
          </View>
        ) : null}

        <View className="flex-row gap-2 pt-1">
          <View className="flex-1">
            <Button variant="secondary" size="lg" full onPress={onClose} disabled={loading}>
              {cancelLabel ?? t('common.cancel')}
            </Button>
          </View>
          <View className="flex-1">
            <Button variant={tone} size="lg" full loading={loading} onPress={onConfirm}>
              {confirmLabel}
            </Button>
          </View>
        </View>
      </View>
    </Sheet>
  );
}
