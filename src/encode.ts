import { MARKERS } from "./util";
import { encode as encodeADN } from "./adn/encode";
import type { Message, Block } from "./decode";

export interface SimpleMessage {
  role: string;
  ts?: string;
  content?: string;
  blocks?: Block[];
}

function encodeSingle(msg: SimpleMessage | Message, options?: any): string {
  const role = msg.role || "assistant";
  const ts = msg.ts || new Date().toISOString();
  const header = `${MARKERS.MESSAGE_START}${role}@${ts}\n`;

  if (typeof msg.content === "string") {
    return header + msg.content;
  }

  if (Array.isArray(msg.blocks)) {
    const body = msg.blocks
      .map((block: Block) => {
        if (block.type === "text") {
          return block.content;
        }
        if (block.type === "data") {
          const { type, payload, ...meta } = block;
          let res = "";
          if (Object.keys(meta).length > 0) {
            res += encodeADN(meta, options) + "\n";
          }
          if (payload !== undefined) {
            res += encodeADN(payload, options);
          }
          return res;
        }
        return "";
      })
      .join(MARKERS.PAYLOAD_TERMINATOR);

    return header + body;
  }

  return header;
}

export function encode(input: SimpleMessage | Message | (SimpleMessage | Message)[], options?: any): string {
  if (Array.isArray(input)) {
    return input.map((item) => encodeSingle(item, options)).join("");
  }
  return encodeSingle(input, options);
}

export default encode;
