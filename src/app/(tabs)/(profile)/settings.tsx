import { Box, Heading } from "@/components/base";
import { useTranslation } from "react-i18next";
import {
  SafeAreaView
} from "react-native-safe-area-context";

export default function SettingsScreen() {
  const { t } = useTranslation();
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
    <SafeAreaView edges={['top']} className="flex-1 items-center justify-center bg-background">
      <Box>
        <Heading level={1}>{t('profile.settings')}</Heading>
      </Box>
    </SafeAreaView>
  );
}