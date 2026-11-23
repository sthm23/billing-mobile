/** Store flag error: the platform admin has not switched the assistant on (403). */
export const ORDER_ASSISTANT_DISABLED = 'ORDER_ASSISTANT_DISABLED';

/** Backend limits (`billing/src/order-assistant/order-assistant.constants.ts`). */
export const ORDER_ASSISTANT_LIMITS = {
  TEXT_LENGTH: 2000,
  PHRASES: 30,
  PHRASE_LENGTH: 200,
} as const;

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

/** `POST /order-assistant/feedback` */
export interface OrderAssistantFeedbackInput {
  warehouseId: string;
  /** 1–30 per request */
  choices: FeedbackChoice[];
}

export interface OrderAssistantFeedbackResponse {
  learned: number;
  reinforced: number;
}
