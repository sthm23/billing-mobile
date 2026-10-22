import { useIsDarkMode } from '@/hooks/use-theme';
import { SvgXml } from 'react-native-svg';
import { APP_ICON, LOGO_HORIZONTAL, LOGO_HORIZONTAL_ON_DARK } from './logo-sources';

const HORIZONTAL_RATIO = 240 / 858;

export interface LogoProps {
  /**
   * `horizontal` — mark + STHM wordmark; `icon` — app icon tile (small sizes, splash)
   */
  variant?: 'horizontal' | 'icon';
  /**
   * Width in px (height follows the logo's proportions)
   */
  width: number;
  /**
   * Force the on-dark version (e.g. on a `hero` block). Default: follows the color scheme.
   */
  onDark?: boolean;
  accessibilityLabel?: string;
}

/**
 * Logo — STHM brand mark rendered from the official SVGs (assets/brand)
 *
 * Never redraw, recolor or stretch the logo. The tile mark needs ≥ 32px;
 * smaller sizes use `variant="icon"`.
 *
 * @example
 * <Logo width={220} onDark />
 * <Logo variant="icon" width={112} />
 */
export function Logo({ variant = 'horizontal', width, onDark, accessibilityLabel = 'STHM' }: LogoProps) {
  const isDarkScheme = useIsDarkMode();

  if (variant === 'icon') {
    return <SvgXml xml={APP_ICON} width={width} height={width} accessibilityLabel={accessibilityLabel} />;
  }

  const dark = onDark ?? isDarkScheme;

  return (
    <SvgXml
      xml={dark ? LOGO_HORIZONTAL_ON_DARK : LOGO_HORIZONTAL}
      width={width}
      height={width * HORIZONTAL_RATIO}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
