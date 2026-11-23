import { api } from '@/api/axios-instance';
import {
  ORDER_ASSISTANT_LIMITS,
  type MatchOrderTextInput,
  type MatchOrderTextResponse,
  type OrderAssistantFeedbackInput,
  type OrderAssistantFeedbackResponse,
} from './order-assistant.types';

/** Seller's text → candidate variants per product phrase. Read-only. */
const match = async (input: MatchOrderTextInput): Promise<MatchOrderTextResponse> => {
  const response = await api.post<MatchOrderTextResponse>('/order-assistant/match', input);
  return response.data;
};

/**
 * Reports the seller's choices so the backend can learn aliases. Sent in
 * chunks of 30 (the backend limit per request).
 */
const feedback = async ({ warehouseId, choices }: OrderAssistantFeedbackInput): Promise<void> => {
  for (let i = 0; i < choices.length; i += ORDER_ASSISTANT_LIMITS.PHRASES) {
    await api.post<OrderAssistantFeedbackResponse>('/order-assistant/feedback', {
      warehouseId,
      choices: choices.slice(i, i + ORDER_ASSISTANT_LIMITS.PHRASES),
    });
  }
};

export const orderAssistantService = {
  match,
  feedback,
};
