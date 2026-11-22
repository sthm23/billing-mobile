import { Button, Chip, IconButton, Pressable, Text, toast } from '@/components/base';
import { Sheet, SheetTextInput } from '@/components/base/Sheet';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/libs/api-error';
import { formatDate } from '@/libs/date';
import { cn } from '@/libs/utils';
import {
  useCreateStoreWarehouse,
  useResumeStore,
  useSuspendStore,
  useUpdateAdminStore,
  type AdminStoreDetails,
  type StoreSuspendReason,
} from '@/services/admin-store';
import { Pause, Pencil, Play, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

const INPUT_CLASS = 'h-[52px] px-4 rounded-2xl bg-sunken font-onest text-base text-ink';
const SUSPEND_REASONS: StoreSuspendReason[] = ['UNPAID', 'OWNER_REQUEST', 'OTHER'];
/** «Оплачено до»: months from today, or none (trial / previous date) */
const PAID_OPTIONS = [1, 3, 0] as const;
type PaidOption = (typeof PAID_OPTIONS)[number];

interface ShopSheetProps {
  store: AdminStoreDetails;
  isOpen: boolean;
  onClose: () => void;
}

/** «2026-12-11» — the day `months` months from today (local) */
function dateInMonths(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  const pad = (n: number) => String(n).padStart(2, '0');

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function SheetHeader({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  const { t } = useTranslation();

  return (
    <View className="flex-row items-start gap-2">
      <View className="flex-1 min-w-0 gap-0.5">
        <Text className="type-title text-ink" accessibilityRole="header">{title}</Text>
        {subtitle ? (
          <Text className="font-onest text-[13px] text-muted" numberOfLines={2}>{subtitle}</Text>
        ) : null}
      </View>
      <IconButton icon={X} variant="sunken" accessibilityLabel={t('common.close')} onPress={onClose} />
    </View>
  );
}

function ErrorBox({ error }: { error: string | null }) {
  if (!error) return null;

  return (
    <View className="bg-err-bg rounded-lg px-4 py-3" accessibilityRole="alert">
      <Text className="font-onest-semibold text-[13px] leading-[18px] text-err-fg">{error}</Text>
    </View>
  );
}

/** «⋯» menu of the store card: rename, suspend / resume */
export function ShopMenuSheet({
  store,
  isOpen,
  onClose,
  onRename,
  onToggleSuspend,
}: ShopSheetProps & { onRename: () => void; onToggleSuspend: () => void }) {
  const { t } = useTranslation();
  const colors = useTheme();
  const suspended = store.status === 'SUSPENDED';
  const items = [
    { key: 'rename', icon: Pencil, label: t('adminShop.menu.rename'), color: colors.ink, onPress: onRename },
    {
      key: 'suspend',
      icon: suspended ? Play : Pause,
      label: suspended ? t('adminShop.menu.resume') : t('adminShop.menu.suspend'),
      color: suspended ? colors.ink : colors.errFg,
      onPress: onToggleSuspend,
    },
  ];

  return (
    <Sheet isOpen={isOpen} onClose={onClose} size="auto">
      <View className="px-4 pt-1 pb-3 gap-1">
        <Text className="font-onest-semibold text-[13px] text-muted pb-1" numberOfLines={1}>{store.name}</Text>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Pressable
              key={item.key}
              onPress={item.onPress}
              accessibilityRole="button"
              className="flex-row items-center gap-3 h-[52px] px-3 rounded-2xl active:bg-sunken"
            >
              <Icon size={20} color={item.color} strokeWidth={2} />
              <Text
                className={cn('font-onest-semibold text-[15px]', item.key === 'suspend' && !suspended ? 'text-err-fg' : 'text-ink')}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

/** «Переименовать» */
export function RenameShopSheet({ store, isOpen, onClose }: ShopSheetProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const update = useUpdateAdminStore();
  const [name, setName] = useState(store.name);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName(store.name);
    setError(null);
  }, [isOpen, store.name]);

  const trimmed = name.trim();
  const submit = () => {
    setError(null);
    update.mutate(
      { id: store.id, name: trimmed },
      {
        onSuccess: () => {
          toast.show(t('adminShop.rename.done'));
          onClose();
        },
        onError: (e) => setError(getApiErrorMessage(e, t('adminShop.saveFailed'))),
      },
    );
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} size="auto">
      <View className="px-4 pt-1 pb-3 gap-3.5">
        <SheetHeader title={t('adminShop.rename.title')} onClose={onClose} />
        <View className="gap-1.5">
          <Text className="font-onest-semibold text-[13px] text-soft">{t('adminShop.rename.label')}</Text>
          <SheetTextInput
            value={name}
            onChangeText={setName}
            placeholder={t('adminShop.rename.placeholder')}
            placeholderTextColor={colors.muted}
            className={INPUT_CLASS}
            maxLength={120}
            accessibilityLabel={t('adminShop.rename.label')}
          />
        </View>
        <ErrorBox error={error} />
        <Button
          size="lg"
          full
          disabled={!trimmed || trimmed === store.name}
          loading={update.isPending}
          onPress={submit}
        >
          {t('adminShop.rename.submit')}
        </Button>
      </View>
    </Sheet>
  );
}

/** «Приостановить магазин?» — effects, reason, comment for the owner */
export function SuspendShopSheet({ store, isOpen, onClose }: ShopSheetProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const suspend = useSuspendStore();
  const [reason, setReason] = useState<StoreSuspendReason>('UNPAID');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setReason('UNPAID');
    setComment('');
    setError(null);
  }, [isOpen]);

  const effects = [
    { sign: '×', text: t('adminShop.suspend.effectStaff'), tone: 'bg-err-bg', ink: 'text-err-fg' },
    { sign: '✓', text: t('adminShop.suspend.effectData'), tone: 'bg-ok-bg', ink: 'text-ok-fg' },
    { sign: '↺', text: t('adminShop.suspend.effectResume'), tone: 'bg-sunken', ink: 'text-soft' },
  ];

  const submit = () => {
    setError(null);
    suspend.mutate(
      { id: store.id, reason, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          toast.show(t('adminShop.suspend.done'));
          onClose();
        },
        onError: (e) => setError(getApiErrorMessage(e, t('adminShop.saveFailed'))),
      },
    );
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} size="auto">
      <View className="px-4 pt-1 pb-3 gap-3.5">
        <SheetHeader
          title={t('adminShop.suspend.title')}
          subtitle={store.owner ? `${store.name} · ${store.owner.fullName}` : store.name}
          onClose={onClose}
        />
        <View className="gap-2.5">
          {effects.map((effect) => (
            <View key={effect.sign} className="flex-row items-start gap-2.5">
              <View className={cn('w-[22px] h-[22px] rounded-full items-center justify-center', effect.tone)}>
                <Text className={cn('font-onest-bold text-xs', effect.ink)}>{effect.sign}</Text>
              </View>
              <Text className="flex-1 font-onest text-sm leading-5 text-ink">{effect.text}</Text>
            </View>
          ))}
        </View>
        <View className="gap-2">
          <Text className="font-onest-semibold text-[13px] text-soft">{t('adminShop.suspend.reason')}</Text>
          <View className="flex-row flex-wrap gap-2">
            {SUSPEND_REASONS.map((r) => (
              <Chip key={r} label={t(`adminShop.reason.${r}`)} tone="sunken" selected={reason === r} onPress={() => setReason(r)} />
            ))}
          </View>
          <SheetTextInput
            value={comment}
            onChangeText={setComment}
            placeholder={t('adminShop.suspend.comment')}
            placeholderTextColor={colors.muted}
            className={INPUT_CLASS}
            maxLength={300}
            accessibilityLabel={t('adminShop.suspend.comment')}
          />
        </View>
        <ErrorBox error={error} />
        <View className="flex-row gap-2 pt-1">
          <View className="flex-1">
            <Button variant="secondary" size="lg" full onPress={onClose}>{t('adminShop.cancel')}</Button>
          </View>
          <View className="flex-1">
            <Button variant="danger" size="lg" full loading={suspend.isPending} onPress={submit}>
              {t('adminShop.suspend.submit')}
            </Button>
          </View>
        </View>
      </View>
    </Sheet>
  );
}

/** «Возобновить работу» — optional «оплачено до» (+1 / +3 months) */
export function ResumeShopSheet({ store, isOpen, onClose }: ShopSheetProps) {
  const { t } = useTranslation();
  const resume = useResumeStore();
  const [paid, setPaid] = useState<PaidOption>(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setPaid(1);
    setError(null);
  }, [isOpen]);

  const paidUntil = paid ? dateInMonths(paid) : undefined;
  const submit = () => {
    setError(null);
    resume.mutate(
      { id: store.id, paidUntil },
      {
        onSuccess: () => {
          toast.show(t('adminShop.resume.done'));
          onClose();
        },
        onError: (e) => setError(getApiErrorMessage(e, t('adminShop.saveFailed'))),
      },
    );
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} size="auto">
      <View className="px-4 pt-1 pb-3 gap-3.5">
        <SheetHeader
          title={t('adminShop.resume.title', { name: store.name })}
          subtitle={
            paidUntil
              ? t('adminShop.resume.textPaid', { date: formatDate(paidUntil) })
              : t('adminShop.resume.textNoPay')
          }
          onClose={onClose}
        />
        <View className="gap-2">
          <Text className="font-onest-semibold text-[13px] text-soft">{t('adminShop.resume.paidUntil')}</Text>
          <View className="flex-row flex-wrap gap-2">
            {PAID_OPTIONS.map((m) => (
              <Chip
                key={m}
                label={m ? t('adminShop.resume.months', { count: m }) : t('adminShop.resume.noPay')}
                tone="sunken"
                selected={paid === m}
                onPress={() => setPaid(m)}
              />
            ))}
          </View>
        </View>
        <ErrorBox error={error} />
        <View className="flex-row gap-2 pt-1">
          <View className="flex-1">
            <Button variant="secondary" size="lg" full onPress={onClose}>{t('adminShop.cancel')}</Button>
          </View>
          <View className="flex-1">
            <Button variant="accent" size="lg" full loading={resume.isPending} onPress={submit}>
              {t('adminShop.resume.submit')}
            </Button>
          </View>
        </View>
      </View>
    </Sheet>
  );
}

/** «Новый склад» — access for staff is given by the owner */
export function NewWarehouseSheet({ store, isOpen, onClose }: ShopSheetProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const create = useCreateStoreWarehouse();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName('');
    setError(null);
  }, [isOpen]);

  const trimmed = name.trim();
  const submit = () => {
    setError(null);
    create.mutate(
      { storeId: store.id, name: trimmed },
      {
        onSuccess: () => {
          toast.show(t('adminShop.warehouse.done'));
          onClose();
        },
        onError: (e) => setError(getApiErrorMessage(e, t('adminShop.saveFailed'))),
      },
    );
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} size="auto">
      <View className="px-4 pt-1 pb-3 gap-3.5">
        <SheetHeader
          title={t('adminShop.warehouse.title')}
          subtitle={t('adminShop.warehouse.subtitle', { name: store.name })}
          onClose={onClose}
        />
        <View className="gap-1.5">
          <Text className="font-onest-semibold text-[13px] text-soft">{t('adminShop.warehouse.label')}</Text>
          <SheetTextInput
            value={name}
            onChangeText={setName}
            placeholder={t('adminShop.warehouse.placeholder')}
            placeholderTextColor={colors.muted}
            className={INPUT_CLASS}
            maxLength={120}
            accessibilityLabel={t('adminShop.warehouse.label')}
          />
        </View>
        <ErrorBox error={error} />
        <Button variant="accent" size="lg" full disabled={!trimmed} loading={create.isPending} onPress={submit}>
          {t('adminShop.warehouse.submit')}
        </Button>
      </View>
    </Sheet>
  );
}
