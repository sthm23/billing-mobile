import { AppLanguage, getSavedLanguageOption, setAppLanguage } from "@/assets/i18next/i18next";
import { Segmented, Text } from "@/components/base";
import { ThemeMode, useThemeControl } from "@/hooks/use-theme-control";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

/**
 * Settings card: theme and language, applied immediately.
 */
const SettingItems = () => {
    const { t } = useTranslation();
    const { themeMode, setThemeMode } = useThemeControl();
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

    const handleLanguageChange = async (lang: AppLanguage) => {
        setLanguage(lang);
        await setAppLanguage(lang);
    };

    return (
        <View className="bg-card rounded-xl p-4 gap-4">
            <View className="gap-2.5">
                <Text className="type-label text-soft">{t('profile.theme')}</Text>
                <Segmented
                    options={[
                        { value: ThemeMode.LIGHT, label: t('profile.themeLight') },
                        { value: ThemeMode.DARK, label: t('profile.themeDark') },
                        { value: ThemeMode.AUTO, label: t('profile.themeAuto') },
                    ]}
                    value={themeMode}
                    onChange={setThemeMode}
                />
            </View>
            <View className="gap-2.5">
                <Text className="type-label text-soft">{t('profile.language')}</Text>
                <Segmented
                    options={[
                        { value: AppLanguage.RU, label: t('profile.langRu') },
                        { value: AppLanguage.UZ, label: t('profile.langUz') },
                        { value: AppLanguage.EN, label: t('profile.langEn') },
                        { value: AppLanguage.AUTO, label: t('profile.langAuto') },
                    ]}
                    value={language}
                    onChange={handleLanguageChange}
                />
            </View>
        </View>
    );
};

export default SettingItems
