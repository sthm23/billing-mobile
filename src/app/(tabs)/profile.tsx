
import { AppLanguage, getSavedLanguageOption, setAppLanguage } from '@/assets/i18next/i18next';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/provider/AuthProvider';
import { SelectTheme, ThemeMode, useThemeMode } from '@/provider/ThemeProvider';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';



const Profile = () => {
    const { t } = useTranslation();
    const [language, setLanguage] = useState<AppLanguage>(AppLanguage.AUTO);
    const { themeMode, setThemeMode } = useThemeMode();
    const {logout} = useAuth();



    const handleLogout = () => {
        logout();
    }

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

  const LANGUAGE_OPTIONS = useMemo(()=>{
    return [
    { value: AppLanguage.AUTO, label: 'auto' },
    { value: AppLanguage.EN, label: 'Eng' },
    { value: AppLanguage.RU, label: 'Rus' },
    { value: AppLanguage.UZ, label: 'Uzb' },
]
  }, []);

  const THEME_OPTIONS: SelectTheme[] = useMemo(()=>[
  { mode: ThemeMode.AUTO, label: 'Auto'},
  { mode: ThemeMode.LIGHT, label: 'Light' },
  { mode: ThemeMode.DARK, label: 'Dark' },
], []);


    const onLanguagePress = async (lang: AppLanguage) => {
    await setAppLanguage(lang);
  };
  
  return (
    <SafeAreaView edges={['top']} className="flex-1 items-center justify-center bg-surface dark:bg-surface-dark">
        <ThemedView type='surface' className="items-center justify-center">
            <ThemedText type='title'>Profile page</ThemedText>
            <ThemedText type='subtitle'>Select language</ThemedText>
            <ThemedView type='surface' className="flex-row items-center justify-center gap-2 my-4">
                {LANGUAGE_OPTIONS.map(method => (
                    <Button key={method.value} variant='outline'    
                    onPress={() => void onLanguagePress(method.value)}>{method.label}</Button>
                ))}
            </ThemedView>
            <ThemedText type='subtitle'>Select theme</ThemedText>
            <ThemedView type='surface' className="flex-row items-center justify-center gap-2 my-4">
              {THEME_OPTIONS.map(option => (
              <Button variant='outline' key={option.mode}
              onPress={() => setThemeMode(option.mode)}>{option.label}</Button>
              ))}
            </ThemedView>
            <Button onPress={handleLogout}>Logout</Button>
        </ThemedView>
    </SafeAreaView>
  )
}

export default Profile