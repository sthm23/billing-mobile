import { Button, IconButton, Input, InputField, Pressable, Text, TextArea, toast } from '@/components/base';
import { Sheet } from '@/components/base/Sheet';
import { EmptyState, LoadingState } from '@/components/common';
import { BrandSheet } from '@/components/product/BrandSheet';
import { CategorySheet } from '@/components/product/CategorySheet';
import { useTheme } from '@/hooks/use-theme';
import { useWorkingWarehouse } from '@/hooks/use-working-warehouse';
import { getApiErrorMessage } from '@/libs/api-error';
import { categoryLabel } from '@/libs/category';
import { PRODUCT_IMAGE_MAX_COUNT, type PickSource } from '@/libs/product-image';
import { canCreateProduct, canManageProducts } from '@/libs/roles';
import { cn } from '@/libs/utils';
import type { Category } from '@/models/product.model';
import { useAuth } from '@/provider/AuthProvider';
import { useStoreAttributes, useTags, type StoreAttribute, type StoreBrand } from '@/services/category';
import { useCreateProduct, useProductById, useUpdateProduct } from '@/services/product/product.queries';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Images,
  Lock,
  PackageX,
  Plus,
  RotateCw,
  Warehouse,
  X,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { attributeTitle } from '@/libs/attribute';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProductPhotos, type FormPhoto } from './use-product-photos';

const NAME_MAX = 120;
const DESCRIPTION_MAX = 1000;

interface ToggleChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Attribute chips show ✓ / + */
  withIcon?: boolean;
  disabled?: boolean;
}

function ToggleChip({ label, selected, onPress, withIcon, disabled }: ToggleChipProps) {
  const colors = useTheme();
  const color = selected ? colors.onPrimary : colors.ink;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      className={cn(
        'flex-row items-center gap-1.5 rounded-pill',
        disabled && 'opacity-60',
        withIcon ? 'h-10 pl-2.5 pr-3.5' : 'h-9 px-3.5',
        selected ? 'bg-primary' : 'bg-sunken',
      )}
    >
      {withIcon ? (
        selected ? (
          <Check size={16} color={color} strokeWidth={3} />
        ) : (
          <Plus size={16} color={color} strokeWidth={2.5} />
        )
      ) : null}
      <Text className={cn(withIcon ? 'text-sm' : 'text-[13px]', 'font-onest-semibold', selected ? 'text-on-primary' : 'text-ink')}>
        {label}
      </Text>
    </Pressable>
  );
}

function PhotoTile({
  photo,
  isMain,
  onRemove,
  onMakeMain,
  onRetry,
}: {
  photo: FormPhoto;
  isMain: boolean;
  onRemove: () => void;
  onMakeMain: () => void;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  const colors = useTheme();
  const uploading = photo.status === 'uploading';
  const failed = photo.status === 'error';

  return (
    <Pressable
      onPress={failed ? onRetry : isMain ? undefined : onMakeMain}
      accessibilityRole="button"
      accessibilityLabel={
        failed ? t('productForm.photos.retry') : isMain ? t('productForm.photos.main') : t('productForm.photos.makeMain')
      }
      className="w-24 h-24 rounded-[18px] bg-ph-bg overflow-hidden"
    >
      <Image source={{ uri: photo.uri }} style={{ width: 96, height: 96, opacity: uploading ? 0.5 : 1 }} contentFit="cover" />
      {uploading ? (
        <View className="absolute inset-0 items-center justify-center">
          <Text className="font-onest-semibold text-[11px] text-ink">{Math.round(photo.progress * 100)}%</Text>
          <View className="absolute left-2.5 right-2.5 bottom-3 h-1 rounded-sm bg-card">
            <View className="h-1 rounded-sm bg-ink" style={{ width: `${Math.round(photo.progress * 100)}%` }} />
          </View>
        </View>
      ) : null}
      {failed ? (
        <View className="absolute inset-0 items-center justify-center gap-1 bg-err-bg px-1.5">
          {photo.error === 'tooLarge' ? (
            <CircleAlert size={18} color={colors.errFg} strokeWidth={2} />
          ) : (
            <RotateCw size={18} color={colors.errFg} strokeWidth={2} />
          )}
          <Text className="font-onest-semibold text-[10px] text-err-fg text-center" numberOfLines={2}>
            {photo.error === 'tooLarge' ? t('productForm.photos.tooLarge') : t('productForm.photos.failed')}
          </Text>
        </View>
      ) : null}
      {isMain && !failed ? (
        <View className="absolute left-1.5 bottom-1.5 px-[7px] py-0.5 rounded-pill bg-accent">
          <Text className="font-onest-bold text-[10px] text-on-accent">{t('productForm.photos.main')}</Text>
        </View>
      ) : null}
      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={t('productForm.photos.remove')}
        hitSlop={8}
        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-card items-center justify-center"
      >
        <X size={12} color={colors.ink} strokeWidth={2.5} />
      </Pressable>
    </Pressable>
  );
}

type SheetName = 'none' | 'category' | 'brand' | 'photoSource';

interface ProductCardFormScreenProps {
  /** Edit mode: the product to change (`PATCH /product/:id`) */
  productId?: string;
}

/**
 * «Новый товар · шаг 1 из 2 · Карточка» (design «ProductNew»): photos, name,
 * description, category, brand, attributes (variants are built from them on
 * step 2) and tags, on the working warehouse. «Далее» creates the card
 * (`POST /product`) and opens step 2. Store owner / admin only (the backend checks it).
 *
 * With `productId` it edits the card (owner / manager / admin): prefilled from
 * `GET /product/:id`, attributes locked once the product has variants, «Сохранить»
 * sends `PATCH /product/:id` and goes back.
 */
export function ProductCardFormScreen({ productId }: ProductCardFormScreenProps = {}) {
  const { t, i18n } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const storeId = user?.staff?.storeId;
  const working = useWorkingWarehouse();
  const photos = useProductPhotos();
  const attributes = useStoreAttributes(storeId);
  const tags = useTags();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const isEdit = !!productId;
  const productQuery = useProductById(productId ?? '', { enabled: isEdit });
  const product = productQuery.data;
  const prefilled = useRef(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [brand, setBrand] = useState<StoreBrand | null>(null);
  const [attributeIds, setAttributeIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [sheet, setSheet] = useState<SheetName>('none');
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const tagValues = useMemo(() => (tags.data ?? []).flatMap((g) => g.values), [tags.data]);

  // Edit mode: fill the form once the product is loaded
  useEffect(() => {
    if (!product || prefilled.current) return;
    prefilled.current = true;
    setName(product.name);
    setDescription(product.description ?? '');
    if (product.categoryId) {
      setCategory({
        id: product.categoryId,
        parentId: null,
        name: product.categoryI18n?.name ?? product.category,
        nameUz: product.categoryI18n?.nameUz ?? null,
        nameEn: product.categoryI18n?.nameEn ?? null,
      });
    }
    if (product.brandId) setBrand({ id: product.brandId, name: product.brand });
    setAttributeIds(product.attributes.map((a) => a.id));
    setTagIds(product.tags.map((tag) => tag.id));
    photos.load(product.images ?? []);
  }, [product, photos.load]);

  const attributesLocked = isEdit && (product?.variants.length ?? 0) > 0;

  const header = (
    <View className="px-4 pt-2 pb-3 gap-3">
      <View className="flex-row items-center gap-2.5">
        <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
        <View className="flex-1 min-w-0">
          <Text className="type-heading text-ink" accessibilityRole="header">
            {isEdit ? t('productForm.editTitle') : t('productForm.title')}
          </Text>
          <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>
            {isEdit ? (product?.name ?? '') : t('productForm.step1')}
          </Text>
        </View>
      </View>
      {isEdit ? null : (
        <View className="flex-row gap-1.5">
          <View className="flex-1 h-1 rounded-sm bg-accent" />
          <View className="flex-1 h-1 rounded-sm bg-track" />
        </View>
      )}
    </View>
  );

  if (isEdit ? !canManageProducts(user) : !canCreateProduct(user)) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <EmptyState icon={Lock} message={isEdit ? t('productForm.noEditAccess') : t('productForm.noAccess')} />
      </View>
    );
  }
  if (isEdit && productQuery.isLoading) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <LoadingState />
      </View>
    );
  }
  if (isEdit && !product) {
    return (
      <View className="flex-1 bg-bg">
        {header}
        <Pressable onPress={() => void productQuery.refetch()} accessibilityRole="button">
          <EmptyState icon={PackageX} message={t('productForm.loadFailed')} />
        </Pressable>
      </View>
    );
  }

  const nameError = submitted && !name.trim();
  const categoryError = submitted && !category;
  const brandError = submitted && !brand;
  const blocked = photos.isUploading || (!isEdit && !working.warehouseId);

  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const pickPhotos = async (source: PickSource) => {
    setSheet('none');
    const error = await photos.add(source);
    if (error === 'permission') toast.show(t(`productForm.photos.permission.${source}`), 'error');
    if (error === 'failed') toast.show(t('productForm.photos.pickFailed'), 'error');
  };

  const submit = () => {
    setSubmitted(true);
    setServerError(null);
    if (!name.trim() || !category || !brand || photos.isUploading) return;
    if (isEdit && productId) {
      update.mutate(
        {
          id: productId,
          body: {
            name: name.trim(),
            description: description.trim(),
            categoryId: category.id,
            brandId: brand.id,
            tagIds,
            images: photos.keys,
            // Attributes define the variants — sent only while there are none
            ...(attributesLocked ? {} : { attributeIds }),
          },
        },
        {
          onSuccess: () => {
            toast.show(t('productForm.saved'));
            router.back();
          },
          onError: (err) => setServerError(getApiErrorMessage(err, t('productForm.updateFailed'))),
        },
      );
      return;
    }
    if (!working.warehouseId) return;
    create.mutate(
      {
        warehouseId: working.warehouseId,
        name: name.trim(),
        description: description.trim() || undefined,
        categoryId: category.id,
        brandId: brand.id,
        attributeIds,
        tagIds,
        images: photos.keys,
      },
      {
        onSuccess: (product) => {
          toast.show(t('productForm.created'));
          router.replace({ pathname: '/(tabs)/(products)/variants/[id]', params: { id: product.id } });
        },
        onError: (err) => setServerError(getApiErrorMessage(err, t('productForm.createFailed'))),
      },
    );
  };

  const selects = [
    {
      key: 'category' as const,
      label: t('productForm.category'),
      value: category ? categoryLabel(category, i18n.language) : null,
      invalid: categoryError,
    },
    { key: 'brand' as const, label: t('productForm.brand'), value: brand?.name ?? null, invalid: brandError },
  ];

  return (
    <View className="flex-1 bg-bg">
      {header}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}>
          {/* Warehouse */}
          <View className="flex-row items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-card">
            <Warehouse size={18} color={colors.soft} strokeWidth={2} />
            <Text className="flex-1 font-onest text-[13px] text-soft">
              {isEdit ? t('productForm.warehouseEdit') : t('productForm.warehouse')}{' '}
              <Text className="font-onest-bold text-[13px] text-ink">
                {(isEdit ? product?.warehouse?.name : working.warehouse?.name) ?? '—'}
              </Text>
            </Text>
          </View>

          {/* Photos */}
          <View className="bg-card rounded-xl px-3.5 py-4 gap-3">
            <View className="flex-row items-baseline justify-between px-0.5">
              <Text className="font-onest-bold text-[15px] text-ink">{t('productForm.photos.title')}</Text>
              <Text className="font-onest text-xs text-muted">
                {t('productForm.photos.counter', { count: photos.photos.length, max: PRODUCT_IMAGE_MAX_COUNT })}
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {photos.canAdd ? (
                <Pressable
                  onPress={() => setSheet('photoSource')}
                  accessibilityRole="button"
                  accessibilityLabel={t('productForm.photos.add')}
                  className="w-24 h-24 rounded-[18px] bg-sunken border-[1.5px] border-dashed border-line items-center justify-center gap-1.5"
                >
                  <Camera size={22} color={colors.ink} strokeWidth={2} />
                  <Text className="font-onest-semibold text-xs text-ink">{t('productForm.photos.addShort')}</Text>
                </Pressable>
              ) : null}
              {photos.photos.map((p, index) => (
                <PhotoTile
                  key={p.id}
                  photo={p}
                  isMain={index === 0}
                  onRemove={() => photos.remove(p.id)}
                  onMakeMain={() => photos.makeMain(p.id)}
                  onRetry={() => photos.retry(p.id)}
                />
              ))}
            </ScrollView>
            {photos.photos.length > 1 ? (
              <Text className="font-onest text-xs text-muted px-0.5">{t('productForm.photos.mainHint')}</Text>
            ) : null}
          </View>

          {/* Main */}
          <View className="bg-card rounded-xl px-3.5 py-4 gap-3.5">
            <Text className="font-onest-bold text-[15px] text-ink px-0.5">{t('productForm.main')}</Text>
            <View className="gap-1.5">
              <Text className="font-onest-semibold text-[13px] text-soft">{t('productForm.name')}</Text>
              <Input size="lg" invalid={nameError}>
                <InputField
                  value={name}
                  onChangeText={setName}
                  placeholder={t('productForm.namePlaceholder')}
                  maxLength={NAME_MAX}
                  accessibilityLabel={t('productForm.name')}
                />
              </Input>
              {nameError ? (
                <Text className="font-onest-semibold text-xs text-err-fg px-0.5">{t('productForm.nameRequired')}</Text>
              ) : null}
            </View>
            <View className="gap-1.5">
              <Text className="font-onest-semibold text-[13px] text-soft">
                {t('productForm.description')}{' '}
                <Text className="font-onest text-[13px] text-muted">· {t('productForm.optional')}</Text>
              </Text>
              <TextArea
                value={description}
                onChangeText={setDescription}
                placeholder={t('productForm.descriptionPlaceholder')}
                maxLength={DESCRIPTION_MAX}
                rows={3}
              />
            </View>
            <View className="rounded-2xl bg-sunken overflow-hidden">
              {selects.map((s, index) => (
                <Pressable
                  key={s.key}
                  onPress={() => setSheet(s.key)}
                  accessibilityRole="button"
                  accessibilityLabel={`${s.label}: ${s.value ?? t('productForm.choose')}`}
                  className={cn(
                    'h-14 px-4 flex-row items-center gap-3 border-2',
                    s.invalid ? 'border-err-fg rounded-2xl' : 'border-transparent',
                    index > 0 && !s.invalid && 'border-t-card',
                  )}
                >
                  <Text className={cn('flex-1 font-onest text-sm', s.invalid ? 'text-err-fg' : 'text-soft')}>{s.label}</Text>
                  <Text
                    className={cn('font-onest-semibold text-[15px] shrink', s.value ? 'text-ink' : 'text-muted')}
                    numberOfLines={1}
                  >
                    {s.value ?? t('productForm.choose')}
                  </Text>
                  <ChevronRight size={18} color={colors.muted} strokeWidth={2} />
                </Pressable>
              ))}
            </View>
            {categoryError || brandError ? (
              <Text className="font-onest-semibold text-xs text-err-fg px-0.5">
                {categoryError && brandError
                  ? t('productForm.categoryBrandRequired')
                  : categoryError
                    ? t('productForm.categoryRequired')
                    : t('productForm.brandRequired')}
              </Text>
            ) : null}
          </View>

          {/* Attributes */}
          <View className="bg-card rounded-xl px-3.5 py-4 gap-3">
            <View className="gap-0.5 px-0.5">
              <Text className="font-onest-bold text-[15px] text-ink">{t('productForm.attributes')}</Text>
              <Text className="font-onest text-xs text-muted">{t('productForm.attributesHint')}</Text>
            </View>
            {attributes.isLoading ? (
              <ActivityIndicator color={colors.muted} />
            ) : attributes.data?.length ? (
              <View className="flex-row flex-wrap gap-2">
                {attributes.data.map((a) => (
                  <ToggleChip
                    key={a.id}
                    label={attributeTitle(a, i18n.language)}
                    selected={attributeIds.includes(a.id)}
                    onPress={() => setAttributeIds((list) => toggle(list, a.id))}
                    disabled={attributesLocked}
                    withIcon
                  />
                ))}
              </View>
            ) : (
              <Text className="font-onest text-[13px] text-muted px-0.5">
                {attributes.isError ? t('productForm.attributesFailed') : t('productForm.attributesEmpty')}
              </Text>
            )}
            {attributesLocked ? (
              <Text className="font-onest text-xs text-muted px-0.5">{t('productForm.attributesLocked')}</Text>
            ) : null}
            {!attributesLocked && attributeIds.length === 0 && attributes.data?.length ? (
              <Text className="font-onest text-xs text-muted px-0.5">{t('productForm.noAttributesHint')}</Text>
            ) : null}
          </View>

          {/* Tags */}
          {tagValues.length ? (
            <View className="bg-card rounded-xl px-3.5 py-4 gap-3">
              <View className="gap-0.5 px-0.5">
                <Text className="font-onest-bold text-[15px] text-ink">
                  {t('productForm.tags')} <Text className="font-onest text-xs text-muted">· {t('productForm.optional')}</Text>
                </Text>
                <Text className="font-onest text-xs text-muted">{t('productForm.tagsHint')}</Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {tagValues.map((v) => (
                  <ToggleChip
                    key={v.id}
                    label={v.value}
                    selected={tagIds.includes(v.id)}
                    onPress={() => setTagIds((list) => toggle(list, v.id))}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View className="px-4 pt-3 gap-2 bg-bg" style={{ paddingBottom: insets.bottom + 12 }}>
          {serverError ? (
            <View className="flex-row items-start gap-2 bg-err-bg rounded-lg px-4 py-3" accessibilityRole="alert">
              <CircleAlert size={16} color={colors.errFg} strokeWidth={2} />
              <Text className="flex-1 font-onest-semibold text-[13px] leading-[18px] text-err-fg">{serverError}</Text>
            </View>
          ) : null}
          <Button
            variant="accent"
            size="lg"
            full
            disabled={blocked}
            loading={create.isPending || update.isPending}
            onPress={submit}
          >
            {photos.isUploading
              ? t('productForm.photosUploading')
              : isEdit
                ? t('productForm.saveEdit')
                : t('productForm.next')}
          </Button>
          {photos.hasErrors || !isEdit ? (
            <Text className="font-onest text-xs text-muted text-center">
              {photos.hasErrors ? t('productForm.photosErrorHint') : t('productForm.draftHint')}
            </Text>
          ) : null}
        </View>
      </KeyboardAvoidingView>

      <CategorySheet
        isOpen={sheet === 'category'}
        onClose={() => setSheet('none')}
        storeId={storeId}
        selectedId={category?.id}
        onSelect={setCategory}
      />
      <BrandSheet
        isOpen={sheet === 'brand'}
        onClose={() => setSheet('none')}
        storeId={storeId}
        selectedId={brand?.id}
        onSelect={setBrand}
      />
      <Sheet isOpen={sheet === 'photoSource'} onClose={() => setSheet('none')} size="auto">
        <View className="px-4 pt-2 gap-2.5" style={{ paddingBottom: insets.bottom + 16 }}>
          <Text className="type-title text-ink" accessibilityRole="header">{t('productForm.photos.add')}</Text>
          <Text className="font-onest text-[13px] text-muted">{t('productForm.photos.limitHint', { max: PRODUCT_IMAGE_MAX_COUNT })}</Text>
          <Button icon={Camera} variant="secondary" size="lg" full onPress={() => void pickPhotos('camera')}>
            {t('productForm.photos.camera')}
          </Button>
          <Button icon={Images} variant="secondary" size="lg" full onPress={() => void pickPhotos('library')}>
            {t('productForm.photos.library')}
          </Button>
        </View>
      </Sheet>
    </View>
  );
}
