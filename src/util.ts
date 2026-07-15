export { estimateTokenCount } from "@pakakas/token";

export const MARKERS = {
  VALUE_MARKER: "·",       // MIDDLE DOT (U+00B7) - Vocab Prefix
  GRID_MARKER: "░",        // LIGHT SHADE (U+2591) – GRID marker
  COL_MARKER: "§",         // SECTION SIGN (U+00A7) – COLUMN marker
  ROW_SEP: "¦",            // BROKEN BAR (U+00A6) – ROW SEPARATOR
  ROW_MARKER: "→",         // RIGHTWARDS ARROW (U+2192) – ROW PREFIX
  KV_RELATION: "≡",        // IDENTICAL TO (U+2261) – KEY‑VALUE RELATION
  VALUE_REF: "¤",          // CURRENCY SIGN (U+00A4) – VALUE REFERENCE
  GRID_REF: "※",          // REFERENCE MARK (U+203B) – GRID REFERENCE
  BOOL_TRUE: "◆",         // BLACK DIAMOND (U+25C6) – BOOLEAN TRUE
  BOOL_FALSE: "◇",        // WHITE DIAMOND (U+25C7) – BOOLEAN FALSE
  NULL_MARKER: "○",        // WHITE CIRCLE (U+25CB) – NULL VALUE
  TITLE_MARKER: "†",       // DAGGER (U+2020) – TITLE MARKER
  MESSAGE_START: "М",      // CYRILLIC CAPITAL LETTER EM (U+041C) – MESSAGE START MARKER
  PAYLOAD_TERMINATOR: "ε",  // GREEK SMALL LETTER EPSILON (U+03B5) – ADN PAYLOAD END

  // Deprecated alias — use PAYLOAD_TERMINATOR
  MZ_ENVELOPE_END: "ε",
} as const;

export const TITLE_SYMBOL = Symbol.for("title"); // Symbol key for bound title (exposed by decoder)
export const MZ_ID = "MZ";              // MarkZero identifier

/**
 * Escapes MarkZero markers by replacing them with UPPER_CASE_PLACEHOLDER strings.
 * Delegates to context.escaper or context.escape if provided.
 */
export function escape(text: string, context?: any): string {
  if (context && typeof context.escaper === "function") {
    return context.escaper(text);
  }
  if (context && typeof context.escape === "function") {
    return context.escape(text);
  }
  const source = String(text ?? "");
  if (/^[※¤]\d+$/.test(source)) {
    return source;
  }
  let result = source;
  for (const [placeholder, char] of Object.entries(MARKERS)) {
    if (placeholder === "VALUE_MARKER") continue;
    result = result.replaceAll(char, placeholder);
  }
  return result;
}

/**
 * Unescapes MarkZero strings by replacing placeholder strings with raw MZ/ADN characters.
 */
export function unescape(text: string): string {
  let result = String(text ?? "");
  for (const [placeholder, char] of Object.entries(MARKERS)) {
    if (placeholder === "VALUE_MARKER") continue;
    result = result.replaceAll(placeholder, char);
  }
  return result;
}

// Numeric Constants
export const EMPTY_SIZE = 0;
export const INITIAL_COUNT = 0;
export const INCREMENT = 1;
export const DEFAULT_INDEX_LEN = 1;
export const DECIMAL_RADIX = 10;
export const ESCAPE_SEQUENCE_LENGTH = 0;
export const ID_OFFSET = 1;
export const MAPPED_KEY = 0;
export const MAPPED_VAL = 1;
export const NOT_FOUND = -1;

// Encoding Modes
export const ENC_VALUES = 1;
export const ENC_INTERN_ALL = 2;
export const ENC_GRID_DEDUPLICATE = 4;

export function isProfitable(frequency: number, tokenLength: number, indexLength: number): boolean {
  const refCost = 1 + indexLength; // VALUE_REF (1) + index digits
  const poolOverhead = 1;          // VALUE_MARKER (1)
  if (tokenLength <= refCost) return false;
  return (frequency * (tokenLength - refCost)) > (poolOverhead + tokenLength);
}
