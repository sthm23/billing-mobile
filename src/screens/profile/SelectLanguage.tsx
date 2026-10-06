import { AppLanguage, getSavedLanguageOption, setAppLanguage } from '@/assets/i18next/i18next';
import { Box, Button, HStack, Pressable, Text } from '@/components/base';
import CustomIcon from '@/icons/custom-icon';
import { IconNames } from '@/icons/icon.type';
import { BottomSheet } from '@expo/ui';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export const SelectLanguage = () => {
  const { t } = useTranslation();
  const [language, setLanguage] = useState<AppLanguage>(AppLanguage.AUTO);
  const [isPresented, setIsPresented] = useState(false);

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
    setIsPresented(false);
  };

  return (
    <>
      <Pressable className="flex flex-row justify-between items-center h-20 border border-border dark:border-border-dark rounded-xl p-4" onPress={() => setIsPresented(true)}>
        <HStack gap={3} className="items-center">
          <Box className="w-10 h-10 flex items-center justify-center rounded-xl border border-border dark:border-border-dark">
            <CustomIcon name={IconNames.LANGUAGE} />
          </Box>
          <Text>{t('profile.language')}</Text>
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
        </ScrollView>
      </BottomSheet>
    </>
  )
}

SelectLanguage.displayName = 'SelectLanguage'