import { expect, test, describe } from "bun:test";
import { decodeMZ } from "./decode";
import { MARKERS } from "../util";

const M = MARKERS.MESSAGE_START;
const G = MARKERS.GRID_MARKER;
const R = MARKERS.ROW_MARKER;
const KV = MARKERS.KV_RELATION;
const T = MARKERS.PAYLOAD_TERMINATOR;

describe("MZ Protocol Decoder", () => {
  test("single message with one data block", () => {
    const input = `${M}assistant@2026-06-24T14:56:07Z\n${G}name${KV}hyuze${R}role${KV}admin`;
    const result = decodeMZ(input) as any;
    expect(result.role).toBe("assistant");
    expect(result.ts).toBe("2026-06-24T14:56:07Z");
    expect(result.blocks.length).toBe(1);
    expect(result.blocks[0].type).toBe("data");
    expect(result.blocks[0].payload.name).toBe("hyuze");
    expect(result.blocks[0].payload.role).toBe("admin");
  });

  test("single message with multiple data blocks separated by ε", () => {
    const input = `${M}assistant@2026-06-24T14:56:07Z\n${G}name${KV}hyuze${T}${G}name${KV}alice`;
    const result = decodeMZ(input) as any;
    expect(result.blocks.length).toBe(2);
    expect(result.blocks[0].payload.name).toBe("hyuze");
    expect(result.blocks[1].payload.name).toBe("alice");
  });

  test("single message with text block", () => {
    const input = `${M}assistant@2026-06-24T14:56:07Z\n${G}text${KV}Hello world`;
    const result = decodeMZ(input) as any;
    expect(result.blocks.length).toBe(1);
    expect(result.blocks[0].type).toBe("text");
    expect(result.blocks[0].content).toBe("Hello world");
  });

  test("single message with metadata + data blocks", () => {
    const input = `${M}assistant@2026-06-24T14:56:07Z\n${G}${R}code${KV}json${G}name${KV}hyuze`;
    const result = decodeMZ(input) as any;
    expect(result.blocks.length).toBe(1);
    expect(result.blocks[0].type).toBe("data");
    expect(result.blocks[0].code).toBe("json");
    expect(result.blocks[0].payload.name).toBe("hyuze");
  });

  test("single message with mixed text + data blocks", () => {
    const input = `${M}assistant@2026-06-24T14:56:07Z\n${G}text${KV}Here is data:${G}name${KV}hyuze`;
    const result = decodeMZ(input) as any;
    expect(result.blocks.length).toBe(2);
    expect(result.blocks[0].type).toBe("text");
    expect(result.blocks[0].content).toBe("Here is data:");
    expect(result.blocks[1].type).toBe("data");
    expect(result.blocks[1].payload.name).toBe("hyuze");
  });

  test("stream with multiple messages", () => {
    const input =
      `${M}assistant@2026-06-24T14:56:07Z\n${G}name${KV}hyuze` +
      `${M}human@2026-06-24T14:56:30Z\n${G}error${KV}count` +
      `${M}system@2026-06-24T14:56:35Z\n${G}status${KV}ok`;
    const result = decodeMZ(input) as any[];
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);
    expect(result[0].role).toBe("assistant");
    expect(result[0].blocks[0].payload.name).toBe("hyuze");
    expect(result[1].role).toBe("human");
    expect(result[1].blocks[0].payload.error).toBe("count");
    expect(result[2].role).toBe("system");
    expect(result[2].blocks[0].payload.status).toBe("ok");
  });

  test("stream with mixed text + data in different messages", () => {
    const input =
      `${M}assistant@2026-06-24T14:56:07Z\n${G}text${KV}Hello${G}name${KV}hyuze` +
      `${M}human@2026-06-24T14:56:30Z\n${G}text${KV}Thanks`;
    const result = decodeMZ(input) as any[];
    expect(result.length).toBe(2);
    expect(result[0].blocks[0].type).toBe("text");
    expect(result[0].blocks[0].content).toBe("Hello");
    expect(result[0].blocks[1].type).toBe("data");
    expect(result[0].blocks[1].payload.name).toBe("hyuze");
    expect(result[1].blocks[0].type).toBe("text");
    expect(result[1].blocks[0].content).toBe("Thanks");
  });

  test("metadata without following data grid becomes standalone data block", () => {
    const input = `${M}assistant@2026-06-24T14:56:07Z\n${G}${R}code${KV}ts`;
    const result = decodeMZ(input) as any;
    expect(result.blocks.length).toBe(1);
    expect(result.blocks[0].type).toBe("data");
    expect(result.blocks[0].payload.code).toBe("ts");
  });

  test("throws on empty input", () => {
    expect(() => decodeMZ("")).toThrow("Input string is required");
  });

  test("throws on input without М header", () => {
    expect(() => decodeMZ("░→name≡hyuze")).toThrow("does not start with М");
  });

  test("single message return object, stream return array", () => {
    const single = `${M}assistant@2026-06-24T14:56:07Z\n${G}name${KV}hyuze`;
    const stream = single + `${M}human@2026-06-24T14:56:30Z\n${G}x${KV}y`;
    expect(typeof decodeMZ(single)).toBe("object");
    expect(Array.isArray(decodeMZ(stream))).toBe(true);
  });
});
