import { HStack } from '@/components/ui/hstack';
import { ChevronRightIcon, Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import CustomIcon from '@/icons/custom-icon';
import { IconNames } from '@/icons/icon.type';

import { AppLanguage, getSavedLanguageOption, setAppLanguage } from '@/assets/i18next/i18next';
import { Box } from '@/components/ui/box';
import BottomSheet from '@expo/ui/community/bottom-sheet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, useColorScheme } from 'react-native';
import { Button, ButtonText } from '../../components/ui/button';

export const SelectLanguage = () => {
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
    <>
      <Pressable className="flex flex-row justify-between items-center h-20 border border-gray-300 rounded-xl p-4" onPress={() => sheetRef.current?.snapToIndex(0)}>
        <HStack space="md" className="flex-row items-center">
          <Box className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-300">
            <CustomIcon name={IconNames.LANGUAGE} />
          </Box>
          <Text>Language</Text>
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
    </>
  )
}

SelectLanguage.displayName = 'SelectLanguage'