import { Button, ButtonText } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { ThemeMode, useThemeControl } from '@/hooks/use-theme-control';
import BottomSheet from '@expo/ui/community/bottom-sheet';
import { useMemo, useRef } from 'react';
import { FlatList, useColorScheme } from 'react-native';

export type SelectThemeType = {
  mode: ThemeMode;
  label: string;
}

export const SelectTheme = () => {
  const colorScheme = useColorScheme();
  const { themeMode, setThemeMode } = useThemeControl();

  const THEME_OPTIONS: SelectThemeType[] = useMemo(() => [
    { mode: ThemeMode.AUTO, label: 'Auto' },
    { mode: ThemeMode.LIGHT, label: 'Light' },
    { mode: ThemeMode.DARK, label: 'Dark' },
  ], []);

  const sheetRef = useRef<BottomSheet>(null);

  // Determine background color based on color scheme
  const backgroundColor = colorScheme === 'dark' ? '#18181b' : '#ffffff';

  return (
    <Box className='flex-1'>
      <Button onPress={() => sheetRef.current?.snapToIndex(0)}>
        <ButtonText>Theme</ButtonText>
      </Button>

      <BottomSheet
        backgroundStyle={{ backgroundColor }}
        ref={sheetRef}
        snapPoints={['50%', '90%']}
        index={-1}
        enablePanDownToClose
      >
        <FlatList
          nestedScrollEnabled
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
    </Box>
  );
}

SelectTheme.displayName = 'SelectTheme'