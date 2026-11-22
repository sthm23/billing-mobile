import { Button, IconButton, Pressable, Text, toast } from '@/components/base';
import { Sheet, SheetTextInput } from '@/components/base/Sheet';
import { EmptyState, LoadingState } from '@/components/common';
import { BarcodeScanModal } from '@/components/product/BarcodeScanModal';
import { ProductImage } from '@/components/product/ProductImage';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/libs/api-error';
import { productCategoryLabel } from '@/libs/category';
import { formatMoney } from '@/libs/format';
import { canAddCategory, canManageProducts } from '@/libs/roles';
import { cn } from '@/libs/utils';
import { AttributeType, type Attribute } from '@/models/product.model';
import { useAuth } from '@/provider/AuthProvider';
import { useAttributeValues, useCreateAttributeValue } from '@/services/category';
import { useCreateProductVariants, useProductById } from '@/services/product/product.queries';
import { router, useLocalSearchParams } from 'expo-router';
import { Barcode, ChevronLeft, CircleAlert, Lock, PackageX, Plus, ScanBarcode, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { attributeLabel, attributeTitle, unitLabel } from '@/libs/attribute';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  buildCombos,
  checkRow,
  comboKey,
  EMPTY_ROW,
  markupPercent,
  type Combo,
  type ComboValue,
  type VariantRow,
} from './variant-builder';

const MAX_MONEY_DIGITS = 13;
const MAX_QTY_DIGITS = 6;
const MAX_BARCODE_DIGITS = 14;
const VALUE_MAX = 50;

const digits = (text: string, max: number) => text.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, max);

/** «6 м» / «6 m» for a NUMBER value with a unit */
function valueLabel(value: string | number | boolean, attribute: Attribute | undefined, language: string): string {
  const text = String(value);
  return attribute?.type === AttributeType.NUMBER && attribute.unit
    ? `${text} ${unitLabel(attribute.unit, language)}`
    : text;
}

function NumberCell({
  label,
  value,
  onChange,
  money,
  invalid,
  maxDigits,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  money?: boolean;
  invalid?: boolean;
  maxDigits: number;
}) {
  const colors = useTheme();

  return (
    <View className={cn('flex-1 min-w-0 rounded-[14px] bg-sunken px-3 py-2 gap-0.5 border-2', invalid ? 'border-err-fg' : 'border-transparent')}>
      <Text className={cn('font-onest text-[11px]', invalid ? 'text-err-fg' : 'text-muted')} numberOfLines={1}>{label}</Text>
      <TextInput
        value={money && value ? formatMoney(value) : value}
        onChangeText={(text) => onChange(digits(text, maxDigits))}
        keyboardType="number-pad"
        placeholder={money ? '—' : '0'}
        placeholderTextColor={colors.muted}
        accessibilityLabel={label}
        className="font-onest-semibold text-[15px] text-ink tabular-nums p-0"
      />
    </View>
  );
}

type ValueSheet = { attribute: Attribute } | null;

/**
 * «Новый товар · шаг 2 из 2 · Варианты» (design «ProductVariants»): pick the
 * values of the product's attributes, the variants are all their combinations;
 * fill qty / cost / sale price (once for all or per variant) and an optional
 * own barcode (typed or scanned). Empty variants are skipped, half-filled ones
 * block saving (decision 9). Also adds variants to an existing product and
 * finishes a draft. Owner / manager / admin (the backend checks it).
 */
export function ProductVariantsScreen() {
  const { t, i18n } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const productQuery = useProductById(id ?? '');
  const product = productQuery.data;
  const attributes = useMemo(() => product?.attributes ?? [], [product]);
  const attributeIds = useMemo(() => attributes.map((a) => a.id), [attributes]);
  const valuesQuery = useAttributeValues(attributeIds, !!product);
  const createValue = useCreateAttributeValue();
  const save = useCreateProductVariants();

  const [chosen, setChosen] = useState<Record<string, ComboValue[]>>({});
  const [rows, setRows] = useState<Record<string, VariantRow>>({});
  const [removed, setRemoved] = useState<string[]>([]);
  const [bulk, setBulk] = useState<VariantRow>(EMPTY_ROW);
  const [valueSheet, setValueSheet] = useState<ValueSheet>(null);
  const [newValue, setNewValue] = useState('');
  const [valueError, setValueError] = useState<string | null>(null);
  const [scanFor, setScanFor] = useState<Combo | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [takenBarcode, setTakenBarcode] = useState<string | null>(null);

  const attributeById = useMemo(() => new Map(attributes.map((a) => [a.id, a])), [attributes]);
  const existingKeys = useMemo(
    () => new Set((product?.variants ?? []).map((v) => comboKey(v.attributes.map((a) => a.id)))),
    [product],
  );

  const combos = useMemo(() => buildCombos(attributeIds, chosen), [attributeIds, chosen]);
  const fresh = useMemo(() => combos.filter((c) => !existingKeys.has(c.key)), [combos, existingKeys]);
  const visible = useMemo(() => fresh.filter((c) => !removed.includes(c.key)), [fresh, removed]);
  const checks = useMemo(
    () => new Map(visible.map((c) => [c.key, checkRow(rows[c.key] ?? EMPTY_ROW)])),
    [visible, rows],
  );
  const complete = visible.filter((c) => checks.get(c.key)?.state === 'complete');
  const partial = visible.filter((c) => checks.get(c.key)?.state === 'partial');

  // A barcode typed again after a 409 clears the mark
  useEffect(() => {
    if (takenBarcode && !visible.some((c) => rows[c.key]?.barCode === takenBarcode)) setTakenBarcode(null);
  }, [rows, visible, takenBarcode]);

  const isDraft = (product?.variants.length ?? 0) === 0;
  const header = (
    <View className="px-4 pt-2 pb-3 gap-3">
      <View className="flex-row items-center gap-2.5">
        <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
        <View className="flex-1 min-w-0">
          <Text className="type-heading text-ink" accessibilityRole="header">
            {isDraft ? t('productVariants.title') : t('productVariants.addTitle')}
          </Text>
          <Text className="font-onest text-[13px] text-muted">
            {isDraft ? t('productVariants.step2') : t('productVariants.addSubtitle')}
          </Text>
        </View>
      </View>
      {isDraft ? (
        <View className="flex-row gap-1.5">
          <View className="flex-1 h-1 rounded-sm bg-accent" />
          <View className="flex-1 h-1 rounded-sm bg-accent" />
        </View>
      ) : null}
    </View>
  );

  if (!canManageProducts(user)) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <EmptyState icon={Lock} message={t('productVariants.noAccess')} />
      </View>
    );
  }
  if (productQuery.isLoading) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <LoadingState />
      </View>
    );
  }
  if (!product) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <Pressable onPress={() => void productQuery.refetch()} accessibilityRole="button">
          <EmptyState icon={PackageX} message={t('productVariants.loadFailed')} />
        </Pressable>
      </View>
    );
  }

  const values = valuesQuery.data ?? [];
  const canAddValue = canAddCategory(user);
  const noAttributesAndExists = attributes.length === 0 && product.variants.length > 0;

  const toggleValue = (attribute: Attribute, v: ComboValue) => {
    setChosen((prev) => {
      const list = prev[attribute.id] ?? [];
      const on = list.some((x) => x.valueId === v.valueId);
      return { ...prev, [attribute.id]: on ? list.filter((x) => x.valueId !== v.valueId) : [...list, v] };
    });
  };

  const setRow = (key: string, change: Partial<VariantRow>) =>
    setRows((prev) => ({ ...prev, [key]: { ...(prev[key] ?? EMPTY_ROW), ...change } }));

  const applyBulk = () => {
    setRows((prev) => {
      const next = { ...prev };
      for (const c of visible) {
        const row = next[c.key] ?? EMPTY_ROW;
        next[c.key] = {
          ...row,
          ...(bulk.qty ? { qty: bulk.qty } : {}),
          ...(bulk.cost ? { cost: bulk.cost } : {}),
          ...(bulk.price ? { price: bulk.price } : {}),
        };
      }
      return next;
    });
    toast.show(t('productVariants.applied', { count: visible.length }));
  };

  const openValueSheet = (attribute: Attribute) => {
    setNewValue('');
    setValueError(null);
    setValueSheet({ attribute });
  };

  const addValue = () => {
    if (!valueSheet) return;
    const attribute = valueSheet.attribute;
    const value = newValue.trim().replace(/\s+/g, ' ');
    if (!value) return;
    setValueError(null);
    createValue.mutate(
      { attributeId: attribute.id, value },
      {
        onSuccess: (res) => {
          const v = { attributeId: attribute.id, valueId: res.id, label: valueLabel(res.value, attribute, i18n.language) };
          setChosen((prev) => {
            const list = prev[attribute.id] ?? [];
            return list.some((x) => x.valueId === v.valueId) ? prev : { ...prev, [attribute.id]: [...list, v] };
          });
          setValueSheet(null);
        },
        onError: (err) => setValueError(getApiErrorMessage(err, t('productVariants.valueSheet.failed'))),
      },
    );
  };

  const submit = () => {
    setSubmitted(true);
    setServerError(null);
    if (!complete.length || partial.length) return;
    save.mutate(
      {
        storeId: user?.staff?.storeId ?? '',
        warehouseId: product.warehouseId,
        productId: product.id,
        variants: complete.map((c) => {
          const row = rows[c.key] ?? EMPTY_ROW;
          return {
            retailPrice: Number(row.price),
            costPrice: Number(row.cost),
            quantity: Number(row.qty || 0),
            ...(row.barCode ? { barCode: row.barCode } : {}),
            attributes: c.values.map((v) => ({ attributeValueId: v.valueId, value: v.label })),
          };
        }),
      },
      {
        onSuccess: () => {
          toast.show(t('productVariants.saved', { count: complete.length }));
          router.replace({ pathname: '/(tabs)/(products)/[id]', params: { id: product.id } });
        },
        onError: (err) => {
          const message = getApiErrorMessage(err, t('productVariants.saveFailed'));
          // 409 «Barcode 4780… is already used in this store» → mark that variant
          if (err.response?.status === 409) {
            const code = message.match(/\d{8,14}/)?.[0] ?? null;
            setTakenBarcode(code);
            setServerError(code ? t('productVariants.barcodeTaken', { code }) : message);
            return;
          }
          setServerError(message);
        },
      },
    );
  };

  const variantName = (c: Combo) => (c.values.length ? c.values.map((v) => v.label).join(' · ') : product.name);
  const formula = attributes
    .map((a) => `${attributeLabel(a, i18n.language)} ${chosen[a.id]?.length ?? 0}`)
    .join(' × ');
  const subtitle = [productCategoryLabel(product, i18n.language), product.warehouse?.name].filter(Boolean).join(' · ');
  const saveLabel = save.isPending
    ? t('productVariants.saving')
    : complete.length
      ? t('productVariants.save', { count: complete.length })
      : t('productVariants.saveEmpty');

  return (
    <View className="flex-1 bg-bg">
      {header}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}>
          {/* Product */}
          <View className="flex-row items-center gap-3 bg-card rounded-[20px] py-2.5 pl-2.5 pr-3.5">
            <ProductImage images={product.images} productName={product.name} size="md" />
            <View className="flex-1 min-w-0 gap-0.5">
              <Text className="font-onest-bold text-base text-ink" numberOfLines={1}>{product.name}</Text>
              <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>{subtitle}</Text>
            </View>
            <Button
              variant="secondary"
              size="sm"
              className="bg-sunken"
              onPress={() => router.push({ pathname: '/(tabs)/(products)/edit/[id]', params: { id: product.id } })}
            >
              {t('productVariants.editCard')}
            </Button>
          </View>

          {noAttributesAndExists ? (
            <EmptyState icon={PackageX} message={t('productVariants.singleVariantExists')} />
          ) : (
            <>
              {/* Attribute values */}
              {attributes.length ? (
                <View className="bg-card rounded-xl px-3.5 py-4 gap-3.5">
                  <View className="gap-0.5 px-0.5">
                    <Text className="font-onest-bold text-[15px] text-ink">{t('productVariants.values')}</Text>
                    <Text className="font-onest text-xs text-muted">{t('productVariants.valuesHint')}</Text>
                  </View>
                  {attributes.map((a) => {
                    const list = values.filter((v) => v.attributeId === a.id);
                    const picked = chosen[a.id] ?? [];
                    return (
                      <View key={a.id} className="gap-2">
                        <Text className="font-onest-semibold text-[13px] text-soft">
                          {attributeTitle(a, i18n.language)}
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                          {list.map((v) => {
                            const cv = { attributeId: a.id, valueId: v.id, label: valueLabel(v.value, a, i18n.language) };
                            const on = picked.some((x) => x.valueId === v.id);
                            return (
                              <Pressable
                                key={v.id}
                                onPress={() => toggleValue(a, cv)}
                                accessibilityRole="button"
                                accessibilityState={{ selected: on }}
                                className={cn('min-w-[52px] h-10 px-3.5 rounded-pill items-center justify-center', on ? 'bg-primary' : 'bg-sunken')}
                              >
                                <Text className={cn('font-onest-semibold text-sm', on ? 'text-on-primary' : 'text-ink')}>{cv.label}</Text>
                              </Pressable>
                            );
                          })}
                          {canAddValue ? (
                            <Pressable
                              onPress={() => openValueSheet(a)}
                              accessibilityRole="button"
                              accessibilityLabel={t('productVariants.addValue', { name: attributeLabel(a, i18n.language) })}
                              className="w-10 h-10 rounded-full border-[1.5px] border-dashed border-line items-center justify-center"
                            >
                              <Plus size={16} color={colors.ink} strokeWidth={2.5} />
                            </Pressable>
                          ) : null}
                        </View>
                        {!list.length && !valuesQuery.isLoading ? (
                          <Text className="font-onest text-xs text-muted">
                            {canAddValue ? t('productVariants.noValuesOwner') : t('productVariants.noValues')}
                          </Text>
                        ) : null}
                      </View>
                    );
                  })}
                  <View className="flex-row items-center gap-2 px-3 py-2.5 rounded-[14px] bg-sunken">
                    <Text className="flex-1 font-onest text-[13px] text-soft">
                      <Text className="font-onest-bold text-[13px] text-ink">
                        {t('productVariants.count', { count: fresh.length })}
                      </Text>
                      {' = '}
                      {formula}
                    </Text>
                  </View>
                  {combos.length > fresh.length ? (
                    <Text className="font-onest text-xs text-muted px-0.5">
                      {t('productVariants.alreadyExist', { count: combos.length - fresh.length })}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              {visible.length > 1 ? (
                <View className="bg-card rounded-xl px-3.5 py-4 gap-3">
                  <View className="gap-0.5 px-0.5">
                    <Text className="font-onest-bold text-[15px] text-ink">{t('productVariants.bulk')}</Text>
                    <Text className="font-onest text-xs text-muted">{t('productVariants.bulkHint')}</Text>
                  </View>
                  <View className="flex-row gap-2">
                    <NumberCell label={t('productVariants.qty')} value={bulk.qty} onChange={(qty) => setBulk((b) => ({ ...b, qty }))} maxDigits={MAX_QTY_DIGITS} />
                    <NumberCell label={t('productVariants.cost')} value={bulk.cost} onChange={(cost) => setBulk((b) => ({ ...b, cost }))} money maxDigits={MAX_MONEY_DIGITS} />
                    <NumberCell label={t('productVariants.price')} value={bulk.price} onChange={(price) => setBulk((b) => ({ ...b, price }))} money maxDigits={MAX_MONEY_DIGITS} />
                  </View>
                  <Button variant="primary" full disabled={!bulk.qty && !bulk.cost && !bulk.price} onPress={applyBulk}>
                    {t('productVariants.apply', { count: visible.length })}
                  </Button>
                </View>
              ) : null}

              {visible.length ? (
                <View className="flex-row items-baseline justify-between px-1 pt-1.5">
                  <Text className="font-onest-bold text-[17px] text-ink">{t('productVariants.list', { count: visible.length })}</Text>
                  <Text className="font-onest text-xs text-muted">
                    {complete.length === visible.length
                      ? t('productVariants.allFilled')
                      : t('productVariants.filled', { done: complete.length, total: visible.length })}
                  </Text>
                </View>
              ) : (
                <View className="bg-card rounded-[22px] px-4 py-6">
                  <Text className="font-onest text-sm text-muted text-center">
                    {fresh.length ? t('productVariants.allRemoved') : t('productVariants.pickValues')}
                  </Text>
                </View>
              )}

              {visible.map((c) => {
                const row = rows[c.key] ?? EMPTY_ROW;
                const check = checks.get(c.key)!;
                const showErrors = submitted && check.state === 'partial';
                const markup = markupPercent(row);
                const taken = !!takenBarcode && row.barCode === takenBarcode;
                return (
                  <View key={c.key} className="bg-card rounded-[22px] p-3.5 gap-3">
                    <View className="flex-row items-center gap-2.5">
                      <Text className="flex-1 font-onest-bold text-[15px] text-ink" numberOfLines={1}>{variantName(c)}</Text>
                      <View className={cn('px-2 py-[3px] rounded-pill', check.state === 'empty' ? 'bg-sunken' : markup !== null ? 'bg-ok-bg' : 'bg-sunken')}>
                        <Text className={cn('font-onest-semibold text-xs', markup !== null ? 'text-ok-fg' : 'text-muted')}>
                          {check.state === 'empty'
                            ? t('productVariants.notInStock')
                            : markup !== null
                              ? t('productVariants.markup', { percent: markup })
                              : t('productVariants.noPrice')}
                        </Text>
                      </View>
                      {visible.length > 1 || fresh.length > 1 ? (
                        <IconButton
                          icon={X}
                          size="sm"
                          variant="sunken"
                          accessibilityLabel={t('productVariants.remove')}
                          onPress={() => setRemoved((r) => [...r, c.key])}
                        />
                      ) : null}
                    </View>
                    <View className="flex-row gap-2">
                      <NumberCell label={t('productVariants.qty')} value={row.qty} onChange={(qty) => setRow(c.key, { qty })} maxDigits={MAX_QTY_DIGITS} />
                      <NumberCell label={t('productVariants.cost')} value={row.cost} onChange={(cost) => setRow(c.key, { cost })} money invalid={showErrors && check.missingCost} maxDigits={MAX_MONEY_DIGITS} />
                      <NumberCell label={t('productVariants.price')} value={row.price} onChange={(price) => setRow(c.key, { price })} money invalid={showErrors && check.missingPrice} maxDigits={MAX_MONEY_DIGITS} />
                    </View>
                    <View className="flex-row gap-2">
                      <View
                        className={cn(
                          'flex-1 h-11 rounded-[14px] bg-sunken px-3 flex-row items-center gap-2 border-2',
                          (showErrors && check.badBarcode) || taken ? 'border-err-fg' : 'border-transparent',
                        )}
                      >
                        <Barcode size={18} color={colors.muted} strokeWidth={2} />
                        <TextInput
                          value={row.barCode}
                          onChangeText={(text) => setRow(c.key, { barCode: text.replace(/\D/g, '').slice(0, MAX_BARCODE_DIGITS) })}
                          keyboardType="number-pad"
                          placeholder={t('productVariants.barcodePlaceholder')}
                          placeholderTextColor={colors.muted}
                          accessibilityLabel={t('productVariants.barcode')}
                          className="flex-1 min-w-0 font-onest-medium text-sm text-ink tabular-nums p-0"
                        />
                      </View>
                      <IconButton icon={ScanBarcode} variant="accent" accessibilityLabel={t('productVariants.scanA11y')} onPress={() => setScanFor(c)} />
                    </View>
                    {showErrors ? (
                      <Text className="font-onest-semibold text-xs text-err-fg px-0.5">
                        {check.badBarcode && !check.missingCost && !check.missingPrice
                          ? t('productVariants.barcodeInvalid')
                          : t('productVariants.partial')}
                      </Text>
                    ) : null}
                  </View>
                );
              })}

              {removed.length && fresh.some((c) => removed.includes(c.key)) ? (
                <Pressable onPress={() => setRemoved([])} accessibilityRole="button" className="items-center py-2">
                  <Text className="font-onest-semibold text-[13px] text-ink underline">
                    {t('productVariants.restore', { count: fresh.filter((c) => removed.includes(c.key)).length })}
                  </Text>
                </Pressable>
              ) : null}
            </>
          )}
        </ScrollView>

        <View className="px-4 pt-3 gap-2 bg-bg" style={{ paddingBottom: insets.bottom + 12 }}>
          {serverError ? (
            <View className="flex-row items-start gap-2 bg-err-bg rounded-lg px-4 py-3" accessibilityRole="alert">
              <CircleAlert size={16} color={colors.errFg} strokeWidth={2} />
              <Text className="flex-1 font-onest-semibold text-[13px] leading-[18px] text-err-fg">{serverError}</Text>
            </View>
          ) : null}
          {submitted && partial.length ? (
            <Text className="font-onest-semibold text-xs text-err-fg text-center">
              {t('productVariants.partialCount', { count: partial.length })}
            </Text>
          ) : (
            <Text className="font-onest text-xs text-muted text-center">{t('productVariants.saveHint')}</Text>
          )}
          <Button
            variant="accent"
            size="lg"
            full
            disabled={!complete.length || noAttributesAndExists}
            loading={save.isPending}
            onPress={submit}
          >
            {saveLabel}
          </Button>
          {isDraft ? (
            <Button variant="ghost" full onPress={() => router.replace('/(tabs)/(products)')}>
              {t('productVariants.later')}
            </Button>
          ) : null}
        </View>
      </KeyboardAvoidingView>

      <Sheet isOpen={!!valueSheet} onClose={() => setValueSheet(null)} size="auto">
        <View className="px-4 pt-2 gap-3" style={{ paddingBottom: insets.bottom + 16 }}>
          <Text className="type-title text-ink" accessibilityRole="header">
            {t('productVariants.valueSheet.title', { name: attributeLabel(valueSheet?.attribute, i18n.language) })}
          </Text>
          <Text className="font-onest text-[13px] text-muted">{t('productVariants.valueSheet.hint')}</Text>
          <View className="h-[52px] rounded-2xl bg-sunken px-4 justify-center">
            <SheetTextInput
              value={newValue}
              onChangeText={setNewValue}
              placeholder={
                valueSheet?.attribute.type === AttributeType.NUMBER
                  ? t('productVariants.valueSheet.numberPlaceholder')
                  : t('productVariants.valueSheet.placeholder')
              }
              keyboardType={valueSheet?.attribute.type === AttributeType.NUMBER ? 'decimal-pad' : 'default'}
              maxLength={VALUE_MAX}
              autoFocus
              placeholderTextColor={colors.muted}
              className="font-onest-medium text-base text-ink p-0"
            />
          </View>
          {valueError ? (
            <View className="bg-err-bg rounded-lg px-4 py-3" accessibilityRole="alert">
              <Text className="font-onest-semibold text-[13px] leading-[18px] text-err-fg">{valueError}</Text>
            </View>
          ) : null}
          <Button variant="accent" size="lg" full disabled={!newValue.trim()} loading={createValue.isPending} onPress={addValue}>
            {t('productVariants.valueSheet.add')}
          </Button>
        </View>
      </Sheet>

      <BarcodeScanModal
        isOpen={!!scanFor}
        subtitle={scanFor ? t('productVariants.scan.for', { name: variantName(scanFor) }) : undefined}
        onClose={() => setScanFor(null)}
        onScanned={(code) => scanFor && setRow(scanFor.key, { barCode: code })}
      />
    </View>
  );
}
