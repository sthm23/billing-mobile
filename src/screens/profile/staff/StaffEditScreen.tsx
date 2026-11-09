import {
  Button,
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
  FormControlLabel,
  FormControlLabelText,
  IconButton,
  Input,
  InputField,
  Pressable,
  StatusBadge,
  Text,
  toast,
} from '@/components/base';
import { EmptyState, LoadingState } from '@/components/common';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/libs/api-error';
import { cn } from '@/libs/utils';
import { UserRole } from '@/models/user.model';
import { useAuth } from '@/provider/AuthProvider';
import {
  ASSIGNABLE_STAFF_ROLES,
  useStaff,
  useStoreById,
  useUpdateStaff,
  type AssignableStaffRole,
  type StaffDetails,
  type UpdateStaffPayload,
} from '@/services/store';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Check, ChevronLeft, CircleAlert, Info, ShieldX } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as z from 'zod';
import { StaffRolePicker } from './StaffRolePicker';
import {
  formatNationalPhone,
  formatPhone,
  PHONE_DIGITS,
  PHONE_PREFIX,
  roleLabel,
  STAFF_LOGIN_PATTERN,
} from './staff-format';

interface StaffEditScreenProps {
  id: string;
}

/**
 * «Изменить данные» (design «Изменить данные — роль, склады, телефон», OWNER
 * only): name, phone, login, role and warehouses of an employee. Sends only
 * what changed; the backend validates the store, warehouses and uniqueness.
 * No photo yet — the avatar shows initials.
 */
export function StaffEditScreen({ id }: StaffEditScreenProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isOwner = user?.role === UserRole.OWNER;
  const staffQuery = useStaff(isOwner ? id : undefined);
  const storeQuery = useStoreById(isOwner ? user?.staff?.storeId : undefined);
  const staff = staffQuery.data;

  const header = (
    <View className="flex-row items-center gap-2.5 px-4 pt-2 pb-3">
      <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
      <View className="flex-1 min-w-0">
        <Text className="type-heading text-ink" accessibilityRole="header">{t('staff.edit.title')}</Text>
        {staff ? (
          <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>{staff.fullName}</Text>
        ) : null}
      </View>
    </View>
  );

  if (!isOwner) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <EmptyState icon={ShieldX} message={t('staff.noAccess')} />
      </View>
    );
  }

  if (staffQuery.isLoading || storeQuery.isLoading) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <LoadingState />
      </View>
    );
  }

  if (!staff || !storeQuery.data) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <EmptyState icon={CircleAlert} message={t('staff.card.loadFailed')} />
      </View>
    );
  }

  if (staff.isOwner || !isAssignable(staff.role)) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <EmptyState icon={ShieldX} message={t('staff.card.ownerNote')} />
      </View>
    );
  }

  // Active store warehouses plus any the employee still has (even inactive).
  const warehouses = storeQuery.data.warehouse.filter(
    (w) => w.isActive || staff.warehouses.some((own) => own.id === w.id)
  );

  return (
    <View className="flex-1 bg-bg">
      {header}
      <StaffEditForm staff={staff} role={staff.role} warehouses={warehouses} />
    </View>
  );
}

function isAssignable(role: string): role is AssignableStaffRole {
  return (ASSIGNABLE_STAFF_ROLES as readonly string[]).includes(role);
}

/** «+998905551234» → «905551234» (the form keeps national digits). */
function nationalDigits(phone: string): string {
  return phone.startsWith(PHONE_PREFIX) ? phone.slice(PHONE_PREFIX.length) : phone.replace(/\D/g, '');
}

interface StaffEditFormProps {
  staff: StaffDetails;
  role: AssignableStaffRole;
  warehouses: { id: string; name: string }[];
}

function StaffEditForm({ staff, role, warehouses }: StaffEditFormProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const update = useUpdateStaff();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        fullName: z.string().trim().min(2, t('staffCreate.fullNameRequired')),
        phone: z.string().length(PHONE_DIGITS, t('staffCreate.phoneInvalid')),
        login: z
          .string()
          .trim()
          .min(3, t('staffCreate.loginMin'))
          .regex(STAFF_LOGIN_PATTERN, t('staffCreate.loginInvalid')),
        role: z.enum(ASSIGNABLE_STAFF_ROLES),
        warehouseIds: z.array(z.string()).min(1, t('staff.edit.warehouseRequired')),
      }),
    [t]
  );
  type FormValues = z.infer<typeof schema>;

  const initial: FormValues = useMemo(
    () => ({
      fullName: staff.fullName,
      phone: nationalDigits(staff.phone),
      login: staff.login ?? '',
      role,
      warehouseIds: staff.warehouses.map((w) => w.id),
    }),
    [staff, role]
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: initial });
  const values = useWatch({ control }) as FormValues;

  // What differs from the saved employee (drives the hints and the payload).
  const sameWarehouses =
    values.warehouseIds.length === initial.warehouseIds.length &&
    values.warehouseIds.every((wid) => initial.warehouseIds.includes(wid));
  const changed = {
    fullName: values.fullName.trim() !== initial.fullName,
    phone: values.phone !== initial.phone,
    login: values.login.trim() !== initial.login,
    role: values.role !== initial.role,
    warehouses: !sameWarehouses,
  };
  const changedFields = (Object.keys(changed) as (keyof typeof changed)[]).filter((key) => changed[key]);
  const dirty = changedFields.length > 0;

  const onSubmit = (form: FormValues) => {
    setSubmitError(null);
    const payload: UpdateStaffPayload = {};
    if (changed.fullName) payload.fullName = form.fullName.trim();
    if (changed.phone) payload.phone = `${PHONE_PREFIX}${form.phone}`;
    if (changed.login) payload.login = form.login.trim();
    if (changed.role) payload.role = form.role;
    if (changed.warehouses) payload.warehouseIds = form.warehouseIds;

    update.mutate(
      { id: staff.id, payload },
      {
        onSuccess: () => {
          toast.show(t('staff.edit.saved'));
          router.back();
        },
        onError: (error) => setSubmitError(getApiErrorMessage(error, t('staff.edit.failed'))),
      }
    );
  };

  const changedTag = <Text className="font-onest-semibold text-xs text-info-fg">{t('staff.edit.changed')}</Text>;

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-6 gap-3" keyboardShouldPersistTaps="handled">
        {/* Details */}
        <View className="bg-card rounded-2xl p-4 gap-3.5">
          <Text className="type-body-strong text-ink">{t('staff.edit.data')}</Text>

          <FormControl isInvalid={!!errors.fullName}>
            <FormControlLabel className="flex-row justify-between">
              <FormControlLabelText>{t('staffCreate.fullName')}</FormControlLabelText>
              {changed.fullName ? changedTag : null}
            </FormControlLabel>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input size="lg" invalid={!!errors.fullName} className={cn(changed.fullName && 'border-2 border-info-fg')}>
                  <InputField
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoComplete="name"
                    accessibilityLabel={t('staffCreate.fullName')}
                  />
                </Input>
              )}
            />
            {errors.fullName ? (
              <FormControlError>
                <FormControlErrorText>{errors.fullName.message}</FormControlErrorText>
              </FormControlError>
            ) : null}
          </FormControl>

          <FormControl isInvalid={!!errors.phone}>
            <FormControlLabel className="flex-row justify-between">
              <FormControlLabelText>{t('staffCreate.phone')}</FormControlLabelText>
              {changed.phone ? changedTag : null}
            </FormControlLabel>
            <Controller
              control={control}
              name="phone"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input size="lg" invalid={!!errors.phone} className={cn(changed.phone && 'border-2 border-info-fg')}>
                  <Text className="font-onest-semibold text-[15px] text-ink">{PHONE_PREFIX}</Text>
                  <InputField
                    value={formatNationalPhone(value)}
                    onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, PHONE_DIGITS))}
                    onBlur={onBlur}
                    placeholder={t('staffCreate.phonePlaceholder')}
                    keyboardType="phone-pad"
                    accessibilityLabel={t('staffCreate.phone')}
                  />
                </Input>
              )}
            />
            {errors.phone ? (
              <FormControlError>
                <FormControlErrorText>{errors.phone.message}</FormControlErrorText>
              </FormControlError>
            ) : changed.phone ? (
              <FormControlHelper>
                <FormControlHelperText>{t('staff.edit.wasPhone', { phone: formatPhone(staff.phone) })}</FormControlHelperText>
              </FormControlHelper>
            ) : null}
          </FormControl>

          <FormControl isInvalid={!!errors.login}>
            <FormControlLabel className="flex-row justify-between">
              <FormControlLabelText>{t('staffCreate.login')}</FormControlLabelText>
              {changed.login ? changedTag : null}
            </FormControlLabel>
            <Controller
              control={control}
              name="login"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input size="lg" invalid={!!errors.login} className={cn(changed.login && 'border-2 border-info-fg')}>
                  <InputField
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel={t('staffCreate.login')}
                  />
                </Input>
              )}
            />
            {errors.login ? (
              <FormControlError>
                <FormControlErrorText>{errors.login.message}</FormControlErrorText>
              </FormControlError>
            ) : (
              <FormControlHelper>
                <FormControlHelperText>{t('staff.edit.loginHint')}</FormControlHelperText>
              </FormControlHelper>
            )}
          </FormControl>
        </View>

        {/* Role */}
        <View className="bg-card rounded-2xl p-4 gap-3">
          <View className="flex-row items-baseline justify-between">
            <Text className="type-body-strong text-ink">{t('staffCreate.roleSection')}</Text>
            {changed.role ? (
              <Text className="font-onest-semibold text-xs text-info-fg">
                {t('staff.edit.wasRole', { role: roleLabel(initial.role, t) })}
              </Text>
            ) : null}
          </View>
          <Controller
            control={control}
            name="role"
            render={({ field: { value, onChange } }) => <StaffRolePicker value={value} onChange={onChange} />}
          />
        </View>

        {/* Warehouses */}
        <View className="bg-card rounded-2xl p-4 gap-2.5">
          <View className="flex-row items-baseline justify-between">
            <Text className="type-body-strong text-ink">{t('staff.edit.warehouses')}</Text>
            <Text className="font-onest text-xs text-muted">{t('staff.edit.severalAllowed')}</Text>
          </View>
          <Controller
            control={control}
            name="warehouseIds"
            render={({ field: { value, onChange } }) => (
              <View className="gap-2">
                {warehouses.map((warehouse) => {
                  const on = value.includes(warehouse.id);
                  const isNew = on && !initial.warehouseIds.includes(warehouse.id);

                  return (
                    <Pressable
                      key={warehouse.id}
                      onPress={() => onChange(on ? value.filter((wid) => wid !== warehouse.id) : [...value, warehouse.id])}
                      className={cn('min-h-14 rounded-2xl px-3.5 flex-row items-center gap-3', on ? 'bg-primary' : 'bg-sunken')}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                    >
                      <View
                        className={cn(
                          'w-6 h-6 rounded-lg items-center justify-center',
                          on ? 'bg-accent' : 'border-[1.5px] border-muted'
                        )}
                      >
                        {on ? <Check size={16} color={colors.onAccent} strokeWidth={3} /> : null}
                      </View>
                      <Text className={cn('flex-1 font-onest-semibold text-[15px]', on ? 'text-on-primary' : 'text-ink')}>
                        {warehouse.name}
                      </Text>
                      {isNew ? <StatusBadge label={t('staff.edit.newBadge')} tone="info" size="sm" /> : null}
                    </Pressable>
                  );
                })}
              </View>
            )}
          />
          {errors.warehouseIds ? (
            <Text className="font-onest text-[13px] text-err-fg">{errors.warehouseIds.message}</Text>
          ) : null}
        </View>

        {dirty ? (
          <View className="flex-row items-start gap-2.5 bg-info-bg rounded-2xl px-3.5 py-3">
            <Info size={18} color={colors.infoFg} strokeWidth={2} />
            <Text className="flex-1 font-onest text-[13px] leading-[18px] text-info-fg">
              <Text className="font-onest-bold text-[13px] text-info-fg">
                {t('staff.edit.changedList', {
                  list: changedFields.map((key) => t(`staff.edit.field.${key}`)).join(', '),
                })}
              </Text>
              {changed.role || changed.warehouses ? ` ${t('staff.edit.appliesNow')}` : ''}
            </Text>
          </View>
        ) : null}

        {submitError ? (
          <View className="flex-row items-center gap-2.5 bg-err-bg rounded-md px-3.5 py-3" accessibilityRole="alert">
            <CircleAlert size={18} color={colors.errFg} strokeWidth={2} />
            <Text className="flex-1 font-onest-medium text-sm text-err-fg">{submitError}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View className="px-4 pt-3 bg-bg" style={{ paddingBottom: insets.bottom + 12 }}>
        <Button
          variant="accent"
          size="lg"
          full
          disabled={!dirty}
          loading={update.isPending}
          onPress={handleSubmit(onSubmit)}
        >
          {dirty ? t('staff.edit.save') : t('staff.edit.noChanges')}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
