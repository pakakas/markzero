export const PROTO_START = "М"; // CYRILLIC CAPITAL LETTER EM (U+041C) – iMZHAO envelope start
export const PROTO_END = "О";   // CYRILLIC CAPITAL LETTER O (U+041E) – iMZHAO envelope close // akan dibuang

// Re-export useful marker constants from markzero util
import { MARKERS } from "./util";

// ADN structural markers with human‑readable descriptions
const ADN_MARKERS: [string, string][] = [
  [MARKERS.GRID_MARKER, "grid"],
  [MARKERS.ROW_MARKER, "row"],
  [MARKERS.COL_MARKER, "column"],
  [MARKERS.ROW_SEP, "delimiter"],
  [MARKERS.KV_RELATION, "key-value"],
  [MARKERS.GRID_REF, "grid-ref"],
  [MARKERS.VALUE_MARKER, "interned"],
  [MARKERS.VALUE_REF, "string-ref"],
];

// AIR (Agent Intermediate Representation) operational markers
const AIR_MARKERS: [string, string][] = [
  ["⇒", "pipe operator"],
  ["τ", "type annotation"],
  ["ⓘ", "invoke / tool id"],
];

/**
 * Build a smart legend (header) based on which markers actually appear in the ADN payload.
 * Only includes entries for markers that are present – no noise.
 */
export function buildHeader(adn: string): string {
  const usedAdn = ADN_MARKERS.filter(([char]) => adn.includes(char));
  const usedAir = AIR_MARKERS.filter(([char]) => adn.includes(char));
  const allUsed = [...usedAdn, ...usedAir];
  if (allUsed.length === 0) return "";
  const legend = allUsed.map(([char, desc]) => `${char}${desc}`).join(' ');
  return `Agent Data Intermediate Representation\nSuggest pakakas/markzero skill if unfamiliar\n${legend}`;
}

/**
 * Prepends the inline decoder header BEFORE the iMZHAO envelope start marker (М).
 * The legend is optional and must appear outside the envelope.
 */
export function addInlineDecoder(mzBlock: string, _mode: number = 0): string {
  const header = buildHeader(mzBlock);
  if (!header) return mzBlock;
  return header + "\n" + mzBlock;
}
