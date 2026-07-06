import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import ru from "./locales/ru";
import uz from "./locales/uz";

export type AppLanguage = 'auto' | 'en' | 'ru' | 'uz';

const LANGUAGE_STORAGE_KEY = 'sthm23_app-language';

const getDeviceLanguage = (): 'en' | 'ru' | 'uz' => {
    const localeLanguage = getLocales()[0]?.languageCode;
    if (localeLanguage === 'en' || localeLanguage === 'ru' || localeLanguage === 'uz') {
        return localeLanguage;
    }
    return 'ru';
};

const initialLanguage = getDeviceLanguage();

const resources = {
    en: {
        translation: en,
    },
    ru: {
        translation: ru,
    },
    uz: {
        translation: uz,
    },
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: initialLanguage,
        fallbackLng: "uz",
        supportedLngs: ['en', 'ru', 'uz'],
        defaultNS: 'translation',
        interpolation: {
            escapeValue: false
        }
    });

export async function getSavedLanguageOption(): Promise<AppLanguage> {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (savedLanguage === 'auto' || savedLanguage === 'en' || savedLanguage === 'ru' || savedLanguage === 'uz') {
        return savedLanguage;
    }

    return 'auto';
}

export async function setAppLanguage(language: AppLanguage): Promise<void> {
    const nextLanguage = language === 'auto' ? getDeviceLanguage() : language;

    await i18n.changeLanguage(nextLanguage);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

void (async () => {
    try {
        const savedLanguage = await getSavedLanguageOption();
        const nextLanguage = savedLanguage === 'auto' ? getDeviceLanguage() : savedLanguage;
        if (i18n.language !== nextLanguage) {
            await i18n.changeLanguage(nextLanguage);
        }
    } catch (error) {
        console.error('Failed to load language setting:', error);
    }
})();

export default i18n;