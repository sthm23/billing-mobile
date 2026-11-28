import type { StatusTone } from '@/components/base';
import { getApiErrorMessage } from '@/libs/api-error';
import { formatDate, formatTime } from '@/libs/date';
import {
  INSUFFICIENT_STOCK,
  ITEMS_UNAVAILABLE,
  ONLINE_ORDER_ALREADY_HANDLED,
  type ConfirmErrorBody,
  type OnlineOrderStatus,
  type StockShortage,
} from '@/services/telegram-shop';
import { isAxiosError } from 'axios';
import type { TFunction } from 'i18next';

const STATUS_TONE: Record<OnlineOrderStatus, StatusTone> = {
  NEW: 'warn',
  CONFIRMED: 'ok',
  REJECTED: 'neutral',
};

/** Badge of a request: «Новая» (needs attention), «Принята», «Отклонена». */
export function statusBadge(status: OnlineOrderStatus, t: TFunction): { label: string; tone: StatusTone } {
  return { label: t(`onlineOrders.status${status}`), tone: STATUS_TONE[status] };
}

/** «27.11.2026 14:05» */
export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} ${formatTime(iso)}`;
}

/** `tel:` link of a phone typed in any format. */
export function telUrl(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

/** «Strapela 6: нужно 2, есть 1» */
export function shortageText(line: Partial<StockShortage>, t: TFunction): string {
  return t('onlineOrders.shortage', {
    label: line.label ?? '',
    requested: line.requested ?? 0,
    available: line.available ?? 0,
  });
}

/** What kind of failure the confirm call reported (UX only: the backend decided). */
export type ConfirmFailure = 'already-handled' | 'stock' | 'items' | 'other';

export function confirmErrorBody(error: unknown): ConfirmErrorBody | undefined {
  return isAxiosError<ConfirmErrorBody>(error) ? error.response?.data : undefined;
}

export function confirmFailure(error: unknown): ConfirmFailure {
  switch (confirmErrorBody(error)?.code) {
    case ONLINE_ORDER_ALREADY_HANDLED:
      return 'already-handled';
    case INSUFFICIENT_STOCK:
      return 'stock';
    case ITEMS_UNAVAILABLE:
      return 'items';
    default:
      return 'other';
  }
}

/** Message under the confirm button: what is missing, or the backend's own text. */
export function confirmErrorMessage(error: unknown, t: TFunction): string {
  const body = confirmErrorBody(error);
  const failure = confirmFailure(error);
  if (failure === 'already-handled') return t('onlineOrders.alreadyHandled');
  if (failure === 'stock' && body?.lines?.length) {
    return [t('onlineOrders.stockFailed'), ...body.lines.map((line) => shortageText(line, t))].join('\n');
  }

  return getApiErrorMessage(error, t('onlineOrders.confirmFailed'));
}
