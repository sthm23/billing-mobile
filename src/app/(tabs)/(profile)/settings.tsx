import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
// import { AppLanguage, getSavedLanguageOption, setAppLanguage } from '@/i18next/i18next';
// import { useEffect, useState } from 'react';
import {
  SafeAreaView
} from 'react-native-safe-area-context';
type ThemeMode = 'light' | 'dark' | 'auto';

const THEME_OPTIONS: { mode: ThemeMode; label: string; description: string }[] = [
  { mode: 'auto', label: 'Автоматически', description: 'Как в системе' },
  { mode: 'light', label: 'Светлая', description: 'Всегда светлая' },
  { mode: 'dark', label: 'Тёмная', description: 'Всегда тёмная' },
];

const LANGUAGE_OPTIONS = [
  { value: 'auto', label: 'Автоматически' },
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
  { value: 'uz', label: 'O‘zbekcha' },
];

export default function SettingsScreen() {
  // const [language, setLanguage] = useState<AppLanguage>('auto');

  // useEffect(() => {
  //   let isMounted = true;

  //   const loadLanguage = async () => {
  //     const savedLanguage = await getSavedLanguageOption();
  //     if (isMounted) {
  //       setLanguage(savedLanguage);
  //     }
  //   };

  //   void loadLanguage();

  //   return () => {
  //     isMounted = false;
  //   };
  // }, []);

  // const onLanguagePress = async (lang: AppLanguage) => {
  //   setLanguage(lang);
  //   await setAppLanguage(lang);
  // };

  

  return (
    <SafeAreaView edges={['top']} className="flex-1 items-center justify-center bg-surface dark:bg-surface-dark">
        <ThemedView type='surface'>
            <ThemedText type='title'>Setting page</ThemedText>
        </ThemedView>
    </SafeAreaView>
  );
}