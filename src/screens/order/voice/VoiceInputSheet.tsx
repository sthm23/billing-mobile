import { Button, IconButton, Text } from '@/components/base';
import { Sheet, SheetTextInput } from '@/components/base/Sheet';
import { useTheme } from '@/hooks/use-theme';
import { ORDER_ASSISTANT_LIMITS } from '@/services/order-assistant';
import { Search, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

interface VoiceInputSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the trimmed text; the caller closes the sheet */
  onSubmit: (text: string) => void;
  /** «Ещё» on the review screen: the text is added to the list */
  append?: boolean;
  /** Characters still allowed (the transcript already holds some) */
  maxLength?: number;
}

/**
 * Order assistant input (design «VoiceRecord», text tab). Stage 2 is text
 * only — the voice tab comes with speech recognition (PLAN stage 3).
 */
export function VoiceInputSheet({
  isOpen,
  onClose,
  onSubmit,
  append = false,
  maxLength = ORDER_ASSISTANT_LIMITS.TEXT_LENGTH,
}: VoiceInputSheetProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const [text, setText] = useState('');

  useEffect(() => {
    if (isOpen) setText('');
  }, [isOpen]);

  const lines = text.split('\n').filter((l) => l.trim()).length;

  return (
    <Sheet isOpen={isOpen} onClose={onClose} size="auto">
      <View className="px-4 pt-1 pb-3 gap-3.5">
        <View className="flex-row items-start gap-2">
          <View className="flex-1 min-w-0 gap-0.5">
            <Text className="type-title text-ink" accessibilityRole="header">
              {append ? t('voiceOrder.input.appendTitle') : t('voiceOrder.input.title')}
            </Text>
            <Text className="font-onest text-[13px] text-muted">{t('voiceOrder.input.subtitle')}</Text>
          </View>
          <IconButton icon={X} variant="sunken" accessibilityLabel={t('common.close')} onPress={onClose} />
        </View>

        <View className="gap-1.5">
          <Text className="font-onest-semibold text-[13px] text-soft">{t('voiceOrder.input.label')}</Text>
          <SheetTextInput
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={Math.max(maxLength, 0)}
            placeholder={t('voiceOrder.input.placeholder')}
            placeholderTextColor={colors.muted}
            accessibilityLabel={t('voiceOrder.input.label')}
            className="h-[168px] rounded-[18px] bg-sunken px-3.5 py-3 font-onest-medium text-base leading-[26px] text-ink"
          />
          <Text className="font-onest text-xs text-muted px-0.5">{t('voiceOrder.input.hint')}</Text>
        </View>

        <Button
          variant="accent"
          size="lg"
          full
          icon={Search}
          disabled={lines === 0}
          onPress={() => onSubmit(text.trim())}
        >
          {lines > 0 ? t('voiceOrder.input.findCount', { count: lines }) : t('voiceOrder.input.find')}
        </Button>
      </View>
    </Sheet>
  );
}
