import { Button, Input, InputField, Text, toast } from '@/components/base';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/libs/api-error';
import { useConnectTelegramBot } from '@/services/telegram-shop';
import { Bot, KeyRound, Link2, Send } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

/** Same shapes the backend checks (UX only: the backend validates again and asks Telegram). */
const TOKEN_PATTERN = /^\d{5,15}:[A-Za-z0-9_-]{30,50}$/;
const SLUG_PATTERN = /^[a-z0-9_-]{3,32}$/;
const BOT_FATHER_URL = 'https://t.me/BotFather';

interface ConnectBotFormProps {
  /** Re-connecting: the current address is prefilled */
  initialSlug?: string;
  onDone: () => void;
  /** Re-connecting only: back to the connected view */
  onCancel?: () => void;
}

/**
 * Connecting the store's own bot: the instruction for the owner (BotFather → token) and
 * the form. The token goes to the backend, which checks it with Telegram and stores it
 * encrypted; the app never keeps it.
 */
export function ConnectBotForm({ initialSlug = '', onDone, onCancel }: ConnectBotFormProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const connect = useConnectTelegramBot();
  const [token, setToken] = useState('');
  const [slug, setSlug] = useState(initialSlug);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tokenValue = token.trim();
  const slugValue = slug.trim().toLowerCase();
  const tokenInvalid = submitted && !TOKEN_PATTERN.test(tokenValue);
  const slugInvalid = submitted && !SLUG_PATTERN.test(slugValue);

  const submit = () => {
    setSubmitted(true);
    setError(null);
    if (!TOKEN_PATTERN.test(tokenValue) || !SLUG_PATTERN.test(slugValue)) return;
    connect.mutate(
      { token: tokenValue, slug: slugValue },
      {
        onSuccess: () => {
          // The token is not kept in the screen's state a moment longer than needed
          setToken('');
          toast.show(t('telegramShop.connected'));
          onDone();
        },
        onError: (e) => setError(getApiErrorMessage(e, t('telegramShop.connectFailed'))),
      }
    );
  };

  const steps = ['step1', 'step2', 'step3', 'step4'] as const;

  return (
    <View className="gap-3">
      <View className="bg-card rounded-2xl p-4 gap-3">
        <View className="flex-row items-center gap-2.5">
          <View className="w-10 h-10 rounded-full bg-sunken items-center justify-center">
            <Bot size={20} color={colors.ink} strokeWidth={2} />
          </View>
          <Text className="flex-1 font-onest-bold text-[15px] text-ink">{t('telegramShop.stepsTitle')}</Text>
        </View>
        <View className="gap-2.5">
          {steps.map((step, index) => (
            <View key={step} className="flex-row items-start gap-2.5">
              <View className="w-[22px] h-[22px] rounded-full bg-sunken items-center justify-center">
                <Text className="font-onest-bold text-xs text-soft">{index + 1}</Text>
              </View>
              <Text className="flex-1 font-onest text-sm leading-5 text-ink">{t(`telegramShop.${step}`)}</Text>
            </View>
          ))}
        </View>
        <Button variant="secondary" icon={Send} full onPress={() => void Linking.openURL(BOT_FATHER_URL)}>
          {t('telegramShop.openBotFather')}
        </Button>
      </View>

      <View className="bg-card rounded-2xl p-4 gap-4">
        <View className="gap-1.5">
          <Text className="font-onest-semibold text-[13px] text-soft">{t('telegramShop.tokenLabel')}</Text>
          <Input size="lg" invalid={tokenInvalid}>
            <KeyRound size={20} color={colors.muted} strokeWidth={2} />
            <InputField
              value={token}
              onChangeText={setToken}
              placeholder={t('telegramShop.tokenPlaceholder')}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              secureTextEntry
              accessibilityLabel={t('telegramShop.tokenLabel')}
            />
          </Input>
          <Text className={tokenInvalid ? 'font-onest text-xs text-err-fg' : 'font-onest text-xs text-muted'}>
            {tokenInvalid ? t('telegramShop.tokenInvalid') : t('telegramShop.tokenHint')}
          </Text>
        </View>

        <View className="gap-1.5">
          <Text className="font-onest-semibold text-[13px] text-soft">{t('telegramShop.slugLabel')}</Text>
          <Input size="lg" invalid={slugInvalid}>
            <Link2 size={20} color={colors.muted} strokeWidth={2} />
            <InputField
              value={slug}
              onChangeText={setSlug}
              placeholder={t('telegramShop.slugPlaceholder')}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel={t('telegramShop.slugLabel')}
            />
          </Input>
          <Text className={slugInvalid ? 'font-onest text-xs text-err-fg' : 'font-onest text-xs text-muted'}>
            {slugInvalid ? t('telegramShop.slugInvalid') : t('telegramShop.slugHint')}
          </Text>
        </View>

        {error ? (
          <View className="bg-err-bg rounded-lg px-4 py-3" accessibilityRole="alert">
            <Text className="font-onest-semibold text-[13px] leading-[18px] text-err-fg">{error}</Text>
          </View>
        ) : null}

        <View className="gap-2">
          <Button size="lg" full loading={connect.isPending} onPress={submit}>
            {onCancel ? t('telegramShop.save') : t('telegramShop.connect')}
          </Button>
          {onCancel ? (
            <Button variant="secondary" size="lg" full disabled={connect.isPending} onPress={onCancel}>
              {t('telegramShop.cancelEdit')}
            </Button>
          ) : null}
        </View>
      </View>
    </View>
  );
}
