import { useMutation } from '@tanstack/react-query';
import { orderAssistantService } from './order-assistant.service';

/**
 * `POST /order-assistant/match` as a mutation: it runs on the seller's
 * «Найти» / «Искать заново», never on its own, and nothing is cached.
 */
export const useMatchOrderText = () =>
  useMutation({
    mutationFn: orderAssistantService.match,
  });

/** `POST /order-assistant/feedback` — fire-and-forget; a failure never blocks the cart. */
export const useOrderAssistantFeedback = () =>
  useMutation({
    mutationFn: orderAssistantService.feedback,
    retry: false,
  });

/** `POST /order-assistant/transcribe` — no retry: the seller taps «Повторить» (the recording is kept). */
export const useTranscribeAudio = () =>
  useMutation({
    mutationFn: orderAssistantService.transcribe,
    retry: false,
  });
