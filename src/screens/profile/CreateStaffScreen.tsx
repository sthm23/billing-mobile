import {
  Button,
  Chip,
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
  IconButton,
  Input,
  InputField,
  Pressable,
  Text,
} from '@/components/base';
import type { ButtonIconComponent } from '@/components/base';
import { EmptyState, LoadingState } from '@/components/common';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/libs/utils';
import { StaffRole, UserRole } from '@/models/user.model';
import { useAuth } from '@/provider/AuthProvider';
import {
  ASSIGNABLE_STAFF_ROLES,
  type AssignableStaffRole,
  useCreateStaff,
  useStoreById,
} from '@/services/store';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { router } from 'expo-router';
import {
  Briefcase,
  ChevronLeft,
  CircleAlert,
  Eye,
  EyeOff,
  Lock,
  Phone,
  ShieldX,
  ShoppingBag,
  User,
  Wallet,
  Warehouse as WarehouseIcon,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import * as z from 'zod';

const PHONE_PREFIX = '+998';
const PHONE_DIGITS = 9;
const LOGIN_PATTERN = /^[A-Za-z0-9._-]+$/;

const ROLE_ICON: Record<AssignableStaffRole, ButtonIconComponent> = {
  [StaffRole.MANAGER]: Briefcase,
  [StaffRole.SELLER]: ShoppingBag,
  [StaffRole.CASHIER]: Wallet,
};

/** "901234567" → "90 123 45 67" (display only). */
function formatNationalPhone(digits: string): string {
  return [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)]
    .filter(Boolean)
    .join(' ');
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join('\n');
    if (typeof message === 'string' && message.trim()) return message;
  }

  return fallback;
}

/**
 * New employee form (OWNER only). The employee is created in the owner's own
 * store; the backend validates the store and warehouse again.
 */
export function CreateStaffScreen() {
  const { t } = useTranslation();
  const colors = useTheme();
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isOwner = user?.role === UserRole.OWNER;
  const storeId = user?.staff?.storeId;
  const { data: store, isLoading: isStoreLoading, isError: isStoreError } = useStoreById(isOwner ? storeId : undefined);
  const createStaff = useCreateStaff();
  const warehouses = useMemo(() => (store?.warehouse ?? []).filter((w) => w.isActive), [store]);

  const schema = useMemo(
    () =>
      z.object({
        role: z.enum(ASSIGNABLE_STAFF_ROLES),
        fullName: z.string().trim().min(2, t('staffCreate.fullNameRequired')),
        phone: z.string().length(PHONE_DIGITS, t('staffCreate.phoneInvalid')),
        login: z
          .string()
          .trim()
          .min(3, t('staffCreate.loginMin'))
          .regex(LOGIN_PATTERN, t('staffCreate.loginInvalid')),
        password: z.string().min(8, t('staffCreate.passwordMin')),
        warehouseId: z.string().min(1, t('staffCreate.warehouseRequired')),
      }),
    [t]
  );
  type FormValues = z.infer<typeof schema>;

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: StaffRole.SELLER,
      fullName: '',
      phone: '',
      login: '',
      password: '',
      warehouseId: '',
    },
  });

  // A store with a single warehouse needs no choice.
  useEffect(() => {
    if (warehouses.length === 1 && !getValues('warehouseId')) {
      setValue('warehouseId', warehouses[0].id);
    }
  }, [warehouses, getValues, setValue]);

  const onSubmit = (values: FormValues) => {
    if (!storeId) return;
    setSubmitError(null);

    createStaff.mutate(
      {
        fullName: values.fullName.trim(),
        phone: `${PHONE_PREFIX}${values.phone}`,
        login: values.login.trim(),
        password: values.password,
        role: values.role,
        storeId,
        warehouseId: values.warehouseId,
      },
      {
        onSuccess: () => {
          Alert.alert(
            t('staffCreate.successTitle'),
            t('staffCreate.successText', { name: values.fullName.trim(), login: values.login.trim() }),
            [{ text: 'OK', onPress: () => router.back() }]
          );
        },
        onError: (error) => setSubmitError(getApiErrorMessage(error, t('staffCreate.createFailed'))),
      }
    );
  };

  const header = (
    <View className="flex-row items-center gap-2 px-4 pt-2 pb-3">
      <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
      <View className="flex-1 min-w-0">
        <Text className="type-heading text-ink" accessibilityRole="header">{t('staffCreate.title')}</Text>
        {store?.name ? (
          <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>{store.name}</Text>
        ) : null}
      </View>
    </View>
  );

  if (!isOwner || !storeId) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <EmptyState icon={ShieldX} message={t('staffCreate.noAccess')} />
      </View>
    );
  }

  if (isStoreLoading) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <LoadingState />
      </View>
    );
  }

  if (isStoreError || !store) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <EmptyState icon={CircleAlert} message={t('staffCreate.storeError')} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {header}
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-10 gap-3"
        keyboardShouldPersistTaps="handled"
      >
        {/* Role */}
        <View className="bg-card rounded-2xl p-4 gap-3">
          <Text className="type-body-strong text-ink">{t('staffCreate.roleSection')}</Text>
          <Controller
            control={control}
            name="role"
            render={({ field: { value, onChange } }) => (
              <View className="flex-row gap-2" accessibilityRole="radiogroup">
                {ASSIGNABLE_STAFF_ROLES.map((role) => {
                  const selected = value === role;
                  const Icon = ROLE_ICON[role];

                  return (
                    <Pressable
                      key={role}
                      onPress={() => onChange(role)}
                      className={cn('flex-1 min-h-24 rounded-[18px] p-3 gap-1.5', selected ? 'bg-primary' : 'bg-sunken')}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                    >
                      <Icon size={22} color={selected ? colors.onPrimary : colors.ink} strokeWidth={2} />
                      <Text className={cn('font-onest-bold text-[15px]', selected ? 'text-on-primary' : 'text-ink')}>
                        {t(`user.staff.${role.toLowerCase()}`)}
                      </Text>
                      <Text className={cn('font-onest text-xs leading-4', selected ? 'text-on-primary opacity-70' : 'text-muted')}>
                        {t(`staffCreate.roleDesc${role}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          />
        </View>

        {/* Employee details */}
        <View className="bg-card rounded-2xl p-4 gap-3.5">
          <Text className="type-body-strong text-ink">{t('staffCreate.dataSection')}</Text>

          <FormControl isInvalid={!!errors.fullName}>
            <FormControlLabel>
              <FormControlLabelText>{t('staffCreate.fullName')}</FormControlLabelText>
            </FormControlLabel>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input size="lg" invalid={!!errors.fullName}>
                  <User size={20} color={colors.muted} strokeWidth={2} />
                  <InputField
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder={t('staffCreate.fullNamePlaceholder')}
                    autoComplete="name"
                    textContentType="name"
                    accessibilityLabel={t('staffCreate.fullName')}
                  />
                </Input>
              )}
            />
            {errors.fullName && (
              <FormControlError>
                <FormControlErrorText>{errors.fullName.message}</FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          <FormControl isInvalid={!!errors.phone}>
            <FormControlLabel>
              <FormControlLabelText>{t('staffCreate.phone')}</FormControlLabelText>
            </FormControlLabel>
            <Controller
              control={control}
              name="phone"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input size="lg" invalid={!!errors.phone}>
                  <Phone size={20} color={colors.muted} strokeWidth={2} />
                  <Text className="font-onest-semibold text-[15px] text-ink">{PHONE_PREFIX}</Text>
                  <InputField
                    value={formatNationalPhone(value)}
                    onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, PHONE_DIGITS))}
                    onBlur={onBlur}
                    placeholder={t('staffCreate.phonePlaceholder')}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    accessibilityLabel={t('staffCreate.phone')}
                  />
                </Input>
              )}
            />
            {errors.phone && (
              <FormControlError>
                <FormControlErrorText>{errors.phone.message}</FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          <FormControl isInvalid={!!errors.login}>
            <FormControlLabel>
              <FormControlLabelText>{t('staffCreate.login')}</FormControlLabelText>
            </FormControlLabel>
            <Controller
              control={control}
              name="login"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input size="lg" invalid={!!errors.login}>
                  <User size={20} color={colors.muted} strokeWidth={2} />
                  <InputField
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder={t('staffCreate.loginPlaceholder')}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="username-new"
                    textContentType="username"
                    accessibilityLabel={t('staffCreate.login')}
                  />
                </Input>
              )}
            />
            {errors.login && (
              <FormControlError>
                <FormControlErrorText>{errors.login.message}</FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          <FormControl isInvalid={!!errors.password}>
            <FormControlLabel>
              <FormControlLabelText>{t('staffCreate.password')}</FormControlLabelText>
            </FormControlLabel>
            <Controller
              control={control}
              name="password"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input size="lg" invalid={!!errors.password} className="pr-1.5">
                  <Lock size={20} color={colors.muted} strokeWidth={2} />
                  <InputField
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder={t('staffCreate.passwordPlaceholder')}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    textContentType="newPassword"
                    accessibilityLabel={t('staffCreate.password')}
                  />
                  <Pressable
                    onPress={() => setShowPassword((shown) => !shown)}
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
              )}
            />
            {errors.password && (
              <FormControlError>
                <FormControlErrorText>{errors.password.message}</FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          <FormControl isInvalid={!!errors.warehouseId}>
            <FormControlLabel>
              <FormControlLabelText>{t('staffCreate.warehouse')}</FormControlLabelText>
            </FormControlLabel>
            {warehouses.length === 0 ? (
              <View className="flex-row items-center gap-2 bg-sunken rounded-md px-4 py-3">
                <WarehouseIcon size={18} color={colors.muted} strokeWidth={2} />
                <Text className="font-onest text-sm text-muted">{t('staffCreate.noWarehouses')}</Text>
              </View>
            ) : (
              <Controller
                control={control}
                name="warehouseId"
                render={({ field: { value, onChange } }) => (
                  <View className="flex-row flex-wrap gap-2">
                    {warehouses.map((warehouse) => (
                      <Chip
                        key={warehouse.id}
                        label={warehouse.name}
                        tone="sunken"
                        size="lg"
                        selected={value === warehouse.id}
                        onPress={() => onChange(warehouse.id)}
                      />
                    ))}
                  </View>
                )}
              />
            )}
            {errors.warehouseId && (
              <FormControlError>
                <FormControlErrorText>{errors.warehouseId.message}</FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>
        </View>

        {submitError && (
          <View className="flex-row items-center gap-2.5 bg-err-bg rounded-md px-3.5 py-3" accessibilityRole="alert">
            <CircleAlert size={18} color={colors.errFg} strokeWidth={2} />
            <Text className="flex-1 font-onest-medium text-sm text-err-fg">{submitError}</Text>
          </View>
        )}

        <Button
          variant="accent"
          size="lg"
          full
          onPress={handleSubmit(onSubmit)}
          loading={createStaff.isPending}
          disabled={warehouses.length === 0}
        >
          {t('staffCreate.submit')}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
