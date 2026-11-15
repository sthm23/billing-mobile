import { isAxiosError } from 'axios';

/**
 * Message of a failed API call: the backend `message` (string or validation
 * list), otherwise the given fallback.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join('\n');
    if (typeof message === 'string' && message.trim()) return message;
  }

  return fallback;
}
