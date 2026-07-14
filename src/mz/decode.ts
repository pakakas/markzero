import { MARKERS } from "../util";
import { decodeGrids } from "../adn/decode";

export interface MZBlock {
  type: "text" | "adn";
  content?: string;
  data?: any;
  [key: string]: any;
}

export interface MZMessage {
  role: string;
  ts: string;
  blocks: MZBlock[];
}

const HEADER_RE = /^М(\w+)@([^\n]+)\n/;

function isMetadataMap(obj: any): boolean {
  return obj !== null && typeof obj === "object" && !Array.isArray(obj) && "code" in obj;
}

function isTextMap(obj: any): boolean {
  return obj !== null && typeof obj === "object" && !Array.isArray(obj) && "text" in obj;
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

      if (isTextMap(grid)) {
        blocks.push({ type: "text", content: grid.text });
        i++;
      } else if (isMetadataMap(grid) && i + 1 < grids.length) {
        const meta = { ...grid };
        const data = grids[i + 1];
        blocks.push({ type: "adn", ...meta, data });
        i += 2;
      } else {
        blocks.push({ type: "adn", data: grid });
        i++;
      }
    }

    messages.push({ role, ts, blocks });
    remaining = nextMsgIdx === -1 ? "" : afterHeader.substring(nextMsgIdx);
  }

  return messages.length === 1 ? messages[0] : messages;
}
