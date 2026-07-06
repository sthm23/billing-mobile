import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import ru from "./locales/ru";
import uz from "./locales/uz";

export enum AppLanguage {
    AUTO = 'auto',
    EN = 'en',
    RU = 'ru',
    UZ = 'uz'
};

const LANGUAGE_STORAGE_KEY = 'sthm23_app-language';

const getDeviceLanguage = (): AppLanguage => {
    const localeLanguage = getLocales()[0]?.languageCode as AppLanguage | undefined;
    if (localeLanguage === AppLanguage.EN || localeLanguage === AppLanguage.RU || localeLanguage === AppLanguage.UZ) {
        return localeLanguage as AppLanguage;
    }
    return AppLanguage.RU;
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
        fallbackLng: AppLanguage.UZ,
        supportedLngs: [AppLanguage.EN, AppLanguage.RU, AppLanguage.UZ],
        defaultNS: 'translation',
        interpolation: {
            escapeValue: false
        }
    });

export async function getSavedLanguageOption(): Promise<AppLanguage> {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY) as AppLanguage | null;

    if (savedLanguage === AppLanguage.AUTO || savedLanguage === AppLanguage.EN || savedLanguage === AppLanguage.RU || savedLanguage === AppLanguage.UZ) {
        return savedLanguage;
    }

    return AppLanguage.AUTO;
}

export async function setAppLanguage(language: AppLanguage): Promise<void> {
    const nextLanguage = language === AppLanguage.AUTO ? getDeviceLanguage() : language;

    await i18n.changeLanguage(nextLanguage);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

void (async () => {
    try {
        const savedLanguage = await getSavedLanguageOption();
        const nextLanguage = savedLanguage === AppLanguage.AUTO ? getDeviceLanguage() : savedLanguage;
        if (i18n.language !== nextLanguage) {
            await i18n.changeLanguage(nextLanguage);
        }
    } catch (error) {
        console.error('Failed to load language setting:', error);
    }
})();

export default i18n;