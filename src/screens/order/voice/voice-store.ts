import type {
  FeedbackChoice,
  FeedbackSource,
  MatchCandidate,
  MatchLine,
  MatchStatus,
} from '@/services/order-assistant';
import { ORDER_ASSISTANT_LIMITS } from '@/services/order-assistant';
import type { OrderProductVariant } from '@/services/order/order.type';
import { useSyncExternalStore } from 'react';
import type { CartLine } from '../cart/cart-store';

/**
 * One product phrase on the review screen. `selected` is the variant that
 * goes to the cart; `source` says how the seller got it (feedback learning).
 */
export interface VoiceRow {
  key: string;
  phrase: string;
  status: MatchStatus;
  candidates: MatchCandidate[];
  totalCandidates: number;
  selected: MatchCandidate | null;
  source: FeedbackSource | null;
}

export interface VoiceState {
  warehouseId?: string;
  /** Text the rows were matched from; editable before «Искать заново» */
  transcript: string;
  rows: VoiceRow[];
}

/** Why a row with a variant still does not reach the cart (cart-store rules). */
export type RowSkip = 'outOfStock' | 'maxReached';

const EMPTY: VoiceState = { transcript: '', rows: [] };

let state: VoiceState = EMPTY;
let nextKey = 0;
const listeners = new Set<() => void>();

function setState(next: VoiceState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function updateRow(key: string, patch: Partial<VoiceRow>) {
  setState({ ...state, rows: state.rows.map((r) => (r.key === key ? { ...r, ...patch } : r)) });
}

function toRow(line: MatchLine): VoiceRow {
  const matched = line.status === 'MATCHED' && line.candidates.length > 0;
  return {
    key: `r${nextKey++}`,
    phrase: line.phrase,
    status: line.status,
    candidates: line.candidates,
    totalCandidates: line.totalCandidates,
    selected: matched ? line.candidates[0] : null,
    source: matched ? 'ACCEPTED' : null,
  };
}

/** A variant picked in the product search, in the shape of a candidate. */
function candidateFromVariant(variant: OrderProductVariant): MatchCandidate {
  return {
    variantId: variant.id,
    productId: variant.productId,
    productName: variant.productName,
    sku: variant.sku,
    barCode: variant.barCode,
    price: String(variant.price),
    stock: variant.quantity,
    attributes: variant.attributes.map((a) => ({ name: a.name, nameUz: null, nameEn: null, value: a.value })),
    score: 1,
  };
}

export const voiceStore = {
  get: () => state,

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /** New assistant session for the cart's warehouse. */
  start(warehouseId: string, transcript: string) {
    setState({ warehouseId, transcript, rows: [] });
  },

  setTranscript(transcript: string) {
    setState({ ...state, transcript });
  },

  /** Rows of a new search (`append` — «Ещё»: added after the current ones). */
  setLines(lines: MatchLine[], append = false) {
    const rows = lines.map(toRow);
    setState({ ...state, rows: append ? [...state.rows, ...rows] : rows });
  },

  /** Seller picked one of the candidates. */
  pick(key: string, variantId: string) {
    const row = state.rows.find((r) => r.key === key);
    const candidate = row?.candidates.find((c) => c.variantId === variantId);
    if (!row || !candidate) return;
    const source: FeedbackSource =
      row.status === 'MATCHED'
        ? candidate.variantId === row.candidates[0]?.variantId
          ? 'ACCEPTED'
          : 'CHANGED'
        : 'PICKED';
    updateRow(key, { selected: candidate, source });
  },

  /** Variant found in the product search («Найти вручную»). */
  setManual(key: string, variant: OrderProductVariant) {
    updateRow(key, { selected: candidateFromVariant(variant), source: 'MANUAL' });
  },

  remove(key: string) {
    setState({ ...state, rows: state.rows.filter((r) => r.key !== key) });
  },

  clear() {
    setState(EMPTY);
  },
};

export function useVoice(): VoiceState {
  return useSyncExternalStore(voiceStore.subscribe, voiceStore.get, voiceStore.get);
}

/**
 * Which rows with a chosen variant would be rejected by the cart: stock 0,
 * or more units than in stock counting the cart and the rows above
 * (each row adds one unit — `cartStore.addVariant` rules).
 */
export function rowSkips(rows: VoiceRow[], cartLines: CartLine[]): Map<string, RowSkip> {
  const skips = new Map<string, RowSkip>();
  const planned = new Map<string, number>();
  for (const row of rows) {
    const variant = row.selected;
    if (!variant) continue;
    if (variant.stock <= 0) {
      skips.set(row.key, 'outOfStock');
      continue;
    }
    const inCart = cartLines.find((l) => l.variantId === variant.variantId)?.quantity ?? 0;
    const units = inCart + (planned.get(variant.variantId) ?? 0) + 1;
    if (units > variant.stock) {
      skips.set(row.key, 'maxReached');
      continue;
    }
    planned.set(variant.variantId, (planned.get(variant.variantId) ?? 0) + 1);
  }
  return skips;
}

/** The candidate as the cart's search result (`cartStore.addVariant`). */
export function toOrderVariant(c: MatchCandidate): OrderProductVariant {
  return {
    id: c.variantId,
    barCode: c.barCode,
    price: c.price,
    quantity: c.stock,
    sku: c.sku,
    productId: c.productId,
    productName: c.productName,
    attributes: c.attributes.map((a) => ({ name: a.name, value: a.value })),
    stockMovements: [],
  };
}

/** Feedback for every row the seller settled (phrases over the backend limit are skipped). */
export function feedbackChoices(rows: VoiceRow[]): FeedbackChoice[] {
  return rows.flatMap((r) =>
    r.selected && r.source && r.phrase.length <= ORDER_ASSISTANT_LIMITS.PHRASE_LENGTH
      ? [{ phrase: r.phrase, variantId: r.selected.variantId, source: r.source }]
      : []
  );
}
