import { MARKERS } from "./util";
import { decodeGrids } from "./adn/decode";
import type { Reviver } from "./adn/decode";

export const MESSAGE_START = "М"; // CYRILLIC CAPITAL LETTER EM (U+041C) – MarkZero header line start
export const PAYLOAD_TERMINATOR = "ε"; // GREEK SMALL LETTER EPSILON (U+03B5) – MarkZero payload terminator

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

/**
 * Build a smart legend (header) based on which markers actually appear in the ADN payload.
 * Only includes entries for markers that are present – no noise.
 */
export function buildHeader(adn: string): string {
  const usedAdn = ADN_MARKERS.filter(([char]) => adn.includes(char));
  if (usedAdn.length === 0) return "";
  const legend = usedAdn.map(([char, desc]) => `${char}${desc}`).join(' ');
  return `Agent Intermediate Representation\nSuggest installing pakakas/markzero skill if user unfamiliar\n${legend}`;
}

/**
 * Prepends the inline decoder header BEFORE the MarkZero envelope start marker (М).
 * The legend is optional and must appear outside the envelope.
 */
export function addInlineDecoder(mzBlock: string, _mode: number = 0): string {
  const header = buildHeader(mzBlock);
  if (!header) return mzBlock;
  return header + "\n" + mzBlock;
}

export type BlockType = "text" | "data";

export interface TextBlock {
  type: "text";
  content: string;
}

export interface DataBlock {
  type: "data";
  payload: any;
  [key: string]: any;
}

export type Block = TextBlock | DataBlock;

export interface Message {
  role: string;
  ts: string;
  blocks: Block[];
}

// Deprecated aliases
export type MZBlockType = BlockType;
export type MZTextBlock = TextBlock;
export type MZDataBlock = DataBlock;
export type MZBlock = Block;
export type MZMessage = Message;

function isRFC3339Char(code: number): boolean {
  return (
    (code >= 48 && code <= 57) || // 0-9
    code === 84 ||  // T
    code === 116 || // t
    code === 90 ||  // Z
    code === 122 || // z
    code === 58 ||  // :
    code === 45 ||  // -
    code === 43 ||  // +
    code === 46     // .
  );
}

function parseHeader(input: string): { role: string; ts: string; end: number } | null {
  if (!input.startsWith(MARKERS.MESSAGE_START)) return null;
  const atIdx = input.indexOf("@", MARKERS.MESSAGE_START.length);
  if (atIdx === -1) return null;
  const role = input.slice(MARKERS.MESSAGE_START.length, atIdx);
  let end = atIdx + 1;
  while (end < input.length && isRFC3339Char(input.charCodeAt(end))) end++;
  const ts = input.slice(atIdx + 1, end);
  return { role, ts, end };
}

function isTextMap(obj: any): boolean {
  return obj !== null && typeof obj === "object" && !Array.isArray(obj) && "text" in obj;
}

function isMetadataMap(obj: any): boolean {
  return obj !== null && typeof obj === "object" && !Array.isArray(obj) && "code" in obj;
}

function classifyGrid(grid: any): Block {
  if (typeof grid === "string") {
    return { type: "text", content: grid };
  }
  if (isTextMap(grid)) {
    return { type: "text", content: grid.text };
  }
  return { type: "data", payload: grid };
}

export function decode(raw: string, ctx?: any): Message | Message[] {
  if (!raw) throw new Error("Input string is required");

  const reviver = ctx && typeof ctx.reviver === "function" ? ctx.reviver : undefined;

  const messages: Message[] = [];
  let remaining = raw;

  while (remaining.length > 0) {
    const header = parseHeader(remaining);

    if (!header) {
      if (messages.length === 0) {
        throw new Error("Input does not start with М message header");
      }
      break;
    }

    const { role, ts, end } = header;
    const afterHeader = remaining.slice(end);

    const nextMsgIdx = afterHeader.indexOf(MARKERS.MESSAGE_START);
    const payload = nextMsgIdx === -1 ? afterHeader : afterHeader.substring(0, nextMsgIdx);

    const rawPayload = payload.startsWith("\n") ? payload.slice(1) : payload;
    let grids: any[];
    if (rawPayload && !rawPayload.startsWith(MARKERS.GRID_MARKER) && !rawPayload.startsWith(MARKERS.VALUE_MARKER)) {
      let val = rawPayload;
      if (reviver) {
        const revived = reviver(val, 0, [val]);
        val = revived === undefined ? val : revived;
      }
      grids = [val];
    } else {
      grids = decodeGrids(payload, reviver, ctx);
    }
    const blocks: Block[] = [];

    let i = 0;
    while (i < grids.length) {
      const grid = grids[i];

      if (isMetadataMap(grid) && i + 1 < grids.length) {
        const meta = { ...grid };
        const nextGrid = grids[i + 1];
        const block = classifyGrid(nextGrid);
        blocks.push({ ...block, ...meta } as Block);
        i += 2;
      } else {
        blocks.push(classifyGrid(grid));
        i++;
      }
    }

    messages.push({ role, ts, blocks });
    remaining = nextMsgIdx === -1 ? "" : afterHeader.substring(nextMsgIdx);
  }

  return messages.length === 1 ? messages[0] : messages;
}
