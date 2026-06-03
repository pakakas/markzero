export { estimateTokenCount } from "@pakakas/token";

export const VALUE_MARKER = "·";       // MIDDLE DOT (U+00B7) - Vocab Prefix
export const ESCAPE_CHAR = "ɛ";        // LATIN SMALL LETTER OPEN E (U+025B) - Escape marker
export const GRID_MARKER = "ⓖ";       // CIRCLED LATIN SMALL LETTER G (U+24D6) – GRID (grid marker)
export const TITLE_MARKER = "★";      // BLACK STAR (U+2605) – TITLE marker
export const COL_MARKER = "ᴄ";         // LATIN LETTER SMALL CAPITAL C (U+1D04) – COLUMN marker
export const ROW_SEP = "¦";            // BROKEN BAR (U+00A6) – ROW SEPARATOR
export const ROW_MARKER = "ʀ";         // LATIN LETTER SMALL CAPITAL R (U+0280) – ROW PREFIX
export const KV_RELATION = "→";        // RIGHTWARDS ARROW (U+2192) – KEY‑VALUE RELATION
export const VALUE_REF = "¤";          // CURRENCY SIGN (U+00A4) – VALUE REFERENCE
export const GRID_REF = "※";          // REFERENCE MARK (U+203B) – GRID REFERENCE
export const MZ_ID = "ⓜ";             // CIRCLED LATIN SMALL LETTER M (U+24DC) – START MARKER
export const CLOSE_MARKER = "ⓩ";      // CIRCLED LATIN SMALL LETTER Z (U+24E9) – CLOSE MARKER

export const ALL_MARKERS = [
  ESCAPE_CHAR, VALUE_MARKER, GRID_MARKER, TITLE_MARKER,
  COL_MARKER, ROW_SEP, ROW_MARKER, KV_RELATION, VALUE_REF, GRID_REF, MZ_ID, CLOSE_MARKER
];

/**
 * Escapes MarkZero markers in a string by prefixing them with the ESCAPE_CHAR.
 */
export function escape(text: string): string {
  const source = String(text ?? "");
  if (/^※\d+$/.test(source)) {
    return source;
  }
  let escaped = "";
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (ALL_MARKERS.includes(char!)) {
      escaped += ESCAPE_CHAR + char;
    } else {
      escaped += char;
    }
  }
  return escaped;
}

/**
 * Unescapes MarkZero strings. Removes the escape character prefix.
 */
export function unescape(text: string): string {
  const source = String(text ?? "");
  let unescaped = "";
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === ESCAPE_CHAR) { // Explicitly check for escape char
        // If next character is a marker, skip the whole escape sequence
        if (i + ESCAPE_SEQUENCE_LENGTH <= source.length && ALL_MARKERS.includes(source[i + ESCAPE_CHAR.length]!)) {
            unescaped += source[i + ESCAPE_CHAR.length];
            i += ESCAPE_SEQUENCE_LENGTH - 1;
            continue;
        }
    }
    unescaped += source[i];
  }
  return unescaped;
}

// Numeric Constants
export const EMPTY_SIZE = 0;
export const INITIAL_COUNT = 0;
export const INCREMENT = 1;
export const DEFAULT_INDEX_LEN = 1;
export const DECIMAL_RADIX = 10;
export const ESCAPE_SEQUENCE_LENGTH = ESCAPE_CHAR.length + 1;
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
