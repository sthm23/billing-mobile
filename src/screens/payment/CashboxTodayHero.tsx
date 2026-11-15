import { HeroCard, Text } from '@/components/base';
import { useTheme } from '@/hooks/use-theme';
import { formatDayMonth, formatTime, isSameDay } from '@/libs/date';
import type { CashboxTodaySummary } from '@/services/cashbox/cashbox.types';
import { Lock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

interface CashboxTodayHeroProps {
  today: CashboxTodaySummary;
}

/**
 * Cashbox list hero (design «Cashboxes»): open cashboxes' balance and
 * today's income/expense, or «Нет открытых касс» with the last closing time.
 * All amounts come from `GET /cashbox` (`today`).
 */
export function CashboxTodayHero({ today }: CashboxTodayHeroProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  if (today.openCount > 0) {
    return (
      <HeroCard
        label={t('payment.today.title')}
        chip={t('payment.today.openCount', { count: today.openCount })}
        chipTone="accent"
        amount={today.balance}
        currency={t('common.currency')}
        tiles={[
          { label: t('payment.today.income'), value: today.income, tone: 'accent', signed: true },
          { label: t('payment.today.expense'), value: -today.expense, tone: 'err' },
        ]}
      />
    );
  }

  return (
    <View className="bg-hero rounded-2xl p-[18px] gap-3.5">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="font-onest-medium text-sm text-hero-muted">{t('payment.today.title')}</Text>
        <View className="rounded-pill px-2.5 py-1 bg-hero-sub">
          <Text className="font-onest-semibold text-xs text-hero-ink">{t('payment.today.allClosed')}</Text>
        </View>
      </View>
      <View className="flex-row items-center gap-3.5 py-1">
        <View className="w-[52px] h-[52px] rounded-full bg-hero-sub items-center justify-center">
          <Lock size={22} color={colors.heroMuted} strokeWidth={2} />
        </View>
        <View className="flex-1 gap-1">
          <Text className="font-onest-bold text-xl text-hero-ink">{t('payment.today.noneTitle')}</Text>
          <Text className="font-onest text-[13px] leading-[19px] text-hero-muted">
            {[t('payment.today.noneText'), lastClosedText(today.lastClosedAt, t)].filter(Boolean).join(' ')}
          </Text>
        </View>
      </View>
    </View>
  );
}

function lastClosedText(iso: string | null, t: (key: string, options?: Record<string, string>) => string): string | null {
  if (!iso) return null;
  const closed = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const time = formatTime(iso);
  if (isSameDay(closed, now)) return t('payment.today.lastClosedToday', { time });
  if (isSameDay(closed, yesterday)) return t('payment.today.lastClosedYesterday', { time });
  return t('payment.today.lastClosedOn', { date: formatDayMonth(iso), time });
}
