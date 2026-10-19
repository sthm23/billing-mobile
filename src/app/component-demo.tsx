import {
  Avatar,
  AvatarFallbackText,
  Button,
  Card,
  Chip,
  FormControl,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
  HeroCard,
  IconButton,
  Input,
  InputField,
  ListCard,
  Modal,
  Money,
  PhotoPlaceholder,
  SearchField,
  Segmented,
  StatusBadge,
  Stepper,
  Text,
  TextArea,
} from '@/components/base';
import { EmptyState } from '@/components/common';
import { ThemeMode, useThemeControl } from '@/hooks/use-theme-control';
import { BottomSheet } from '@expo/ui';
import { router } from 'expo-router';
import { Check, ChevronLeft, Pencil, Plus, ScanBarcode, Search, SlidersHorizontal, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Component Demo — живая витрина базовых компонентов STHM
 *
 * Аналог артборда «Компоненты — витрина» из макета. Проверяйте здесь
 * компоненты в светлой и тёмной теме. Данные — демонстрационные.
 *
 * Доступ: /component-demo
 */
export default function ComponentDemoScreen() {
  const { themeMode, setThemeMode } = useThemeControl();
  const [orderFilter, setOrderFilter] = useState<'all' | 'open' | 'done'>('all');
  const [chip, setChip] = useState('all');
  const [query, setQuery] = useState('');
  const [qty, setQty] = useState(24);
  const [lineQty, setLineQty] = useState(2);
  const [modalVisible, setModalVisible] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView contentContainerClassName="px-4 pb-16 gap-4">
        <View className="flex-row items-center gap-3 pt-2">
          <IconButton icon={ChevronLeft} accessibilityLabel="Назад" onPress={() => router.back()} />
          <Text className="type-title text-ink flex-1">Компоненты</Text>
        </View>

        <Segmented
          options={[
            { value: ThemeMode.LIGHT, label: 'Светлая' },
            { value: ThemeMode.DARK, label: 'Тёмная' },
            { value: ThemeMode.AUTO, label: 'Система' },
          ]}
          value={themeMode}
          onChange={setThemeMode}
        />

        <Section title="Типографика">
          <Text className="type-display text-ink">18 056 319</Text>
          <Text className="type-title text-ink">Заказы</Text>
          <Text className="type-heading text-ink">Strapela 6м</Text>
          <Text className="type-subhead text-ink">Остатки и цены</Text>
          <Text className="type-body-strong text-ink">Тухтамишев Санжар</Text>
          <Text className="type-body text-soft">Склад 1 · 12 шт.</Text>
          <Text className="type-label text-muted">05.09.2026, 14:20</Text>
          <Money value={18056319} className="text-[22px] text-ink" currencyClassName="text-[13px] text-muted" />
        </Section>

        <Section title="Button">
          <View className="flex-row flex-wrap gap-2.5">
            <Button variant="accent" size="lg">Оплатить</Button>
            <Button variant="primary" size="lg" icon={Check}>Заказать</Button>
            <Button variant="secondary" size="lg">Бронь</Button>
            <Button variant="danger" size="lg" icon={Trash2}>Удалить</Button>
            <Button variant="accent" size="lg" disabled>Оплатить</Button>
            <Button variant="primary" icon={Plus}>Новый</Button>
            <Button variant="ghost" size="sm">Отмена</Button>
          </View>
          <Button variant="accent" size="lg" full loading={loading} onPress={() => setLoading((v) => !v)}>
            Подтвердить оплату
          </Button>
        </Section>

        <Section title="IconButton">
          <View className="flex-row flex-wrap gap-2.5 bg-bg rounded-md p-2.5">
            <IconButton icon={ChevronLeft} accessibilityLabel="Назад" />
            <IconButton icon={SlidersHorizontal} accessibilityLabel="Фильтр" />
            <IconButton icon={Plus} variant="primary" accessibilityLabel="Добавить" />
            <IconButton icon={Pencil} variant="sunken" accessibilityLabel="Изменить" />
            <IconButton icon={Trash2} variant="danger" accessibilityLabel="Удалить" />
            <IconButton icon={ScanBarcode} variant="accent" size="lg" accessibilityLabel="Сканировать" />
          </View>
        </Section>

        <Section title="StatusBadge">
          <View className="flex-row flex-wrap gap-2">
            <StatusBadge label="Создано" tone="info" />
            <StatusBadge label="Ожидание" tone="warn" />
            <StatusBadge label="Долг" tone="err" />
            <StatusBadge label="Завершено" tone="ok" />
            <StatusBadge label="Закрыта" tone="neutral" />
            <StatusBadge label="Открыта" tone="accent" />
          </View>
        </Section>

        <Section title="Segmented · Chip · SearchField">
          <Segmented
            options={[
              { value: 'all', label: 'Все' },
              { value: 'open', label: 'Открытые' },
              { value: 'done', label: 'Завершённые' },
            ]}
            value={orderFilter}
            onChange={setOrderFilter}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {['all', 'beam', 'board', 'plywood'].map((id, i) => (
              <Chip
                key={id}
                label={['Все · 248', 'Брус', 'Доска', 'Фанера'][i]}
                selected={chip === id}
                tone="sunken"
                onPress={() => setChip(id)}
              />
            ))}
            <Chip label="Мало · 3" tone="err" />
          </ScrollView>
          <SearchField value={query} onChangeText={setQuery} variant="sunken" placeholder="Название или штрихкод" onScanPress={() => setSheetVisible(true)} />
          <SearchField variant="sunken" placeholder="Имя или телефон" />
        </Section>

        <Section title="Stepper · PhotoPlaceholder · Avatar">
          <View className="flex-row items-center gap-4">
            <Stepper value={qty} onChange={setQty} max={27} />
            <Stepper value={lineQty} onChange={setLineQty} vertical size="sm" />
            <PhotoPlaceholder size="sm" />
            <PhotoPlaceholder size="lg" />
          </View>
          <View className="flex-row items-center gap-3">
            <Avatar><AvatarFallbackText>Алиев Камол</AvatarFallbackText></Avatar>
            <Avatar tone="accent" size="lg"><AvatarFallbackText>Тухтамишев Санжар</AvatarFallbackText></Avatar>
            <Avatar tone="primary" size="sm"><AvatarFallbackText>ООО СтройМаркет</AvatarFallbackText></Avatar>
          </View>
        </Section>

        <Section title="HeroCard">
          <HeroCard
            label="Продажи сегодня"
            chip="14 заказов"
            amount={38056619}
            tiles={[
              { label: 'Оплачено', value: 31006319, tone: 'accent' },
              { label: 'В долг', value: 7050300, tone: 'err' },
            ]}
          />
          <HeroCard
            label="Сумма в кассе"
            chip="Открыта"
            chipTone="accent"
            amount={18056319}
            tiles={[
              { label: 'Приход', value: 24500000, tone: 'accent', signed: true },
              { label: 'Расход', value: -6443681, tone: 'err' },
            ]}
          />
        </Section>

        <Section title="ListCard" tone="bg">
          <ListCard lead="#127" title="Тухтамишев Санжар" subtitle="Склад 1 · 13:05" amount={18056319} badge={{ label: 'Ожидание', tone: 'warn' }} onPress={() => undefined} />
          <ListCard lead="ТС" title="Тухтамишев Санжар" subtitle="Склад 1 · с 09:00" amount={12506319} badge={{ label: 'Открыта', tone: 'accent' }} highlight onPress={() => undefined} />
          <ListCard lead="АК" title="Алиев Камол" subtitle="2 заказа · платёж 05.10" amount={5400000} amountTone="err" badge={{ label: '29 дней', tone: 'warn' }} />
          <ListCard leading={<PhotoPlaceholder size="md" />} title="Конопка 4м" subtitle="Брус · Сосна, Лесвак" amount={60000} badge={{ label: '12 шт', tone: 'ok' }} />
        </Section>

        <Section title="Формы">
          <FormControl>
            <FormControlLabel><FormControlLabelText>Логин</FormControlLabelText></FormControlLabel>
            <Input size="lg"><InputField placeholder="Латиницей, без пробелов" autoCapitalize="none" /></Input>
          </FormControl>
          <FormControl isRequired>
            <FormControlLabel><FormControlLabelText>Пароль</FormControlLabelText></FormControlLabel>
            <Input size="lg" invalid><InputField placeholder="Не меньше 8 символов" secureTextEntry /></Input>
            <FormControlErrorText>Неверный логин или пароль</FormControlErrorText>
          </FormControl>
          <TextArea placeholder="Например: аренда за октябрь" rows={3} />
        </Section>

        <Section title="EmptyState · оверлеи" tone="bg">
          <EmptyState card icon={Search} message="Ничего не найдено" description="Проверьте название или отсканируйте штрихкод товара" />
          <View className="flex-row gap-2.5">
            <Button variant="secondary" onPress={() => setModalVisible(true)}>Modal</Button>
            <Button variant="secondary" onPress={() => setSheetVisible(true)}>BottomSheet</Button>
          </View>
        </Section>
      </ScrollView>

      <Modal visible={modalVisible} onClose={() => setModalVisible(false)} showCloseButton>
        <View className="gap-3">
          <Text className="type-subhead text-ink">Закрыть кассу?</Text>
          <Text className="type-body text-soft">Итог смены будет сохранён, новые платежи принять будет нельзя.</Text>
          <View className="flex-row gap-2.5 pt-2">
            <Button variant="secondary" className="flex-1" onPress={() => setModalVisible(false)}>Отмена</Button>
            <Button variant="danger" className="flex-1" onPress={() => setModalVisible(false)}>Закрыть</Button>
          </View>
        </View>
      </Modal>

      <BottomSheet isPresented={sheetVisible} onDismiss={() => setSheetVisible(false)} snapPoints={['half']}>
        <View className="flex-1 bg-card p-4 gap-3">
          <Text className="type-subhead text-ink">Изменить цену</Text>
          <Card variant="sunken" className="flex-row items-center justify-between">
            <Text className="type-body-strong text-ink">Количество</Text>
            <Stepper value={lineQty} onChange={setLineQty} />
          </Card>
          <Button variant="accent" size="lg" full onPress={() => setSheetVisible(false)}>Применить</Button>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

function Section({ title, tone = 'card', children }: { title: string; tone?: 'card' | 'bg'; children: React.ReactNode }) {
  return (
    <View className="gap-2.5">
      <Text className="type-label text-muted px-1">{title}</Text>
      <View className={tone === 'card' ? 'bg-card rounded-xl p-4 gap-3' : 'gap-2'}>{children}</View>
    </View>
  );
}
