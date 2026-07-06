
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
    const [language, setLanguage] = useState<AppLanguage>('auto');
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
    { value: 'auto', label: 'auto' },
    { value: 'en', label: 'Eng' },
    { value: 'ru', label: 'Rus' },
    { value: 'uz', label: 'Uzb' },
]
  }, []);

  const THEME_OPTIONS: SelectTheme[] = useMemo(()=>[
  { mode: ThemeMode.AUTO, label: 'Автоматически', description: 'Как в системе' },
  { mode: ThemeMode.LIGHT, label: 'Светлая', description: 'Всегда светлая' },
  { mode: ThemeMode.DARK, label: 'Тёмная', description: 'Всегда тёмная' },
], []);


    const onLanguagePress = async (lang: AppLanguage) => {
    setLanguage(lang);
    await setAppLanguage(lang);
  };
  
  return (
    <SafeAreaView edges={['top']} className="flex-1 items-center justify-center bg-surface dark:bg-surface-dark">
        <ThemedView type='surface' className="items-center justify-center">
            <ThemedText type='title'>Profile page</ThemedText>
            <ThemedView type='surface' className="flex-row items-center justify-center gap-2 my-4">
                {
                    LANGUAGE_OPTIONS.map(method => (
                    <Button key={method.value}
                        variant='outline'    
                    onPress={
                            () => void onLanguagePress(method.value as AppLanguage)
                        }
                    >{method.label}</Button>
                    ))
                }
            </ThemedView>
            <ThemedView type='surface' className="my-4">
              {THEME_OPTIONS.map(option => (
              <Button variant='outline'
                key={option.mode}
                                onPress={() => setThemeMode(option.mode)}
              >
                <ThemedView >
                  <ThemedText>{option.label}</ThemedText>
                  <ThemedText>{option.description}</ThemedText>
                </ThemedView>
                {themeMode === option.mode && (
                  <ThemedView>
                    {/* <IconSelect name={{ ios: 'checkmark', android: 'check' }} size={24}  /> */}
                  </ThemedView>
                )}
              </Button>
              ))}
            </ThemedView>
            <Button onPress={handleLogout}>Logout</Button>
        </ThemedView>
    </SafeAreaView>
  )
}

export default Profile