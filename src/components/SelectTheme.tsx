import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { ThemeMode, useThemeControl } from '@/hooks/use-theme-control';
import CustomIcon from '@/icons/custom-icon';
import { IconNames } from '@/icons/icon.type';
import BottomSheet from '@expo/ui/community/bottom-sheet';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, useColorScheme } from 'react-native';
import { HStack } from './ui/hstack';
import { ChevronRightIcon, Icon } from './ui/icon';
import { Pressable } from './ui/pressable';
import { Text } from './ui/text';

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
      <Pressable className="flex flex-row justify-between items-center h-12" onPress={() => sheetRef.current?.snapToIndex(0)}>
        <HStack space="md" className="flex-row items-center">
          <Box className="w-12 h-12 flex items-center justify-center">
            <CustomIcon name={IconNames.SUN} />
          </Box>
          <Text>Theme</Text>
        </HStack>
        <Box>
          <Icon as={ChevronRightIcon} />
        </Box>
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
                <ButtonText>{item.label}</ButtonText>
              </Button>
            );
          }}
        />
      </BottomSheet>
    </>
  );
}

SelectTheme.displayName = 'SelectTheme'