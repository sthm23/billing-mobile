import { Button, IconButton, Pressable, SearchField, Spinner, Text, toast } from '@/components/base';
import { SafeAreaView } from '@/components/base/SafeAreaView';
import { Sheet } from '@/components/base/Sheet';
import { EmptyState, LoadingState } from '@/components/common';
import { useDebounce } from '@/hooks/use-debounce';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/libs/api-error';
import { attributeLabel, unitLabel } from '@/libs/attribute';
import { isAdmin } from '@/libs/roles';
import { cn } from '@/libs/utils';
import { useAuth } from '@/provider/AuthProvider';
import {
  useAdminStore,
  useCatalogDictionary,
  useConnectCatalogItem,
  useDisconnectCatalogItem,
  type AdminStoreAttribute,
  type AttributeType,
  type ConnectCatalogVars,
  type DictionaryAttribute,
  type DictionaryBrand,
  type NewStoreAttribute,
  type StoreCatalogKind,
} from '@/services/admin-store';
import { isAxiosError } from 'axios';
import { router } from 'expo-router';
import { ChevronLeft, Info, Lock, Plus, ShieldX, TriangleAlert, WifiOff } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, type TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AttributeEditSheet } from './AttributeEditSheet';
import { AttributeSheet } from './NewShopSheets';

const SEARCH_DEBOUNCE_MS = 300;
/** Backend 409 codes (billing/src/admin/admin-catalog.service.ts) */
const IN_USE_CODE = 'IN_USE';
const ATTRIBUTE_EXISTS_CODE = 'ATTRIBUTE_EXISTS';

type ErrorBody = { code?: string; count?: number; attribute?: DictionaryAttribute };

function errorBody(error: unknown): ErrorBody | undefined {
  return isAxiosError<ErrorBody>(error) && error.response?.status === 409 ? error.response.data : undefined;
}

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** A brand or an attribute as a row of either list */
interface Item {
  id: string;
  name: string;
  /** Attribute type chip «Число · м» */
  chip?: string;
  /** Connected list: products using it */
  productCount: number;
  /** Dictionary: stores using it */
  storeCount: number;
  /** Every name it is searched / matched by (ru + translations) */
  names: string[];
  attribute?: AdminStoreAttribute;
}

/**
 * Admin: brands («Бренды магазина») or attributes («Атрибуты товаров») of a store
 * (billing/docs/store-catalog/PLAN.md, design «Каталог · бренды / атрибуты магазина»).
 * Each action is saved at once: connect from the dictionary (or create by name), disconnect
 * only what the store's products (archived included) don't use.
 */
export function StoreCatalogScreen({ id, kind }: { id: string; kind: StoreCatalogKind }) {
  const { t, i18n } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const admin = isAdmin(user);
  const isBrands = kind === 'brands';
  const lang = i18n.language;

  const store = useAdminStore(admin ? id : undefined);
  const [query, setQuery] = useState('');
  const search = useDebounce(query.trim(), SEARCH_DEBOUNCE_MS);
  const dictionary = useCatalogDictionary(kind, search, admin);
  const connect = useConnectCatalogItem(id);
  const disconnect = useDisconnectCatalogItem(id);
  const searchRef = useRef<TextInput>(null);

  /** Ids / lower-case names being connected or disconnected */
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [inUse, setInUse] = useState<{ name: string; count: number } | null>(null);
  const [newAttrOpen, setNewAttrOpen] = useState(false);
  const [conflict, setConflict] = useState<DictionaryAttribute | null>(null);
  const [editAttribute, setEditAttribute] = useState<AdminStoreAttribute | null>(null);

  const typeChip = (type: AttributeType, unit: string | null) => {
    const label = t(`adminShopNew.attr.types.${type}`);
    return unit ? `${label} · ${unitLabel(unit, lang)}` : label;
  };

  const connected: Item[] = useMemo(() => {
    const data = store.data;
    if (!data) return [];
    return isBrands
      ? data.brands.map((b) => ({ id: b.id, name: b.name, productCount: b.productCount, storeCount: 0, names: [b.name] }))
      : data.attributes.map((a) => ({
          id: a.id,
          name: attributeLabel(a, lang),
          chip: typeChip(a.type, a.unit),
          productCount: a.productCount,
          storeCount: 0,
          names: [a.name, a.nameUz, a.nameEn].filter((n): n is string => !!n),
          attribute: a,
        }));
    // typeChip only depends on t / lang
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.data, isBrands, lang]);
  const connectedIds = useMemo(() => new Set(connected.map((c) => c.id)), [connected]);

  const dict: Item[] = useMemo(
    () =>
      ((dictionary.data?.data ?? []) as (DictionaryBrand | DictionaryAttribute)[]).map((d) =>
        'type' in d
          ? {
              id: d.id,
              name: attributeLabel(d, lang),
              chip: typeChip(d.type, d.unit),
              productCount: 0,
              storeCount: d.storeCount,
              names: [d.name, d.nameUz, d.nameEn].filter((n): n is string => !!n),
            }
          : { id: d.id, name: d.name, productCount: 0, storeCount: d.storeCount, names: [d.name] },
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dictionary.data, lang],
  );

  const matches = (item: Item, text: string) => item.names.some((n) => sameName(n, text));
  const alreadyConnected = search ? connected.find((c) => matches(c, search)) : undefined;
  const exact = search ? dict.find((d) => matches(d, search)) : undefined;
  const notFound = !!search && !!dictionary.data && dict.length === 0;

  const setBusy = (key: string, on: boolean) =>
    setPending((current) => {
      const next = new Set(current);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });

  const savedText = (name: string) =>
    isBrands ? t('storeCatalog.savedBrand', { name }) : t('storeCatalog.savedAttribute', { name });

  const connectItem = async (vars: ConnectCatalogVars, key: string, name: string): Promise<boolean> => {
    setBusy(key, true);
    try {
      const item = await connect.mutateAsync(vars);
      toast.show(savedText(isBrands ? item.name : name));
      return true;
    } catch (error) {
      toast.show(getApiErrorMessage(error, t('storeCatalog.connectFailed', { name })), 'error');
      return false;
    } finally {
      setBusy(key, false);
    }
  };

  const connectExisting = (item: Item) =>
    connectItem(
      isBrands ? { kind: 'brands', brandId: item.id } : { kind: 'attributes', attributeId: item.id },
      item.id,
      item.name,
    );

  const createFromSearch = () => {
    if (isBrands) {
      void connectItem({ kind: 'brands', name: search }, `name:${search.toLowerCase()}`, search).then((ok) => {
        if (ok) setQuery('');
      });
      return;
    }
    setConflict(null);
    setNewAttrOpen(true);
  };

  /** «+ Новый бренд по названию» types into the search; «+ Новый атрибут» opens the sheet */
  const createRow = () => {
    if (isBrands) searchRef.current?.focus();
    else createFromSearch();
  };

  const addAttribute = async (attr: NewStoreAttribute): Promise<string | null | undefined> => {
    try {
      await connect.mutateAsync({ kind: 'attributes', newAttribute: attr });
      toast.show(t('storeCatalog.savedAttribute', { name: attr.name }));
      setQuery('');
      return null;
    } catch (error) {
      const body = errorBody(error);
      if (body?.code === ATTRIBUTE_EXISTS_CODE && body.attribute) {
        setConflict(body.attribute);
        return undefined;
      }
      return getApiErrorMessage(error, t('storeCatalog.connectFailed', { name: attr.name }));
    }
  };

  const connectConflict = async () => {
    if (!conflict) return;
    const item = { id: conflict.id, name: attributeLabel(conflict, lang) } as Item;
    const ok = await connectExisting(item);
    if (ok) {
      setNewAttrOpen(false);
      setConflict(null);
      setQuery('');
    }
  };

  const disconnectItem = (item: Item) => {
    if (item.productCount > 0) {
      setInUse({ name: item.name, count: item.productCount });
      return;
    }
    setBusy(item.id, true);
    disconnect.mutate(
      { kind, id: item.id },
      {
        onSuccess: () => toast.show(t('storeCatalog.removed', { name: item.name })),
        onError: (error) => {
          const body = errorBody(error);
          if (body?.code === IN_USE_CODE) {
            setInUse({ name: item.name, count: body.count ?? 0 });
            return;
          }
          toast.show(getApiErrorMessage(error, t('storeCatalog.disconnectFailed', { name: item.name })), 'error');
        },
        onSettled: () => setBusy(item.id, false),
      },
    );
  };

  const title = isBrands ? t('storeCatalog.titleBrands') : t('storeCatalog.titleAttributes');
  const header = (
    <View className="flex-row items-center gap-2.5 px-4 pt-2 pb-3">
      <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
      <View className="flex-1 min-w-0">
        <Text className="type-heading text-ink" accessibilityRole="header">{title}</Text>
        {store.data ? (
          <Text className="font-onest text-[13px] text-muted" numberOfLines={1}>
            {t('storeCatalog.subtitle', { store: store.data.name, count: connected.length })}
          </Text>
        ) : null}
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
  if (store.isLoading) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-bg">
        {header}
        <LoadingState />
      </SafeAreaView>
    );
  }
  if (!store.data) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-bg">
        {header}
        <EmptyState icon={WifiOff} message={t('adminShop.errorTitle')} description={t('adminShops.errorText')}>
          <Button onPress={() => void store.refetch()}>{t('adminShops.retry')}</Button>
        </EmptyState>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      {header}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24, gap: 12 }}
      >
        {search ? (
          <View className="flex-row items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-card">
            <Text className="font-onest-bold text-[13px] text-ink">
              {t('storeCatalog.connectedShort', { count: connected.length })}
            </Text>
            <Text className="flex-1 font-onest text-[13px] text-soft" numberOfLines={1}>
              {connected.map((c) => c.name).join(', ')}
            </Text>
          </View>
        ) : (
          <>
            <View className="flex-row items-start gap-2 px-1">
              <Info size={16} color={colors.muted} strokeWidth={2} />
              <Text className="flex-1 font-onest text-xs leading-[17px] text-muted">
                {isBrands ? t('storeCatalog.noteBrands') : t('storeCatalog.noteAttributes')}
              </Text>
            </View>
            <View className="bg-card rounded-[24px] p-3.5">
              <Text className="font-onest-bold text-[15px] text-ink px-0.5 pb-1.5" accessibilityRole="header">
                {t('storeCatalog.connected', { count: connected.length })}
              </Text>
              {connected.length ? (
                connected.map((item, i) => (
                  <View key={item.id} className={cn('flex-row items-center gap-3 py-2.5 px-0.5', i > 0 && 'border-t border-line')}>
                    <Pressable
                      className="flex-1 min-w-0 gap-1"
                      disabled={!item.attribute}
                      onPress={() => item.attribute && setEditAttribute(item.attribute)}
                      accessibilityRole={item.attribute ? 'button' : undefined}
                      accessibilityHint={item.attribute ? t('storeCatalog.editAttributeHint') : undefined}
                    >
                      <Text className="font-onest-bold text-[15px] text-ink">{item.name}</Text>
                      <View className="flex-row flex-wrap items-center gap-1.5">
                        {item.chip ? <TypeChip label={item.chip} /> : null}
                        <Text className={cn('font-onest text-xs', item.productCount ? 'text-soft' : 'text-muted')}>
                          {item.productCount
                            ? t('storeCatalog.usedIn', { count: item.productCount })
                            : t('storeCatalog.notUsed')}
                        </Text>
                      </View>
                    </Pressable>
                    <Pressable
                      onPress={() => disconnectItem(item)}
                      disabled={pending.has(item.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`${t('storeCatalog.disconnect')} ${item.name}`}
                      className="h-[34px] px-3 rounded-pill bg-sunken flex-row items-center gap-1.5"
                    >
                      {pending.has(item.id) ? (
                        <Spinner size="sm" />
                      ) : item.productCount ? (
                        <Lock size={13} color={colors.muted} strokeWidth={2.2} />
                      ) : null}
                      <Text className="font-onest-semibold text-[13px] text-ink">{t('storeCatalog.disconnect')}</Text>
                    </Pressable>
                  </View>
                ))
              ) : (
                <View className="p-3.5 rounded-2xl bg-sunken">
                  <Text className="font-onest text-[13px] leading-[19px] text-soft">
                    {isBrands ? t('storeCatalog.emptyBrands') : t('storeCatalog.emptyAttributes')}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        <View className="gap-2">
          <Text className="font-onest-semibold text-[13px] text-soft px-1">
            {t('storeCatalog.dictionary', { count: dictionary.data?.total ?? 0 })}
          </Text>
          <SearchField
            ref={searchRef}
            value={query}
            onChangeText={setQuery}
            placeholder={isBrands ? t('storeCatalog.searchBrands') : t('storeCatalog.searchAttributes')}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>

        {alreadyConnected ? (
          <View className="flex-row items-center gap-2.5 px-3.5 py-3 rounded-2xl bg-warn-bg" accessibilityRole="alert">
            <TriangleAlert size={18} color={colors.warnFg} strokeWidth={2} />
            <Text className="flex-1 font-onest-semibold text-[13px] leading-[18px] text-warn-fg">
              {t('storeCatalog.alreadyConnected', { name: alreadyConnected.name })}
            </Text>
          </View>
        ) : null}

        <View className="bg-card rounded-[24px] px-3.5 py-1.5">
          {dictionary.isLoading ? (
            <View accessibilityLabel={t('storeCatalog.loading')} accessibilityState={{ busy: true }}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} className={cn('flex-row items-center gap-3 py-3.5 px-0.5', i > 0 && 'border-t border-line')}>
                  <View className="flex-1 gap-2">
                    <View className="w-2/5 h-[13px] rounded-md bg-sunken" />
                    <View className="w-1/4 h-2.5 rounded-md bg-sunken" />
                  </View>
                  <View className="w-24 h-[34px] rounded-pill bg-sunken" />
                </View>
              ))}
            </View>
          ) : dictionary.isError && !dictionary.data ? (
            <View className="items-center gap-2 py-5 px-2" accessibilityRole="alert">
              <View className="w-[52px] h-[52px] rounded-full bg-err-bg items-center justify-center">
                <WifiOff size={24} color={colors.errFg} strokeWidth={2} />
              </View>
              <Text className="font-onest-bold text-base text-ink">{t('storeCatalog.dictionaryFailed')}</Text>
              <Text className="font-onest text-[13px] text-muted text-center">{t('storeCatalog.dictionaryFailedHint')}</Text>
              <Button onPress={() => void dictionary.refetch()}>{t('adminShops.retry')}</Button>
            </View>
          ) : notFound ? (
            <View className="gap-2.5 py-3.5 px-0.5">
              <Text className="font-onest-bold text-[15px] text-ink">{t('storeCatalog.notFound')}</Text>
              <Text className="font-onest text-[13px] leading-[19px] text-muted">
                {isBrands
                  ? t('storeCatalog.notFoundBrand', { name: search })
                  : t('storeCatalog.notFoundAttribute', { name: search })}
              </Text>
              <Button
                size="lg"
                full
                icon={Plus}
                loading={pending.has(`name:${search.toLowerCase()}`)}
                onPress={createFromSearch}
              >
                {t('storeCatalog.create', { name: search })}
              </Button>
            </View>
          ) : (
            <>
              {!search && dict.length ? (
                <Text className="font-onest text-xs text-muted px-0.5 pt-2.5 pb-0.5">{t('storeCatalog.popular')}</Text>
              ) : null}
              {dict.map((item, i) => {
                const isOn = connectedIds.has(item.id);
                const busy = pending.has(item.id);
                return (
                  <View key={item.id} className={cn('flex-row items-center gap-3 py-2.5 px-0.5', i > 0 && 'border-t border-line')}>
                    <View className="flex-1 min-w-0 gap-1">
                      <Text className="font-onest-semibold text-[15px] text-ink">{item.name}</Text>
                      <View className="flex-row flex-wrap items-center gap-1.5">
                        {item.chip ? <TypeChip label={item.chip} /> : null}
                        <Text className="font-onest text-xs text-muted">
                          {t('storeCatalog.inStores', { count: item.storeCount })}
                        </Text>
                      </View>
                    </View>
                    {isOn ? (
                      <View className="px-2.5 py-1 rounded-pill bg-ok-bg">
                        <Text className="font-onest-semibold text-xs text-ok-fg">{t('storeCatalog.connectedBadge')}</Text>
                      </View>
                    ) : busy ? (
                      <View
                        className="h-[34px] px-3 rounded-pill bg-sunken flex-row items-center gap-2"
                        accessibilityState={{ busy: true }}
                      >
                        <Spinner size="sm" />
                        <Text className="font-onest-semibold text-[13px] text-soft">{t('storeCatalog.connecting')}</Text>
                      </View>
                    ) : (
                      <Button size="sm" variant="primary" icon={Plus} onPress={() => void connectExisting(item)}>
                        {t('storeCatalog.connect')}
                      </Button>
                    )}
                  </View>
                );
              })}
              {search && !exact && dict.length ? (
                <Pressable
                  onPress={createFromSearch}
                  accessibilityRole="button"
                  className="my-2 h-11 rounded-pill border-[1.5px] border-dashed border-line items-center justify-center"
                >
                  <Text className="font-onest-semibold text-sm text-ink">{t('storeCatalog.create', { name: search })}</Text>
                </Pressable>
              ) : null}
              {!search ? (
                <Pressable
                  onPress={createRow}
                  accessibilityRole="button"
                  className="my-2 h-11 rounded-pill border-[1.5px] border-dashed border-line items-center justify-center"
                >
                  <Text className="font-onest-semibold text-sm text-ink">
                    {isBrands ? t('storeCatalog.newBrandRow') : t('storeCatalog.newAttributeRow')}
                  </Text>
                </Pressable>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      <InUseSheet info={inUse} isBrands={isBrands} onClose={() => setInUse(null)} />
      {isBrands ? null : (
        <>
          <AttributeSheet
            isOpen={newAttrOpen}
            onClose={() => {
              setNewAttrOpen(false);
              setConflict(null);
            }}
            onAdd={addAttribute}
            initialName={search}
            subtitle={t('storeCatalog.newAttributeSubtitle', { store: store.data.name })}
            submitLabel={t('storeCatalog.newAttributeSubmit')}
            conflict={
              conflict
                ? {
                    text: t('storeCatalog.attributeExists', {
                      name: attributeLabel(conflict, lang),
                      type: typeChip(conflict.type, conflict.unit),
                    }),
                    actionLabel: t('storeCatalog.connectIt'),
                    onAction: () => void connectConflict(),
                  }
                : null
            }
            onNameChange={() => setConflict(null)}
          />
          <AttributeEditSheet attribute={editAttribute} onClose={() => setEditAttribute(null)} />
        </>
      )}
    </SafeAreaView>
  );
}

function TypeChip({ label }: { label: string }) {
  return (
    <View className="px-2 py-0.5 rounded-pill bg-sunken">
      <Text className="font-onest-semibold text-[11px] text-soft">{label}</Text>
    </View>
  );
}

/** «Нельзя отключить "Knauf"» — used in the store's products (archived included) */
function InUseSheet({
  info,
  isBrands,
  onClose,
}: {
  info: { name: string; count: number } | null;
  isBrands: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const colors = useTheme();

  return (
    <Sheet isOpen={!!info} onClose={onClose} size="auto">
      <View className="px-4 pt-1 pb-3 gap-3.5">
        <View className="w-[52px] h-[52px] rounded-full bg-warn-bg items-center justify-center">
          <Lock size={24} color={colors.warnFg} strokeWidth={2} />
        </View>
        <View className="gap-1.5">
          <Text className="type-title text-ink" accessibilityRole="header">
            {t('storeCatalog.inUse.title', { name: info?.name ?? '' })}
          </Text>
          <Text className="font-onest text-sm leading-5 text-muted">
            {isBrands ? t('storeCatalog.inUse.brand') : t('storeCatalog.inUse.attribute')}
          </Text>
        </View>
        <View className="flex-row justify-between px-3.5 py-3 rounded-2xl bg-sunken">
          <Text className="font-onest text-sm text-soft">{t('storeCatalog.inUse.count')}</Text>
          <Text className="font-onest-bold text-sm text-ink">{info?.count ?? 0}</Text>
        </View>
        <Button variant="primary" size="lg" full onPress={onClose}>
          {t('storeCatalog.inUse.ok')}
        </Button>
      </View>
    </Sheet>
  );
}
