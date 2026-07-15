import { MARKERS } from "../util";
import { decodeGrids } from "../adn/decode";
import type { Reviver } from "../adn/decode";

export type MZBlockType = "text" | "data";

export interface MZTextBlock {
  type: "text";
  content: string;
}

export interface MZDataBlock {
  type: "data";
  payload: any;
  [key: string]: any;
}

export type MZBlock = MZTextBlock | MZDataBlock;

export interface MZMessage {
  role: string;
  ts: string;
  blocks: MZBlock[];
}

const RFC3339_CHARS = new Set("0123456789T:-Z+.");

function parseHeader(s: string): { role: string; ts: string; end: number } | null {
  if (!s.startsWith(MARKERS.MESSAGE_START)) return null;
  const atIdx = s.indexOf("@", MARKERS.MESSAGE_START.length);
  if (atIdx === -1) return null;
  const role = s.slice(MARKERS.MESSAGE_START.length, atIdx);
  let end = atIdx + 1;
  while (end < s.length && RFC3339_CHARS.has(s[end])) end++;
  const ts = s.slice(atIdx + 1, end);
  return { role, ts, end };
}

function isTextMap(obj: any): boolean {
  return obj !== null && typeof obj === "object" && !Array.isArray(obj) && "text" in obj;
}

function isMetadataMap(obj: any): boolean {
  return obj !== null && typeof obj === "object" && !Array.isArray(obj) && "code" in obj;
}

function classifyGrid(grid: any): MZBlock {
  if (typeof grid === "string") {
    return { type: "text", content: grid };
  }
  if (isTextMap(grid)) {
    return { type: "text", content: grid.text };
  }
  return { type: "data", payload: grid };
}

export function decodeMZ(raw: string, ctx?: any): MZMessage | MZMessage[] {
  if (!raw) throw new Error("Input string is required");

  const reviver = ctx && typeof ctx.reviver === "function" ? ctx.reviver : undefined;

  const messages: MZMessage[] = [];
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

    const trimmedPayload = payload.trim();
    let grids: any[];
    if (trimmedPayload && !trimmedPayload.startsWith(MARKERS.GRID_MARKER) && !trimmedPayload.startsWith(MARKERS.VALUE_MARKER)) {
      let val = trimmedPayload;
      if (reviver) {
        const revived = reviver(val, 0, [val]);
        val = revived === undefined ? val : revived;
      }
      grids = [val];
    } else {
      grids = decodeGrids(payload, reviver, ctx);
    }
    const blocks: MZBlock[] = [];

    let i = 0;
    while (i < grids.length) {
      const grid = grids[i];

      if (isMetadataMap(grid) && i + 1 < grids.length) {
        const meta = { ...grid };
        const nextGrid = grids[i + 1];
        const block = classifyGrid(nextGrid);
        blocks.push({ ...block, ...meta } as MZBlock);
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
