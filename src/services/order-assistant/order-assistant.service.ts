import { api } from '@/api/axios-instance';
import { Platform } from 'react-native';
import {
  ORDER_ASSISTANT_LIMITS,
  type TranscribeAudioInput,
  type TranscribeAudioResponse,
  type MatchOrderTextInput,
  type MatchOrderTextResponse,
  type OrderAssistantFeedbackInput,
  type OrderAssistantFeedbackResponse,
} from './order-assistant.types';

/** Backend waits up to 90 s for the STT queue + recognition. */
const TRANSCRIBE_TIMEOUT_MS = 100_000;

/**
 * Seller's recording → text (multipart `audio` + `warehouseId`). A phone
 * sends the file by uri; a browser has a blob: url, so the blob is read first.
 * The instance default is `application/json`, and axios turns FormData into JSON
 * under it (the file is lost) — so the request says multipart; the browser /
 * React Native add the boundary themselves.
 */
const transcribe = async ({ warehouseId, audio }: TranscribeAudioInput): Promise<TranscribeAudioResponse> => {
  const form = new FormData();
  form.append('warehouseId', warehouseId);
  if (Platform.OS === 'web') {
    const blob = await (await fetch(audio.uri)).blob();
    form.append('audio', blob, audio.name);
  } else {
    // React Native's FormData takes a file descriptor object
    form.append('audio', { uri: audio.uri, name: audio.name, type: audio.mimeType } as unknown as Blob);
  }
  const response = await api.post<TranscribeAudioResponse>('/order-assistant/transcribe', form, {
    timeout: TRANSCRIBE_TIMEOUT_MS,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/** Seller's text → candidate variants per product phrase. Read-only. */
const match = async (input: MatchOrderTextInput): Promise<MatchOrderTextResponse> => {
  const response = await api.post<MatchOrderTextResponse>('/order-assistant/match', input);
  return response.data;
};

/**
 * Reports the seller's choices so the backend can learn aliases (and label kept
 * recordings). Sent in chunks of 30 (the backend limit per request); the recordings go
 * with every chunk — the backend appends each chunk's choices to them.
 */
const feedback = async ({ warehouseId, choices, samples }: OrderAssistantFeedbackInput): Promise<void> => {
  for (let i = 0; i < choices.length; i += ORDER_ASSISTANT_LIMITS.PHRASES) {
    await api.post<OrderAssistantFeedbackResponse>('/order-assistant/feedback', {
      warehouseId,
      choices: choices.slice(i, i + ORDER_ASSISTANT_LIMITS.PHRASES),
      ...(samples?.length ? { samples } : {}),
    });
  }
};

export const orderAssistantService = {
  transcribe,
  match,
  feedback,
};
