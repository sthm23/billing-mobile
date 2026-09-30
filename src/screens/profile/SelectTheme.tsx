import { Box, Button, HStack, Pressable, Text } from '@/components/base';
import { ThemeMode, useThemeControl } from '@/hooks/use-theme-control';
import CustomIcon from '@/icons/custom-icon';
import { IconNames } from '@/icons/icon.type';
import BottomSheet from '@expo/ui/community/bottom-sheet';
import { ChevronRight } from 'lucide-react-native';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, useColorScheme } from 'react-native';

export type SelectThemeType = {
  mode: ThemeMode;
  label: string;
}

export const SelectTheme = () => {
  const colorScheme = useColorScheme();
  const { themeMode, setThemeMode } = useThemeControl();
  const { t } = useTranslation();

  const THEME_OPTIONS: SelectThemeType[] = useMemo(() => [
    { mode: ThemeMode.AUTO, label: 'Auto' },
    { mode: ThemeMode.LIGHT, label: 'Light' },
    { mode: ThemeMode.DARK, label: 'Dark' },
  ], []);

  const sheetRef = useRef<BottomSheet>(null);

  // Determine background color based on color scheme
  const backgroundColor = colorScheme === 'dark' ? '#18181b' : '#ffffff';

  return (
    <>
      <Pressable className="flex flex-row justify-between items-center h-20 border border-border dark:border-border-dark rounded-xl p-4" onPress={() => sheetRef.current?.snapToIndex(0)}>
        <HStack gap={3} className="items-center">
          <Box className="w-10 h-10 flex items-center justify-center rounded-xl border border-border dark:border-border-dark">
            <CustomIcon name={IconNames.SUN} />
          </Box>
          <Text>Theme</Text>
        </HStack>
        <ChevronRight size={20} className="text-text dark:text-text-dark" />
      </Pressable>

      <BottomSheet
        backgroundStyle={{ backgroundColor }}
        ref={sheetRef}
        snapPoints={['50%', '90%']}
        index={-1}
        enablePanDownToClose
      >
        <FlatList
          scrollEnabled={false}
          style={{ flex: 1 }}
          data={THEME_OPTIONS}
          keyExtractor={item => item.mode}
          contentContainerStyle={{ padding: 24 }}
          renderItem={({ item }) => {
            const isSelected = item.mode === themeMode;
            return (
              <Button
                className='mb-4'
                variant={isSelected ? 'default' : 'outline'}
                onPress={() => setThemeMode(item.mode)}
              >
                {item.label}
              </Button>
            );
          }}
        />
      </BottomSheet>
    </>
  );
}

SelectTheme.displayName = 'SelectTheme'