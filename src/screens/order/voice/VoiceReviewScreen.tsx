import { Button, IconButton, Text, toast } from '@/components/base';
import { useTheme } from '@/hooks/use-theme';
import { useWorkingWarehouse } from '@/hooks/use-working-warehouse';
import { getApiErrorMessage } from '@/libs/api-error';
import {
  ORDER_ASSISTANT_DISABLED,
  ORDER_ASSISTANT_LIMITS,
  useMatchOrderText,
  useOrderAssistantFeedback,
} from '@/services/order-assistant';
import { isAxiosError } from 'axios';
import { router } from 'expo-router';
import { Check, MessageSquareText, Plus, RotateCw, TriangleAlert, WifiOff, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cartStore, useCart } from '../cart/cart-store';
import { VoiceInputSheet } from './VoiceInputSheet';
import { VoiceRowCard } from './VoiceRowCard';
import { feedbackChoices, rowSkips, toOrderVariant, useVoice, voiceStore } from './voice-store';

type ErrorKind = 'offline' | 'disabled' | 'busy' | 'tooLong' | 'other';

function errorKind(error: unknown): ErrorKind {
  if (!isAxiosError<{ code?: string }>(error)) return 'other';
  if (!error.response) return 'offline';
  const { status, data } = error.response;
  if (status === 403 && data?.code === ORDER_ASSISTANT_DISABLED) return 'disabled';
  if (status === 429) return 'busy';
  if (status === 400) return 'tooLong';
  return 'other';
}

/**
 * Review of the assistant's result (design «VoiceReview»): editable text +
 * «Искать заново», one card per phrase, «Ещё», «Добавить в корзину (N)».
 * Lines go to the shared cart (qty 1, catalogue price) with the cart's own
 * stock rules; the order is saved from the cart as usual.
 */
export function VoiceReviewScreen() {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const voice = useVoice();
  const cart = useCart();
  const working = useWorkingWarehouse();
  const match = useMatchOrderText();
  const feedback = useOrderAssistantFeedback();
  const [moreOpen, setMoreOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  const lastRequest = useRef<{ text: string; append: boolean } | null>(null);
  const started = useRef(false);

  const warehouseId = voice.warehouseId;
  const warehouseName = working.warehouses.find((w) => w.id === warehouseId)?.name;

  const run = (text: string, append: boolean) => {
    if (!warehouseId || !text.trim()) return;
    lastRequest.current = { text, append };
    match.mutate(
      { warehouseId, text },
      {
        onSuccess: ({ lines }) => {
          voiceStore.setLines(lines, append);
          setSearched(true);
        },
      }
    );
  };

  // The text from the cart's sheet is searched once on open.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (voice.rows.length === 0 && voice.transcript.trim()) run(voice.transcript, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    voiceStore.clear();
    router.back();
  };

  const loading = match.isPending;
  const failed = match.isError && !loading;
  const rows = voice.rows;
  const skips = rowSkips(rows, cart.lines);
  const nAdd = rows.filter((r) => r.selected && !skips.has(r.key)).length;
  const nSkipped = rows.filter((r) => r.selected && skips.has(r.key)).length;
  const nChoose = rows.filter((r) => !r.selected && r.candidates.length > 0).length;
  const nMissing = rows.filter((r) => !r.selected && r.candidates.length === 0).length;
  const noneFound = searched && rows.length > 0 && rows.every((r) => !r.selected && r.candidates.length === 0);
  const showRows = !loading && !failed;

  const summary = [
    nAdd > 0 && { key: 'found', label: t('voiceOrder.summary.found', { count: nAdd }), box: 'bg-ok-bg', text: 'text-ok-fg' },
    nSkipped > 0 && { key: 'skip', label: t('voiceOrder.summary.skipped', { count: nSkipped }), box: 'bg-err-bg', text: 'text-err-fg' },
    nChoose > 0 && { key: 'choose', label: t('voiceOrder.summary.choose', { count: nChoose }), box: 'bg-warn-bg', text: 'text-warn-fg' },
    nMissing > 0 && { key: 'miss', label: t('voiceOrder.summary.missing', { count: nMissing }), box: 'bg-err-bg', text: 'text-err-fg' },
  ].filter((x): x is { key: string; label: string; box: string; text: string } => Boolean(x));

  const warn =
    showRows && nAdd > 0 && nSkipped + nChoose + nMissing > 0
      ? t('voiceOrder.warn', {
          list: [
            nChoose > 0 && t('voiceOrder.warnChoose', { count: nChoose }),
            nSkipped > 0 && t('voiceOrder.warnSkipped', { count: nSkipped }),
            nMissing > 0 && t('voiceOrder.warnMissing', { count: nMissing }),
          ]
            .filter(Boolean)
            .join(', '),
        })
      : null;

  const findManually = (key: string, phrase: string) => {
    router.push({ pathname: '/(tabs)/(orders)/search', params: { pick: key, q: phrase } });
  };

  const addToCart = () => {
    if (!warehouseId || cart.warehouseId !== warehouseId) return;
    let added = 0;
    for (const row of rows) {
      if (!row.selected || skips.has(row.key)) continue;
      if (cartStore.addVariant(toOrderVariant(row.selected)) === 'added') added += 1;
    }
    const choices = feedbackChoices(rows);
    // Fire-and-forget: learning must never block the sale.
    if (choices.length > 0) feedback.mutate({ warehouseId, choices });
    toast.show(t('voiceOrder.added', { count: added }));
    voiceStore.clear();
    router.back();
  };

  const kind = failed ? errorKind(match.error) : null;
  const room = ORDER_ASSISTANT_LIMITS.TEXT_LENGTH - voice.transcript.length - 1;

  return (
    <View className="flex-1 bg-bg">
      <View className="flex-row items-center gap-2.5 px-4 pt-2 pb-3">
        <IconButton icon={X} accessibilityLabel={t('voiceOrder.review.close')} onPress={close} />
        <View className="flex-1 min-w-0">
          <Text className="type-heading text-ink" accessibilityRole="header">
            {loading ? t('voiceOrder.review.searchingTitle') : t('voiceOrder.review.title')}
          </Text>
          <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>
            {warehouseName}
          </Text>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12 }}
      >
        {/* Seller's text */}
        <View className="bg-card rounded-3xl p-3.5 gap-2.5">
          <View className="flex-row items-center justify-between px-0.5">
            <View className="flex-row items-center gap-1.5">
              <MessageSquareText size={16} color={colors.soft} strokeWidth={2} />
              <Text className="font-onest-semibold text-[13px] text-soft">{t('voiceOrder.review.text')}</Text>
            </View>
            <Text className="font-onest text-xs text-muted">{t('voiceOrder.review.editable')}</Text>
          </View>
          <TextInput
            value={voice.transcript}
            onChangeText={(v) => voiceStore.setTranscript(v)}
            multiline
            textAlignVertical="top"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={ORDER_ASSISTANT_LIMITS.TEXT_LENGTH}
            accessibilityLabel={t('voiceOrder.review.text')}
            className="min-h-[108px] max-h-[200px] rounded-2xl bg-sunken px-3.5 py-3 font-onest-medium text-[15px] leading-[22px] text-ink"
          />
          {!loading && (
            <Button
              variant="primary"
              size="sm"
              icon={RotateCw}
              className="self-start"
              disabled={!voice.transcript.trim()}
              onPress={() => run(voice.transcript, false)}
            >
              {t('voiceOrder.review.research')}
            </Button>
          )}
        </View>

        {/* Searching */}
        {loading && (
          <View className="gap-2.5" accessibilityState={{ busy: true }}>
            <View className="bg-hero rounded-3xl p-4 gap-3">
              <Text className="font-onest-bold text-base text-hero-ink">{t('voiceOrder.review.searching')}</Text>
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" color={colors.accent} />
                <Text className="font-onest text-[13px] text-hero-ink">{t('voiceOrder.review.searchingStep')}</Text>
              </View>
            </View>
            {[0, 1, 2].map((i) => (
              <View key={i} className="bg-card rounded-[22px] p-3.5 flex-row gap-3">
                <View className="w-[52px] h-[52px] rounded-[14px] bg-sunken" />
                <View className="flex-1 gap-2 pt-0.5">
                  <View className="w-[30%] h-2.5 rounded bg-sunken" />
                  <View className="w-[70%] h-3.5 rounded bg-sunken" />
                  <View className="w-[45%] h-2.5 rounded bg-sunken" />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Request failed */}
        {failed && kind && (
          <View className="bg-card rounded-3xl px-5 py-6 items-center gap-2.5" accessibilityRole="alert">
            <View className="w-16 h-16 rounded-full bg-err-bg items-center justify-center">
              {kind === 'offline' ? (
                <WifiOff size={28} color={colors.errFg} strokeWidth={2} />
              ) : (
                <TriangleAlert size={28} color={colors.errFg} strokeWidth={2} />
              )}
            </View>
            <Text className="font-onest-bold text-lg text-ink text-center">{t(`voiceOrder.error.${kind}Title`)}</Text>
            <Text className="font-onest text-sm leading-5 text-muted text-center">
              {kind === 'other'
                ? getApiErrorMessage(match.error, t('voiceOrder.error.otherText'))
                : t(`voiceOrder.error.${kind}Text`)}
            </Text>
            {kind !== 'disabled' && kind !== 'tooLong' && (
              <Button
                variant="primary"
                className="mt-1"
                onPress={() => lastRequest.current && run(lastRequest.current.text, lastRequest.current.append)}
              >
                {t('voiceOrder.error.retry')}
              </Button>
            )}
          </View>
        )}

        {/* Result */}
        {showRows && (
          <>
            {summary.length > 0 && (
              <View className="flex-row flex-wrap gap-1.5">
                {summary.map((x) => (
                  <View key={x.key} className={`px-3 py-1.5 rounded-pill ${x.box}`}>
                    <Text className={`font-onest-bold text-[13px] ${x.text}`}>{x.label}</Text>
                  </View>
                ))}
              </View>
            )}
            {noneFound && (
              <View className="bg-card rounded-[22px] p-4 gap-1.5">
                <Text className="font-onest-bold text-base text-ink">{t('voiceOrder.review.noneTitle')}</Text>
                <Text className="font-onest text-[13px] leading-[19px] text-muted">{t('voiceOrder.review.noneText')}</Text>
              </View>
            )}
            {searched && rows.length === 0 && (
              <View className="bg-card rounded-[22px] p-4 gap-1.5">
                <Text className="font-onest-bold text-base text-ink">{t('voiceOrder.review.emptyTitle')}</Text>
                <Text className="font-onest text-[13px] leading-[19px] text-muted">{t('voiceOrder.review.emptyText')}</Text>
              </View>
            )}
            {rows.map((row) => (
              <VoiceRowCard
                key={row.key}
                row={row}
                skip={skips.get(row.key)}
                onPick={(variantId) => voiceStore.pick(row.key, variantId)}
                onFindManually={() => findManually(row.key, row.phrase)}
                onRemove={() => voiceStore.remove(row.key)}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Bottom actions */}
      <View className="px-4 pt-3 gap-2 bg-bg" style={{ paddingBottom: insets.bottom + 12 }}>
        {warn && (
          <View className="flex-row items-center gap-2 rounded-[14px] bg-warn-bg px-3 py-2.5">
            <TriangleAlert size={16} color={colors.warnFg} strokeWidth={2} />
            <Text className="flex-1 font-onest-semibold text-[13px] leading-[18px] text-warn-fg">{warn}</Text>
          </View>
        )}
        <View className="flex-row gap-2">
          <Button
            variant="secondary"
            size="lg"
            icon={Plus}
            disabled={loading || room < 2}
            onPress={() => setMoreOpen(true)}
            accessibilityLabel={t('voiceOrder.review.moreA11y')}
          >
            {t('voiceOrder.review.more')}
          </Button>
          <Button
            variant="accent"
            size="lg"
            icon={nAdd > 0 ? Check : undefined}
            className="flex-1"
            disabled={loading || nAdd === 0}
            onPress={addToCart}
          >
            {loading
              ? t('voiceOrder.review.searchingShort')
              : nAdd > 0
                ? t('voiceOrder.review.addCount', { count: nAdd })
                : t('voiceOrder.review.add')}
          </Button>
        </View>
      </View>

      <VoiceInputSheet
        isOpen={moreOpen}
        warehouseId={warehouseId}
        append
        maxLength={room}
        onClose={() => setMoreOpen(false)}
        onSubmit={(text) => {
          setMoreOpen(false);
          voiceStore.setTranscript(voice.transcript.trim() ? `${voice.transcript.trimEnd()}\n${text}` : text);
          run(text, true);
        }}
      />
    </View>
  );
}
