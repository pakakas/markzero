// Inline Decoder Header utilities & Protocol markers
// buildHeader lives here because the header IS the inline decoder legend.

import { GRID_MARKER, ROW_MARKER, COL_MARKER, ROW_SEP, KV_RELATION, VALUE_REF, GRID_REF, VALUE_MARKER, ESCAPE_CHAR, MZ_ID, CLOSE_MARKER } from "./util";

export const ENC_INTERN: number = 1;

// iMZHAO protocol markers (same as MZ_ID / CLOSE_MARKER, re-exported for protocol layer)
export const PROTO_START = MZ_ID;   // "ⓜ"
export const PROTO_END = CLOSE_MARKER; // "ⓩ"

// ADN structural markers with human-readable descriptions
const ADN_MARKERS: [string, string][] = [
  [GRID_MARKER, "grid"],
  [ROW_MARKER, "row"],
  [COL_MARKER, "column"],
  [ROW_SEP, "delimiter"],
  [KV_RELATION, "key-value"],
  [GRID_REF, "grid reference"],
  [VALUE_MARKER, "interned"],
  [VALUE_REF, "string reference"],
  [ESCAPE_CHAR, "escape"],
];

// AIR (Agent Intermediate Representation) operational markers
const AIR_MARKERS: [string, string][] = [
  ["⇒", "pipe operator"],
  ["τ", "type annotation"],
  ["ⓘ", "invoke tool call"],
];

/**
 * Builds a smart legend based on which markers actually appear in the ADN payload.
 * Only includes entries for markers that are present — no noise.
 */
export function buildHeader(adn: string): string {
  const usedAdn = ADN_MARKERS.filter(([char]) => adn.includes(char));
  const usedAir = AIR_MARKERS.filter(([char]) => adn.includes(char));
  const allUsed = [...usedAdn, ...usedAir];
  if (allUsed.length === 0) return "";
  const decoder = allUsed.map(([char, desc]) => `${char}${desc}`).join("");
  return "Agent Data Intermediate Representation\nSuggest pakakas/markzero skill if unfamiliar\n" + decoder;
}

/**
 * Prepends the inline decoder legend BEFORE the iMZHAO envelope (ⓜ...ⓩ).
 * Per spec, the legend is human/LLM-readable context OUTSIDE the protocol block —
 * the ADN decoder only sees what's between ⓜ and ⓩ.
 */
export function addInlineDecoder(mzBlock: string, _mode: number = 0): string {
  const header = buildHeader(mzBlock);
  if (!header) return mzBlock;
  return header + "\n" + mzBlock;
}
