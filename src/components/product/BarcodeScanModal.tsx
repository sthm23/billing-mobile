import { Button, IconButton, Text } from '@/components/base';
import { useTheme } from '@/hooks/use-theme';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Camera, Flashlight, FlashlightOff, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Modal, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Retail label formats; a product barcode is digits only */
const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e', 'itf14', 'code128'] as const;
const DIGITS = /^\d{8,14}$/;

interface BarcodeScanModalProps {
  isOpen: boolean;
  /** «Для варианта M · Белый» */
  subtitle?: string;
  onClose: () => void;
  /** First valid code (8–14 digits); the modal closes itself */
  onScanned: (code: string) => void;
}

/**
 * Full-screen barcode scanner of the product form (design «ProductScan»):
 * fills one variant's barcode. «Ввести вручную» closes it back to the field.
 */
export function BarcodeScanModal({ isOpen, subtitle, onClose, onScanned }: BarcodeScanModalProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [invalid, setInvalid] = useState<string | null>(null);
  const done = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    done.current = false;
    setInvalid(null);
    setTorch(false);
  }, [isOpen]);

  const handleScan = ({ data }: BarcodeScanningResult) => {
    const code = data.trim();
    if (done.current || !code) return;
    if (!DIGITS.test(code)) {
      setInvalid(code);
      return;
    }
    done.current = true;
    onScanned(code);
    onClose();
  };

  return (
    <Modal visible={isOpen} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View className="flex-1 bg-hero">
        {permission?.granted ? (
          <CameraView
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
            facing="back"
            enableTorch={torch}
            barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
            onBarcodeScanned={isOpen ? handleScan : undefined}
          />
        ) : null}

        <View className="flex-row items-center gap-3 px-4" style={{ paddingTop: insets.top + 8 }}>
          <IconButton icon={X} variant="hero" accessibilityLabel={t('common.close')} onPress={onClose} />
          <View className="flex-1 min-w-0">
            <Text className="font-onest-bold text-[17px] text-hero-ink" accessibilityRole="header">
              {t('productVariants.scan.title')}
            </Text>
            {subtitle ? (
              <Text className="font-onest text-[13px] text-hero-muted" numberOfLines={1}>{subtitle}</Text>
            ) : null}
          </View>
          {permission?.granted ? (
            <IconButton
              icon={torch ? FlashlightOff : Flashlight}
              variant="hero"
              accessibilityLabel={torch ? t('sale.scan.torchOff') : t('sale.scan.torchOn')}
              onPress={() => setTorch((v) => !v)}
            />
          ) : null}
        </View>

        {permission && !permission.granted ? (
          <View className="flex-1 items-center justify-center gap-4 px-8">
            <View className="w-16 h-16 rounded-full bg-hero-sub items-center justify-center">
              <Camera size={28} color={colors.heroInk} strokeWidth={1.75} />
            </View>
            <Text className="font-onest-bold text-lg text-hero-ink text-center">{t('sale.scan.permissionTitle')}</Text>
            <Text className="font-onest text-[13px] leading-[19px] text-hero-muted text-center">
              {t('sale.scan.permissionText')}
            </Text>
            {permission.canAskAgain ? (
              <Button variant="accent" onPress={requestPermission}>{t('sale.scan.allow')}</Button>
            ) : (
              <Button variant="accent" onPress={() => Linking.openSettings()}>{t('sale.scan.openSettings')}</Button>
            )}
          </View>
        ) : (
          <View className="flex-1 items-center justify-center" pointerEvents="none">
            <View className="w-[78%] h-44 rounded-3xl border-[3px] border-accent" />
          </View>
        )}

        <View className="px-4 gap-3 items-center" style={{ paddingBottom: insets.bottom + 24 }}>
          <Text className="font-onest text-sm text-hero-muted text-center">
            {invalid ? t('productVariants.scan.invalid', { code: invalid }) : t('productVariants.scan.hint')}
          </Text>
          <Button variant="hero" size="lg" full onPress={onClose}>
            {t('productVariants.scan.manual')}
          </Button>
        </View>
      </View>
    </Modal>
  );
}
