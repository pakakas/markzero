import { MARKERS } from "../util";
import { decodeGrids } from "../adn/decode";

export type MZBlockType = "text" | "data" | "invoke";

export interface MZTextBlock {
  type: "text";
  content: string;
}

export interface MZDataBlock {
  type: "data";
  payload: any;
  [key: string]: any;
}

export interface MZInvokeBlock {
  type: "invoke";
  commands: string | string[];
  [key: string]: any;
}

export type MZBlock = MZTextBlock | MZDataBlock | MZInvokeBlock;

export interface MZMessage {
  role: string;
  ts: string;
  blocks: MZBlock[];
}

const HEADER_RE = /^М(\w+)@([^\n]+)\n/;

function isTextMap(obj: any): boolean {
  return obj !== null && typeof obj === "object" && !Array.isArray(obj) && "text" in obj;
}

function isInvokeMap(obj: any): boolean {
  return obj !== null && typeof obj === "object" && !Array.isArray(obj) && "invoke" in obj;
}

function isMetadataMap(obj: any): boolean {
  return obj !== null && typeof obj === "object" && !Array.isArray(obj) && "code" in obj;
}

function classifyGrid(grid: any): MZBlock {
  if (isTextMap(grid)) {
    return { type: "text", content: grid.text };
  }
  if (isInvokeMap(grid)) {
    const { invoke, ...rest } = grid;
    const commands = typeof invoke === "string" ? invoke : invoke;
    return Object.keys(rest).length > 0
      ? { type: "invoke", commands, ...rest }
      : { type: "invoke", commands };
  }
  // Array format: ["invoke", "Script1", "Script2"] or [["invoke"], ["Script1"]]
  if (Array.isArray(grid)) {
    const firstRow = grid[0];
    const key = Array.isArray(firstRow) ? firstRow[0] : firstRow;
    if (key === "invoke") {
      const scripts: string[] = [];
      for (let i = 1; i < grid.length; i++) {
        const row = grid[i];
        if (Array.isArray(row)) {
          scripts.push(...row);
        } else {
          scripts.push(row);
        }
      }
      return { type: "invoke", commands: scripts.length === 1 ? scripts[0] : scripts };
    }
  }
  return { type: "data", payload: grid };
}

export function decodeMZ(raw: string): MZMessage | MZMessage[] {
  if (!raw) throw new Error("Input string is required");

  const messages: MZMessage[] = [];
  let remaining = raw;

  while (remaining.length > 0) {
    const headerMatch = remaining.match(HEADER_RE);

    if (!headerMatch) {
      if (messages.length === 0) {
        throw new Error("Input does not start with М message header");
      }
      break;
    }

    const role = headerMatch[1];
    const ts = headerMatch[2];
    const afterHeader = remaining.substring(headerMatch[0].length);

    const nextMsgIdx = afterHeader.indexOf(MARKERS.MESSAGE_START);
    const payload = nextMsgIdx === -1 ? afterHeader : afterHeader.substring(0, nextMsgIdx);

    const grids = decodeGrids(payload);
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
