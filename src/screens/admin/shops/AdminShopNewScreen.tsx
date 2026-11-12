import { Button, Chip, IconButton, Input, InputField, Pressable, Switch, Text, toast } from '@/components/base';
import { SafeAreaView } from '@/components/base/SafeAreaView';
import { EmptyState } from '@/components/common';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/libs/api-error';
import { isAdmin } from '@/libs/roles';
import { cn } from '@/libs/utils';
import { useAuth } from '@/provider/AuthProvider';
import {
  useAllAttributes,
  useAllBrands,
  useCreateAdminStore,
  useRootCategories,
  type NewStoreAttribute,
  type StoreMode,
} from '@/services/admin-store';
import { formatNationalPhone, PHONE_DIGITS, PHONE_PREFIX } from '@/screens/profile/staff/staff-format';
import { isAxiosError } from 'axios';
import { router } from 'expo-router';
import { ChevronLeft, CircleAlert, Eye, EyeOff, Gift, Info, Plus, ShieldX, X } from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AttributeSheet, BrandSheet } from './NewShopSheets';

/** Same rules as the backend DTO (POST /admin/stores) */
const LOGIN_PATTERN = /^[A-Za-z0-9._]{3,40}$/;
const INN_DIGITS = 9;
const MIN_PASSWORD = 8;
const MODES: StoreMode[] = ['sale', 'rent'];

type FieldKey = 'name' | 'inn' | 'fullName' | 'phone' | 'login' | 'password' | 'warehouseName';
type Errors = Partial<Record<FieldKey, string>>;

function Field({
  label,
  optional,
  error,
  hint,
  children,
}: {
  label: string;
  optional?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <View className="gap-1.5">
      <Text className="font-onest-semibold text-[13px] text-soft">
        {label}
        {optional ? <Text className="font-onest text-[13px] text-muted">{` · ${optional}`}</Text> : null}
      </Text>
      {children}
      {error ? (
        <Text className="font-onest-medium text-xs text-err-fg">{error}</Text>
      ) : hint ? (
        <Text className="font-onest text-xs text-muted">{hint}</Text>
      ) : null}
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="bg-card rounded-[24px] px-3.5 py-4 gap-3.5">
      <Text className="font-onest-semibold text-[15px] text-ink" accessibilityRole="header">{title}</Text>
      {children}
    </View>
  );
}

/**
 * «Новый магазин» (ADMIN): store, first warehouse and a NEW owner (one owner —
 * one store), catalog (brands, attributes), modes. One request — POST
 * /admin/stores creates everything in a transaction; the store starts on a
 * one-month trial (backend).
 */
export function AdminShopNewScreen() {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const admin = isAdmin(user);

  const categories = useRootCategories(admin);
  const brandsCatalog = useAllBrands(admin);
  const attributesCatalog = useAllAttributes(admin);
  const create = useCreateAdminStore();

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [inn, setInn] = useState('');
  const [note, setNote] = useState('');
  const [warehouseName, setWarehouseName] = useState(() => t('adminShopNew.defaultWarehouse'));
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [brandNames, setBrandNames] = useState<string[]>([]);
  const [attributeIds, setAttributeIds] = useState<string[]>([]);
  const [newAttributes, setNewAttributes] = useState<NewStoreAttribute[]>([]);
  const [modes, setModes] = useState<Record<StoreMode, boolean>>({ sale: true, rent: false });
  const [sheet, setSheet] = useState<'none' | 'brand' | 'attr'>('none');
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const required = [name, categoryId, warehouseName, fullName, phone, login, password];
  const isFilled = required.every((v) => typeof v === 'string' && v.trim().length > 0);

  const category = useMemo(
    () => categories.data?.find((c) => c.id === categoryId),
    [categories.data, categoryId],
  );

  const validate = (): Errors => {
    const e: Errors = {};
    if (!name.trim()) e.name = t('adminShopNew.errors.name');
    if (inn.trim() && inn.replace(/\D/g, '').length !== INN_DIGITS) e.inn = t('adminShopNew.errors.inn');
    if (!warehouseName.trim()) e.warehouseName = t('adminShopNew.errors.warehouse');
    if (!fullName.trim()) e.fullName = t('adminShopNew.errors.fullName');
    if (phone.length !== PHONE_DIGITS) e.phone = t('adminShopNew.errors.phone');
    if (!LOGIN_PATTERN.test(login.trim())) e.login = t('adminShopNew.errors.login');
    if (password.length < MIN_PASSWORD) e.password = t('adminShopNew.errors.password');

    return e;
  };

  const submit = () => {
    setServerError(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length || !categoryId) return;

    create.mutate(
      {
        name: name.trim(),
        categoryId,
        address: address.trim() || undefined,
        inn: inn.replace(/\D/g, '') || undefined,
        note: note.trim() || undefined,
        warehouseName: warehouseName.trim(),
        owner: { fullName: fullName.trim(), phone: `${PHONE_PREFIX}${phone}`, login: login.trim(), password },
        brandNames,
        attributeIds,
        newAttributes,
        salesEnabled: modes.sale,
        rentalEnabled: modes.rent,
      },
      {
        onSuccess: (store) => {
          toast.show(t('adminShopNew.created', { login: login.trim() }), 'success');
          router.replace({ pathname: '/(tabs)/(profile)/shops/[id]', params: { id: store.id } });
        },
        onError: (err) => {
          setServerError(
            isAxiosError(err) && err.response?.status === 409
              ? t('adminShopNew.errors.taken')
              : getApiErrorMessage(err, t('adminShopNew.errors.failed')),
          );
        },
      },
    );
  };

  const toggleMode = (mode: StoreMode, on: boolean) => {
    const next = { ...modes, [mode]: on };
    if (!next.sale && !next.rent) return; // at least one stays on (hint below)
    setModes(next);
  };

  const addAttribute = (attr: NewStoreAttribute): string | null => {
    const key = attr.name.toLowerCase();
    const existing = attributesCatalog.data?.find((a) => a.name.toLowerCase() === key);
    if (existing) {
      if (existing.type !== attr.type) {
        return t('adminShopNew.attr.typeConflict', {
          name: existing.name,
          type: t(`adminShopNew.attr.types.${existing.type}`),
        });
      }
      setAttributeIds((ids) => (ids.includes(existing.id) ? ids : [...ids, existing.id]));
      return null;
    }
    if (newAttributes.some((a) => a.name.toLowerCase() === key)) return t('adminShopNew.attr.duplicate');
    setNewAttributes((list) => [...list, attr]);

    return null;
  };

  const header = (
    <View className="flex-row items-center gap-2.5 px-4 pt-2 pb-3">
      <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
      <View className="flex-1 min-w-0">
        <Text className="type-heading text-ink" accessibilityRole="header">{t('adminShopNew.title')}</Text>
        <Text className="font-onest text-[13px] text-muted">{t('adminShopNew.subtitle')}</Text>
      </View>
    </View>
  );

  if (!admin) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-bg">
        {header}
        <EmptyState icon={ShieldX} message={t('adminShops.noAccess')} />
      </SafeAreaView>
    );
  }

  const ownerLabel = fullName.trim() || '…';
  const summary = isFilled
    ? t('adminShopNew.summary', {
        name: name.trim(),
        warehouse: warehouseName.trim(),
        owner: ownerLabel,
        category: category?.name ?? '—',
      })
    : t('adminShopNew.summaryEmpty');

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      {header}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24, gap: 12 }}
        >
          {/* Store */}
          <Section title={t('adminShopNew.shopSection')}>
            <Field label={t('adminShopNew.name')} error={errors.name}>
              <Input size="lg" invalid={!!errors.name}>
                <InputField
                  value={name}
                  onChangeText={setName}
                  placeholder={t('adminShopNew.namePlaceholder')}
                  maxLength={120}
                  accessibilityLabel={t('adminShopNew.name')}
                />
              </Input>
            </Field>
            <View className="gap-1.5">
              <Text className="font-onest-semibold text-[13px] text-soft">{t('adminShopNew.category')}</Text>
              {categories.isError ? (
                <Pressable onPress={() => void categories.refetch()} accessibilityRole="button">
                  <Text className="font-onest text-[13px] text-err-fg">{t('adminShopNew.categoriesFailed')}</Text>
                </Pressable>
              ) : (
                <View className="flex-row flex-wrap gap-2" accessibilityRole="radiogroup">
                  {(categories.data ?? []).map((c) => (
                    <Chip
                      key={c.id}
                      label={c.name}
                      tone="sunken"
                      selected={categoryId === c.id}
                      onPress={() => setCategoryId(c.id)}
                      accessibilityRole="radio"
                    />
                  ))}
                </View>
              )}
            </View>
            <Field label={t('adminShopNew.address')} optional={t('adminShopNew.optional')}>
              <Input size="lg">
                <InputField
                  value={address}
                  onChangeText={setAddress}
                  placeholder={t('adminShopNew.addressPlaceholder')}
                  maxLength={250}
                  accessibilityLabel={t('adminShopNew.address')}
                />
              </Input>
            </Field>
            <Field label={t('adminShopNew.inn')} optional={t('adminShopNew.optional')} error={errors.inn}>
              <Input size="lg" invalid={!!errors.inn}>
                <InputField
                  value={inn}
                  onChangeText={(v) => setInn(v.replace(/[^\d ]/g, ''))}
                  placeholder={t('adminShopNew.innPlaceholder')}
                  keyboardType="number-pad"
                  maxLength={11}
                  accessibilityLabel={t('adminShopNew.inn')}
                />
              </Input>
            </Field>
            <Field label={t('adminShopNew.note')} optional={t('adminShopNew.optional')}>
              <Input size="lg">
                <InputField
                  value={note}
                  onChangeText={setNote}
                  placeholder={t('adminShopNew.notePlaceholder')}
                  maxLength={500}
                  accessibilityLabel={t('adminShopNew.note')}
                />
              </Input>
            </Field>
            <Field label={t('adminShopNew.warehouse')} error={errors.warehouseName} hint={t('adminShopNew.warehouseHint')}>
              <Input size="lg" invalid={!!errors.warehouseName}>
                <InputField
                  value={warehouseName}
                  onChangeText={setWarehouseName}
                  maxLength={120}
                  accessibilityLabel={t('adminShopNew.warehouse')}
                />
              </Input>
            </Field>
          </Section>

          {/* Owner — always new: one owner, one store */}
          <Section title={t('adminShopNew.ownerSection')}>
            <Field label={t('adminShopNew.fullName')} error={errors.fullName}>
              <Input size="lg" invalid={!!errors.fullName}>
                <InputField
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder={t('adminShopNew.fullNamePlaceholder')}
                  autoComplete="name"
                  maxLength={120}
                  accessibilityLabel={t('adminShopNew.fullName')}
                />
              </Input>
            </Field>
            <Field label={t('adminShopNew.phone')} error={errors.phone}>
              <Input size="lg" invalid={!!errors.phone || !!serverError}>
                <Text className="font-onest-semibold text-[15px] text-ink">{PHONE_PREFIX}</Text>
                <InputField
                  value={formatNationalPhone(phone)}
                  onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, PHONE_DIGITS))}
                  placeholder="90 123 45 67"
                  keyboardType="phone-pad"
                  accessibilityLabel={t('adminShopNew.phone')}
                />
              </Input>
            </Field>
            <Field label={t('adminShopNew.login')} error={errors.login}>
              <Input size="lg" invalid={!!errors.login || !!serverError}>
                <InputField
                  value={login}
                  onChangeText={setLogin}
                  placeholder={t('adminShopNew.loginPlaceholder')}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={40}
                  accessibilityLabel={t('adminShopNew.login')}
                />
              </Input>
            </Field>
            <Field
              label={t('adminShopNew.password')}
              error={errors.password}
              hint={password ? t('adminShopNew.passwordHint') : undefined}
            >
              <Input size="lg" invalid={!!errors.password} className="pr-1.5">
                <InputField
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('adminShopNew.passwordPlaceholder')}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  accessibilityLabel={t('adminShopNew.password')}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  className="w-10 h-10 rounded-full items-center justify-center"
                  accessibilityLabel={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.muted} strokeWidth={2} />
                  ) : (
                    <Eye size={20} color={colors.muted} strokeWidth={2} />
                  )}
                </Pressable>
              </Input>
            </Field>
            <View className="flex-row items-center gap-2.5 bg-sunken rounded-2xl px-3.5 py-3">
              <Info size={16} color={colors.soft} strokeWidth={2} />
              <Text className="flex-1 font-onest text-[13px] leading-[18px] text-soft">{t('adminShopNew.ownerHint')}</Text>
            </View>
          </Section>

          {/* Catalog */}
          <Section title={t('adminShopNew.catalogSection')}>
            <View className="gap-2">
              <Text className="font-onest-semibold text-[13px] text-soft">{t('adminShop.catalog.brands')}</Text>
              <View className="flex-row flex-wrap gap-2">
                {brandNames.map((b) => (
                  <Pressable
                    key={b}
                    onPress={() => setBrandNames((list) => list.filter((x) => x !== b))}
                    accessibilityRole="button"
                    accessibilityLabel={t('adminShopNew.remove', { name: b })}
                    className="h-9 pl-3.5 pr-2.5 rounded-pill bg-primary flex-row items-center gap-1.5"
                  >
                    <Text className="font-onest-semibold text-[13px] text-on-primary">{b}</Text>
                    <X size={14} color={colors.onPrimary} strokeWidth={2.2} />
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => setSheet('brand')}
                  accessibilityRole="button"
                  className="h-9 px-3.5 rounded-pill border-[1.5px] border-dashed border-line flex-row items-center gap-1"
                >
                  <Plus size={14} color={colors.ink} strokeWidth={2.2} />
                  <Text className="font-onest-semibold text-[13px] text-ink">{t('adminShopNew.addBrand')}</Text>
                </Pressable>
              </View>
            </View>
            <View className="gap-2">
              <Text className="font-onest-semibold text-[13px] text-soft">{t('adminShop.catalog.attributes')}</Text>
              <View className="flex-row flex-wrap gap-2">
                {(attributesCatalog.data ?? []).map((a) => {
                  const on = attributeIds.includes(a.id);
                  return (
                    <Chip
                      key={a.id}
                      label={a.unit ? `${a.name} (${a.unit})` : a.name}
                      tone="sunken"
                      selected={on}
                      onPress={() => setAttributeIds((ids) => (on ? ids.filter((x) => x !== a.id) : [...ids, a.id]))}
                    />
                  );
                })}
                {newAttributes.map((a) => (
                  <Pressable
                    key={a.name}
                    onPress={() => setNewAttributes((list) => list.filter((x) => x.name !== a.name))}
                    accessibilityRole="button"
                    accessibilityLabel={t('adminShopNew.remove', { name: a.name })}
                    className="h-9 pl-3.5 pr-2.5 rounded-pill bg-primary flex-row items-center gap-1.5"
                  >
                    <Text className="font-onest-semibold text-[13px] text-on-primary">
                      {a.unit ? `${a.name} (${a.unit})` : a.name}
                    </Text>
                    <X size={14} color={colors.onPrimary} strokeWidth={2.2} />
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => setSheet('attr')}
                  accessibilityRole="button"
                  className="h-9 px-3.5 rounded-pill border-[1.5px] border-dashed border-line flex-row items-center gap-1"
                >
                  <Plus size={14} color={colors.ink} strokeWidth={2.2} />
                  <Text className="font-onest-semibold text-[13px] text-ink">{t('adminShopNew.addAttribute')}</Text>
                </Pressable>
              </View>
            </View>
          </Section>

          {/* Modes */}
          <Section title={t('adminShopNew.modesSection')}>
            {MODES.map((mode, i) => (
              <View key={mode} className={cn('flex-row items-center gap-3', i > 0 && 'pt-3 border-t border-line')}>
                <View className="flex-1 gap-0.5">
                  <Text className="font-onest-semibold text-[15px] text-ink">{t(`adminShop.modes.${mode}`)}</Text>
                  <Text className="font-onest text-xs text-muted">{t(`adminShop.modes.${mode}Desc`)}</Text>
                </View>
                <Switch
                  value={modes[mode]}
                  onValueChange={(v) => toggleMode(mode, v)}
                  accessibilityLabel={t(`adminShop.modes.${mode}`)}
                />
              </View>
            ))}
            <Text className="font-onest text-xs text-muted">{t('adminShopNew.modesHint')}</Text>
          </Section>

          {/* Trial */}
          <View className="flex-row items-center gap-3 bg-info-bg rounded-[24px] px-3.5 py-3.5">
            <View className="w-10 h-10 rounded-full bg-card items-center justify-center">
              <Gift size={18} color={colors.infoFg} strokeWidth={2} />
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="font-onest-bold text-sm text-info-fg">{t('adminShopNew.trialTitle')}</Text>
              <Text className="font-onest text-xs text-info-fg">{t('adminShopNew.trialText')}</Text>
            </View>
            <View className="px-2.5 py-1 rounded-pill bg-card">
              <Text className="font-onest-bold text-[11px] text-info-fg">{t('adminShops.status.TRIAL')}</Text>
            </View>
          </View>

          <Text className="font-onest text-[13px] leading-[18px] text-muted text-center px-2">{summary}</Text>

          <View className="gap-2.5">
            {serverError ? (
              <View className="flex-row items-start gap-2 bg-err-bg rounded-lg px-4 py-3" accessibilityRole="alert">
                <CircleAlert size={16} color={colors.errFg} strokeWidth={2} />
                <Text className="flex-1 font-onest-semibold text-[13px] leading-[18px] text-err-fg">{serverError}</Text>
              </View>
            ) : null}
            {!isFilled ? (
              <Text className="font-onest text-xs text-muted text-center">{t('adminShopNew.fillHint')}</Text>
            ) : null}
            <Button
              variant="accent"
              size="lg"
              full
              disabled={!isFilled}
              loading={create.isPending}
              onPress={submit}
            >
              {create.isPending ? t('adminShopNew.creating') : t('adminShopNew.submit')}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BrandSheet
        isOpen={sheet === 'brand'}
        onClose={() => setSheet('none')}
        brands={brandsCatalog.data ?? []}
        selected={brandNames}
        onAdd={(b) => setBrandNames((list) => (list.some((x) => x.toLowerCase() === b.toLowerCase()) ? list : [...list, b]))}
      />
      <AttributeSheet isOpen={sheet === 'attr'} onClose={() => setSheet('none')} onAdd={addAttribute} />
    </SafeAreaView>
  );
}
