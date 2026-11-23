import { Button, Money, PhotoPlaceholder, Pressable, StatusBadge, Text, type StatusTone } from '@/components/base';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/libs/utils';
import type { MatchCandidate } from '@/services/order-assistant';
import { MessageSquareText, Search } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { variantLabel } from '../cart/cart-store';
import type { RowSkip, VoiceRow } from './voice-store';

/** Same threshold as the product list «Мало» (≤ 5). */
const LOW_STOCK = 5;

interface VoiceRowCardProps {
  row: VoiceRow;
  /** Set when the chosen variant would be rejected by the cart */
  skip?: RowSkip;
  onPick: (variantId: string) => void;
  onFindManually: () => void;
  onRemove: () => void;
}

function candidateLabel(c: MatchCandidate): string {
  return variantLabel(c.attributes, c.sku);
}

/**
 * One phrase on the review screen (design «VoiceReview»): a found variant,
 * candidates to choose from, or «не найдено» with manual search.
 */
export function VoiceRowCard({ row, skip, onPick, onFindManually, onRemove }: VoiceRowCardProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  // AMBIGUOUS rows open with the choice; a found row opens it on «Изменить вариант».
  const [choosing, setChoosing] = useState(row.status === 'AMBIGUOUS');

  // A variant found manually (search screen) is shown as the row's pick.
  const manualId = row.source === 'MANUAL' ? row.selected?.variantId : undefined;
  useEffect(() => {
    if (manualId) setChoosing(false);
  }, [manualId]);

  const stockBadge = (stock: number): { label: string; tone: StatusTone } =>
    stock <= 0
      ? { label: t('voiceOrder.stock.none'), tone: 'err' }
      : stock <= LOW_STOCK
        ? { label: t('voiceOrder.stock.low', { count: stock }), tone: 'warn' }
        : { label: t('voiceOrder.stock.inStock', { count: stock }), tone: 'ok' };

  const status: { label: string; tone: StatusTone } | null = skip
    ? { label: t(`voiceOrder.row.${skip}`), tone: 'err' }
    : !row.selected
      ? row.status === 'NOT_FOUND'
        ? { label: t('voiceOrder.row.notFound'), tone: 'err' }
        : { label: t('voiceOrder.row.choose'), tone: 'warn' }
      : row.source === 'MANUAL'
        ? { label: t('voiceOrder.row.manual'), tone: 'ok' }
        : row.status === 'AMBIGUOUS'
          ? { label: t('voiceOrder.row.chosen'), tone: 'ok' }
          : null;

  const needsChoice = row.status === 'AMBIGUOUS' && !row.selected;
  const products = new Set(row.candidates.map((c) => c.productName));
  const chooseTitle =
    products.size === 1
      ? t('voiceOrder.row.chooseOf', { name: row.candidates[0]?.productName, count: row.candidates.length })
      : t('voiceOrder.row.chooseAny');
  const hasMore = row.totalCandidates > row.candidates.length;

  const pick = (variantId: string) => {
    onPick(variantId);
    if (row.status !== 'AMBIGUOUS') setChoosing(false);
  };

  return (
    <View
      className={cn('bg-card rounded-[22px] p-3.5 gap-2.5', needsChoice && 'border-2 border-warn-fg')}
      accessibilityLabel={row.phrase}
    >
      <View className="flex-row items-center gap-1.5">
        <MessageSquareText size={13} color={colors.muted} strokeWidth={2} />
        <Text className="flex-1 font-onest text-xs italic text-muted" numberOfLines={2}>
          «{row.phrase}»
        </Text>
        {status && <StatusBadge label={status.label} tone={status.tone} size="sm" />}
      </View>

      {/* Chosen variant */}
      {row.selected && !choosing && (
        <>
          <View className="flex-row items-center gap-3">
            <PhotoPlaceholder size="md" />
            <View className="flex-1 min-w-0 gap-[3px]">
              <Text className="font-onest-bold text-base text-ink" numberOfLines={2}>
                {row.selected.productName}
              </Text>
              <Text className="font-onest text-[13px] text-soft" numberOfLines={1}>
                {candidateLabel(row.selected)}
              </Text>
              <View className="flex-row items-center gap-1.5">
                <Money value={row.selected.price} className="text-[15px]" />
                <StatusBadge {...stockBadge(row.selected.stock)} size="sm" />
              </View>
            </View>
          </View>
          <View className="flex-row gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onPress={() => (row.candidates.length > 0 ? setChoosing(true) : onFindManually())}
            >
              {t('voiceOrder.row.change')}
            </Button>
            <Button variant="secondary" size="sm" onPress={onRemove}>
              {t('voiceOrder.row.remove')}
            </Button>
          </View>
        </>
      )}

      {/* Candidates */}
      {choosing && row.candidates.length > 0 && (
        <View className="gap-1.5">
          <Text className="font-onest-bold text-base text-ink" numberOfLines={2}>
            {chooseTitle}
          </Text>
          <View accessibilityRole="radiogroup" className="gap-1.5">
            {row.candidates.map((c) => {
              const on = row.selected?.variantId === c.variantId;
              const oos = c.stock <= 0;
              const badge = stockBadge(c.stock);
              return (
                <Pressable
                  key={c.variantId}
                  onPress={() => pick(c.variantId)}
                  disabled={oos}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on, disabled: oos }}
                  className={cn(
                    'min-h-14 flex-row items-center gap-3 rounded-2xl px-3 py-2',
                    on ? 'bg-primary' : 'bg-sunken',
                    oos && 'opacity-55'
                  )}
                >
                  <View
                    className={cn(
                      'w-[22px] h-[22px] rounded-full',
                      on ? 'border-[7px] border-accent' : 'border-[1.5px] border-muted'
                    )}
                  />
                  <View className="flex-1 min-w-0 gap-0.5">
                    {products.size > 1 && (
                      <Text
                        className={cn('font-onest text-xs', on ? 'text-on-primary' : 'text-muted')}
                        numberOfLines={1}
                      >
                        {c.productName}
                      </Text>
                    )}
                    <Text
                      className={cn('font-onest-bold text-[15px]', on ? 'text-on-primary' : 'text-ink')}
                      numberOfLines={2}
                    >
                      {candidateLabel(c)}
                    </Text>
                    <Money
                      value={c.price}
                      className={cn('font-onest text-xs', on ? 'text-on-primary' : 'text-muted')}
                      currencyClassName={on ? 'text-on-primary' : 'text-muted'}
                    />
                  </View>
                  <StatusBadge label={badge.label} tone={badge.tone} size="sm" />
                </Pressable>
              );
            })}
          </View>
          {hasMore && (
            <Text className="font-onest text-xs text-muted px-0.5">
              {t('voiceOrder.row.more', { shown: row.candidates.length, total: row.totalCandidates })}
            </Text>
          )}
          <View className="flex-row gap-2">
            <Button variant="secondary" size="sm" icon={Search} className="flex-1" onPress={onFindManually}>
              {t('voiceOrder.row.findManually')}
            </Button>
            <Button variant="ghost" size="sm" onPress={onRemove}>
              {t('voiceOrder.row.removeLine')}
            </Button>
          </View>
        </View>
      )}

      {/* Nothing found */}
      {!row.selected && row.candidates.length === 0 && (
        <View className="gap-2.5">
          <Text className="font-onest text-sm leading-5 text-soft">{t('voiceOrder.row.notFoundText')}</Text>
          <View className="flex-row gap-2">
            <Button variant="primary" size="sm" icon={Search} className="flex-1" onPress={onFindManually}>
              {t('voiceOrder.row.findManually')}
            </Button>
            <Button variant="secondary" size="sm" onPress={onRemove}>
              {t('voiceOrder.row.remove')}
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}
