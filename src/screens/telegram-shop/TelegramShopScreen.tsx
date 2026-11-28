import { Button, IconButton, StatusBadge, Text, toast } from '@/components/base';
import { ConfirmSheet, EmptyState, LoadingState } from '@/components/common';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/libs/api-error';
import { canConnectTelegramShop } from '@/libs/roles';
import { useAuth } from '@/provider/AuthProvider';
import {
  useCreateNotifyLink,
  useDisconnectTelegramBot,
  useSendTelegramTest,
  useTelegramShop,
  type NotifyLink,
  type TelegramBotView,
} from '@/services/telegram-shop';
import { router } from 'expo-router';
import {
  Bell,
  BellOff,
  Bot,
  ChevronLeft,
  CircleAlert,
  ExternalLink,
  Link2,
  Pencil,
  RefreshCw,
  ShieldX,
  Unplug,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Linking, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConnectBotForm } from './ConnectBotForm';

/**
 * Profile → «Telegram-магазин» (store OWNER, when the admin switched the paid service on):
 * the instruction and form to connect the store's own bot; once connected — the bot, the
 * shop address, the chat that receives new requests, a test message and disconnecting.
 * Plan: `billing/docs/telegram-shop/PLAN.md`.
 */
export function TelegramShopScreen() {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const allowed = canConnectTelegramShop(user);
  const query = useTelegramShop(allowed);
  const refreshControl = useRefreshControl(query.refetch);
  const [editing, setEditing] = useState(false);

  const { refetch } = query;
  // The owner presses «Start» in Telegram and comes back: show the linked chat at once
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refetch();
    });

    return () => subscription.remove();
  }, [refetch]);

  const header = (
    <View className="flex-row items-center gap-2.5 px-4 pt-2 pb-3">
      <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
      <Text className="flex-1 type-heading text-ink" accessibilityRole="header">
        {t('telegramShop.title')}
      </Text>
    </View>
  );

  if (!allowed) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <EmptyState icon={ShieldX} message={t('telegramShop.noAccess')} />
      </View>
    );
  }
  if (query.isLoading) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <LoadingState />
      </View>
    );
  }
  const state = query.data;
  if (!state) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <EmptyState icon={CircleAlert} message={t('telegramShop.loadFailed')}>
          <Button variant="secondary" onPress={() => void refetch()}>
            {t('telegramShop.notifyCheck')}
          </Button>
        </EmptyState>
      </View>
    );
  }
  if (!state.enabled && !state.bot) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <EmptyState icon={ShieldX} message={t('telegramShop.disabled')} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg">
      {header}
      <ScrollView
        className="flex-1"
        refreshControl={refreshControl}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24, gap: 12 }}
      >
        {!state.configured ? (
          <View className="flex-row items-start gap-2.5 bg-warn-bg rounded-xl px-4 py-3" accessibilityRole="alert">
            <CircleAlert size={18} color={colors.warnFg} strokeWidth={2} />
            <Text className="flex-1 font-onest-semibold text-[13px] leading-[18px] text-warn-fg">
              {t('telegramShop.notConfigured')}
            </Text>
          </View>
        ) : null}

        {state.bot && !editing ? (
          <ConnectedView bot={state.bot} onEdit={() => setEditing(true)} onCheck={() => void refetch()} />
        ) : (
          <>
            {!state.bot ? (
              <Text className="font-onest text-sm leading-5 text-muted px-1">{t('telegramShop.intro')}</Text>
            ) : null}
            <ConnectBotForm
              initialSlug={state.bot?.slug}
              onDone={() => setEditing(false)}
              onCancel={state.bot ? () => setEditing(false) : undefined}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ConnectedView({
  bot,
  onEdit,
  onCheck,
}: {
  bot: TelegramBotView;
  onEdit: () => void;
  onCheck: () => void;
}) {
  const { t } = useTranslation();
  const colors = useTheme();
  const disconnect = useDisconnectTelegramBot();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitDisconnect = () => {
    setError(null);
    disconnect.mutate(undefined, {
      onSuccess: () => {
        setConfirmOpen(false);
        toast.show(t('telegramShop.disconnected'));
      },
      onError: (e) => setError(getApiErrorMessage(e, t('telegramShop.disconnectFailed'))),
    });
  };

  return (
    <>
      <View className="bg-card rounded-2xl p-4 gap-3">
        <View className="flex-row items-center gap-3">
          <View className="w-11 h-11 rounded-[14px] bg-accent items-center justify-center">
            <Bot size={22} color={colors.onAccent} strokeWidth={2} />
          </View>
          <View className="flex-1 min-w-0 gap-0.5">
            <Text className="font-onest text-xs text-muted">{t('telegramShop.botTitle')}</Text>
            <Text className="font-onest-bold text-[17px] text-ink" numberOfLines={1}>
              @{bot.botUsername}
            </Text>
          </View>
          <StatusBadge
            label={bot.isActive ? t('telegramShop.botActive') : t('telegramShop.botPaused')}
            tone={bot.isActive ? 'ok' : 'neutral'}
          />
        </View>

        <View className="border-t border-line pt-3 gap-3">
          <View className="flex-row items-center gap-3">
            <View className="flex-1 min-w-0 gap-0.5">
              <Text className="font-onest text-xs text-muted">{t('telegramShop.botLink')}</Text>
              <Text selectable className="font-onest-semibold text-[15px] text-ink" numberOfLines={1}>
                {bot.botLink}
              </Text>
            </View>
            <IconButton
              icon={ExternalLink}
              variant="sunken"
              size="sm"
              accessibilityLabel={t('telegramShop.open')}
              onPress={() => void Linking.openURL(bot.botLink)}
            />
          </View>
          {bot.miniAppUrl ? (
            <View className="gap-0.5">
              <Text className="font-onest text-xs text-muted">{t('telegramShop.shopAddress')}</Text>
              <Text selectable className="font-onest-semibold text-[15px] text-ink">
                {bot.miniAppUrl}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <NotifyCard bot={bot} onCheck={onCheck} />

      <View className="gap-2">
        <Button variant="secondary" size="lg" full icon={Pencil} onPress={onEdit}>
          {t('telegramShop.edit')}
        </Button>
        <Button variant="danger" size="lg" full icon={Unplug} onPress={() => setConfirmOpen(true)}>
          {t('telegramShop.disconnect')}
        </Button>
      </View>

      <ConfirmSheet
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t('telegramShop.disconnectTitle')}
        message={t('telegramShop.disconnectText')}
        confirmLabel={t('telegramShop.disconnectConfirm')}
        tone="danger"
        loading={disconnect.isPending}
        error={error}
        onConfirm={submitDisconnect}
      />
    </>
  );
}

/**
 * The chat that receives «new request» messages. The link is made ahead of the tap: opening
 * Telegram from a button press (not after a request) is not blocked as a pop-up on the web.
 */
function NotifyCard({ bot, onCheck }: { bot: TelegramBotView; onCheck: () => void }) {
  const { t } = useTranslation();
  const colors = useTheme();
  const createLink = useCreateNotifyLink();
  const test = useSendTelegramTest();
  const [rebinding, setRebinding] = useState(false);
  const [link, setLink] = useState<NotifyLink | null>(null);

  const showLinks = !bot.notifyConnected || rebinding;
  const { mutate: makeLink } = createLink;

  const loadLink = useCallback(() => {
    makeLink(undefined, {
      onSuccess: setLink,
      onError: (e) => toast.show(getApiErrorMessage(e, t('telegramShop.notifyLinkFailed')), 'error'),
    });
  }, [makeLink, t]);

  useEffect(() => {
    if (showLinks && !link) loadLink();
  }, [showLinks, link, loadLink]);

  // Chat linked: back to the calm view
  useEffect(() => {
    if (bot.notifyConnected) setRebinding(false);
  }, [bot.notifyConnected]);

  const open = (url: string) => {
    if (!link || new Date(link.expiresAt).getTime() < Date.now()) {
      // Expired while the screen was open: a fresh one is ready for the next tap
      setLink(null);
      loadLink();

      return;
    }
    void Linking.openURL(url);
  };

  const sendTest = () =>
    test.mutate(undefined, {
      onSuccess: () => toast.show(t('telegramShop.testSent')),
      onError: (e) => toast.show(getApiErrorMessage(e, t('telegramShop.testFailed')), 'error'),
    });

  return (
    <View className="bg-card rounded-2xl p-4 gap-3">
      <View className="flex-row items-start gap-3">
        <View
          className={
            bot.notifyConnected
              ? 'w-10 h-10 rounded-full bg-ok-bg items-center justify-center'
              : 'w-10 h-10 rounded-full bg-warn-bg items-center justify-center'
          }
        >
          {bot.notifyConnected ? (
            <Bell size={20} color={colors.okFg} strokeWidth={2} />
          ) : (
            <BellOff size={20} color={colors.warnFg} strokeWidth={2} />
          )}
        </View>
        <View className="flex-1 min-w-0 gap-1">
          <Text className="font-onest-bold text-[15px] text-ink">{t('telegramShop.notifyTitle')}</Text>
          <Text className="font-onest text-[13px] leading-[18px] text-muted">
            {bot.notifyConnected ? t('telegramShop.notifyOk') : t('telegramShop.notifyNone')}
          </Text>
        </View>
      </View>

      {showLinks ? (
        <View className="gap-2">
          <Text className="font-onest text-[13px] leading-[18px] text-muted">{t('telegramShop.notifyHow')}</Text>
          <Button icon={Link2} full disabled={!link} loading={createLink.isPending && !link} onPress={() => open(link?.link ?? '')}>
            {t('telegramShop.notifyLink')}
          </Button>
          <Button variant="secondary" full disabled={!link} onPress={() => open(link?.groupLink ?? '')}>
            {t('telegramShop.notifyGroup')}
          </Button>
          <Button variant="ghost" icon={RefreshCw} full onPress={onCheck}>
            {t('telegramShop.notifyCheck')}
          </Button>
        </View>
      ) : (
        <View className="gap-2">
          <Button variant="secondary" full loading={test.isPending} onPress={sendTest}>
            {t('telegramShop.test')}
          </Button>
          <Button
            variant="ghost"
            full
            onPress={() => {
              setLink(null);
              setRebinding(true);
            }}
          >
            {t('telegramShop.notifyRebind')}
          </Button>
        </View>
      )}
    </View>
  );
}
