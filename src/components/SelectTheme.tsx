import { Button, ButtonText } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { SelectThemeType, ThemeMode, useThemeMode } from '@/provider/ThemeProvider';
import BottomSheet from '@expo/ui/community/bottom-sheet';
import { useMemo, useRef } from 'react';
import { FlatList } from 'react-native';
import { ThemedView } from './themed-view';


export const SelectTheme = () => {
  const color = useTheme()
  const { themeMode, setThemeMode } = useThemeMode();

  const THEME_OPTIONS: SelectThemeType[] = useMemo(() => [
    { mode: ThemeMode.AUTO, label: 'Auto' },
    { mode: ThemeMode.LIGHT, label: 'Light' },
    { mode: ThemeMode.DARK, label: 'Dark' },
  ], []);

  const sheetRef = useRef<BottomSheet>(null);

  return (
    <ThemedView className='flex-1'>
      <Button onPress={() => sheetRef.current?.snapToIndex(0)}><ButtonText>Theme</ButtonText></Button>

      <BottomSheet
        backgroundStyle={{ backgroundColor: color.background }}
        ref={sheetRef} snapPoints={['50%', '90%']} index={-1} enablePanDownToClose>
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
    </ThemedView>
  );
}

SelectTheme.displayName = 'SelectTheme'