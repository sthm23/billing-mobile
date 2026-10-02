import { AppLanguage, getSavedLanguageOption, setAppLanguage } from '@/assets/i18next/i18next';
import { Box, Button, HStack, Pressable, Text } from '@/components/base';
import CustomIcon from '@/icons/custom-icon';
import { IconNames } from '@/icons/icon.type';
import BottomSheet from '@expo/ui/community/bottom-sheet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, useColorScheme } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export const SelectLanguage = () => {
  const { t } = useTranslation();
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
      { value: AppLanguage.AUTO, label: t('profile.langAuto') },
      { value: AppLanguage.EN, label: t('profile.langEn') },
      { value: AppLanguage.RU, label: t('profile.langRu') },
      { value: AppLanguage.UZ, label: t('profile.langUz') },
    ]
  }, [t]);

  const onLanguagePress = async (lang: AppLanguage) => {
    await setAppLanguage(lang);
    setLanguage(lang);
  };

  const sheetRef = useRef<BottomSheet>(null);

  // Determine background color based on color scheme
  const backgroundColor = colorScheme === 'dark' ? '#18181b' : '#ffffff';

  return (
    <>
      <Pressable className="flex flex-row justify-between items-center h-20 border border-border dark:border-border-dark rounded-xl p-4" onPress={() => sheetRef.current?.snapToIndex(0)}>
        <HStack gap={3} className="items-center">
          <Box className="w-10 h-10 flex items-center justify-center rounded-xl border border-border dark:border-border-dark">
            <CustomIcon name={IconNames.LANGUAGE} />
          </Box>
          <Text>{t('profile.language')}</Text>
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
                {item.label}
              </Button>
            );
          }}
        />
      </BottomSheet>
    </>
  )
}

SelectLanguage.displayName = 'SelectLanguage'