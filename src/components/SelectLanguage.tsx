

import { AppLanguage, getSavedLanguageOption, setAppLanguage } from '@/assets/i18next/i18next';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from './ui/button';
import BottomSheet from '@expo/ui/community/bottom-sheet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, useColorScheme } from 'react-native';

const SelectLanguage = () => {
  const colorScheme = useColorScheme();
  const [language, setLanguage] = useState<AppLanguage>(AppLanguage.AUTO);

  useEffect(() => {
    let isMounted = true;

    const loadLanguage = async () => {
      const savedLanguage = await getSavedLanguageOption();
      if (isMounted) {
        setLanguage(savedLanguage);
      }
    };

    void loadLanguage();

    return () => {
      isMounted = false;
    };
  }, []);

  const LANGUAGE_OPTIONS = useMemo(() => {
    return [
      { value: AppLanguage.AUTO, label: 'auto' },
      { value: AppLanguage.EN, label: 'Eng' },
      { value: AppLanguage.RU, label: 'Rus' },
      { value: AppLanguage.UZ, label: 'Uzb' },
    ]
  }, []);

  const onLanguagePress = async (lang: AppLanguage) => {
    await setAppLanguage(lang);
    setLanguage(lang);
  };

  const sheetRef = useRef<BottomSheet>(null);

  // Determine background color based on color scheme
  const backgroundColor = colorScheme === 'dark' ? '#18181b' : '#ffffff';

  return (
    <Box className='flex-1'>
      <Button onPress={() => sheetRef.current?.snapToIndex(0)}>
        <ButtonText>Language</ButtonText>
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
          data={LANGUAGE_OPTIONS}
          keyExtractor={item => item.label}
          contentContainerStyle={{ padding: 24 }}
          renderItem={({ item }) => {
            const isSelected = item.value === language;
            return (
              <Button
                className='mb-4'
                variant={isSelected ? 'default' : 'outline'}
                onPress={async () => await onLanguagePress(item.value)}
              >
                <ButtonText>{item.label}</ButtonText>
              </Button>
            );
          }}
        />
      </BottomSheet>
    </Box>
  )
}

export default SelectLanguage