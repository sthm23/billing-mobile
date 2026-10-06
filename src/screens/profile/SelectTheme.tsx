import { Box, Button, HStack, Pressable, Text } from '@/components/base';
import { ThemeMode, useThemeControl } from '@/hooks/use-theme-control';
import CustomIcon from '@/icons/custom-icon';
import { IconNames } from '@/icons/icon.type';
import { BottomSheet } from '@expo/ui';
import { ChevronRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, ScrollView } from 'react-native';

export type SelectThemeType = {
  mode: ThemeMode;
  label: string;
}

export const SelectTheme = () => {
  const { themeMode, setThemeMode } = useThemeControl();
  const { t } = useTranslation();
  const [isPresented, setIsPresented] = useState(false);

  const THEME_OPTIONS: SelectThemeType[] = useMemo(() => [
    { mode: ThemeMode.AUTO, label: t('profile.themeAuto') },
    { mode: ThemeMode.LIGHT, label: t('profile.themeLight') },
    { mode: ThemeMode.DARK, label: t('profile.themeDark') },
  ], [t]);

  const handleThemeSelect = (mode: ThemeMode) => {
    setThemeMode(mode);
    setIsPresented(false);
  };

  return (
    <>
      <Pressable className="flex flex-row justify-between items-center h-20 border border-border dark:border-border-dark rounded-xl p-4" onPress={() => setIsPresented(true)}>
        <HStack gap={3} className="items-center">
          <Box className="w-10 h-10 flex items-center justify-center rounded-xl border border-border dark:border-border-dark">
            <CustomIcon name={IconNames.SUN} />
          </Box>
          <Text>{t('profile.theme')}</Text>
        </HStack>
        <ChevronRight size={20} className="text-text dark:text-text-dark" />
      </Pressable>

      <BottomSheet
        isPresented={isPresented}
        onDismiss={() => setIsPresented(false)}
        snapPoints={[{ fraction: 0.5 }, { fraction: 0.9 }]}
      >
        <ScrollView style={{ flex: 1 }}>
          <FlatList
            scrollEnabled={false}
            data={THEME_OPTIONS}
            keyExtractor={item => item.mode}
            contentContainerStyle={{ padding: 24 }}
            renderItem={({ item }) => {
              const isSelected = item.mode === themeMode;
              return (
                <Button
                  className='mb-4'
                  variant={isSelected ? 'default' : 'outline'}
                  onPress={() => handleThemeSelect(item.mode)}
                >
                  {item.label}
                </Button>
              );
            }}
          />
        </ScrollView>
      </BottomSheet>
    </>
  );
}

SelectTheme.displayName = 'SelectTheme'