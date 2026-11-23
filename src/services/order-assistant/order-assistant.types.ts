/** Store flag error: the platform admin has not switched the assistant on (403). */
export const ORDER_ASSISTANT_DISABLED = 'ORDER_ASSISTANT_DISABLED';

/** Backend limits (`billing/src/order-assistant/order-assistant.constants.ts`). */
export const ORDER_ASSISTANT_LIMITS = {
  TEXT_LENGTH: 2000,
  PHRASES: 30,
  PHRASE_LENGTH: 200,
  /** Kept recordings reported in one `feedback` */
  SAMPLES: 10,
} as const;

/** 422 from `transcribe`: silence or noise, nothing recognized. */
export const SPEECH_NOT_RECOGNIZED = 'SPEECH_NOT_RECOGNIZED';

/** Recording limit of the voice tab (the STT service accepts up to 65 s). */
export const VOICE_MAX_MS = 60_000;

/** A finished recording kept on the device until `transcribe` succeeds. */
export interface RecordedAudio {
  /** file:// on a phone, blob: in a browser */
  uri: string;
  mimeType: string;
  name: string;
  durationMs: number;
}

export interface TranscribeAudioInput {
  warehouseId: string;
  audio: RecordedAudio;
}

export interface TranscribeAudioResponse {
  text: string;
  durationMs: number;
  /** Saved voice sample (stage 4, with the store's consent); null for now */
  sampleId: string | null;
}

export type MatchStatus = 'MATCHED' | 'AMBIGUOUS' | 'NOT_FOUND';

/** One sellable variant the phrase may mean; `price` is a decimal string. */
export interface MatchCandidate {
  variantId: string;
  productId: string;
  productName: string;
  sku: string;
  barCode: string | null;
  price: string;
  /** Stock in the warehouse (hint only; 0 is returned too) */
  stock: number;
  attributes: { name: string; nameUz: string | null; nameEn: string | null; value: string | null }[];
  score: number;
}

export interface MatchLine {
  /** The seller's words for one product */
  phrase: string;
  status: MatchStatus;
  /** Best first, ≤ 5; MATCHED → [0] is the pick */
  candidates: MatchCandidate[];
  /** All variants that fit (more than `candidates` → offer manual search) */
  totalCandidates: number;
}

/** `POST /order-assistant/match` */
export interface MatchOrderTextInput {
  warehouseId: string;
  text: string;
}

export interface MatchOrderTextResponse {
  lines: MatchLine[];
}

/**
 * How the seller settled a line: `ACCEPTED` kept the assistant's pick,
 * `PICKED` chose among ambiguous candidates, `CHANGED` replaced the pick,
 * `MANUAL` found the product in the search.
 */
export type FeedbackSource = 'PICKED' | 'CHANGED' | 'MANUAL' | 'ACCEPTED';

export interface FeedbackChoice {
  phrase: string;
  variantId: string;
  source: FeedbackSource;
}

/** A kept recording of the session (`transcribe` → `sampleId`). */
export interface FeedbackSample {
  sampleId: string;
  /** Review text after the seller's corrections — only when it is this recording's text */
  transcriptFinal?: string;
}

/** `POST /order-assistant/feedback` */
export interface OrderAssistantFeedbackInput {
  warehouseId: string;
  /** 1–30 per request */
  choices: FeedbackChoice[];
  /** Up to 10; sent with every chunk of choices (the backend appends them) */
  samples?: FeedbackSample[];
}

export interface OrderAssistantFeedbackResponse {
  learned: number;
  reinforced: number;
  labeled: number;
}
