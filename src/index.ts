export {
  ENC_INTERN_ALL,
  ENC_VALUES,
  ENC_GRID_DEDUPLICATE,
  ENC_INTERN_LAST,
  ENC_INTERN_FIRST,
  MARKERS,
  TITLE_SYMBOL,
} from "./util";

export { encode } from "./encode";
export { decode, MESSAGE_START, PAYLOAD_TERMINATOR, buildHeader, addInlineDecoder } from "./decode";
export type {
  Message,
  Block,
  BlockType,
  TextBlock,
  DataBlock,
} from "./decode";
