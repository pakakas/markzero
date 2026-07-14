import { expect, test, describe } from "bun:test";
import { decode } from "./adn/decode";
import { MARKERS } from "./util";

const G = MARKERS.GRID_MARKER;
const R = MARKERS.ROW_MARKER;
const T = MARKERS.PAYLOAD_TERMINATOR;

describe("Payload Terminator (ε)", () => {
  test("single block with ε terminator", () => {
    const input = `${G}${R}a${R}b${T}`;
    const result = decode(input);
    expect(result).toEqual([["a", "b"]]);
  });

  test("single block with ε + trailing human text", () => {
    const input = `${G}${R}a${R}b${T}\nIni teks manusia setelah ADN.`;
    const result = decode(input);
    expect(result[result.length - 1]).toEqual(["a", "b"]);
  });

  test("single block with ε + trailing whitespace", () => {
    const input = `${G}${R}a${R}b${T}   \n`;
    const result = decode(input);
    expect(result[result.length - 1]).toEqual(["a", "b"]);
  });

  test("multiple blocks each terminated by ε", () => {
    const input = `${G}${R}a${R}b${T}${G}${R}c${R}d${T}`;
    const result = decode(input);
    expect(result).toEqual([["a", "b"], ["c", "d"]]);
  });

  test("multiple blocks each terminated by ε + human text after last block", () => {
    const input = `${G}${R}x${T}${G}${R}y${T}catatan manusia`;
    const result = decode(input);
    const grids = result.filter(Array.isArray);
    expect(grids.length).toBe(2);
  });

  test("block without ε (EOF termination)", () => {
    const input = `${G}${R}a${R}b`;
    const result = decode(input);
    expect(result).toEqual([["a", "b"]]);
  });

  test("multiple blocks without ε (grid marker as boundary)", () => {
    const input = `${G}${R}a${R}b${G}${R}c${R}d`;
    const result = decode(input);
    expect(result).toEqual([["a", "b"], ["c", "d"]]);
  });

  test("ε with map block", () => {
    const input = `${G}name${MARKERS.KV_RELATION}hyuze${R}role${MARKERS.KV_RELATION}admin${T}`;
    const result = decode(input);
    expect(result.length).toBeGreaterThanOrEqual(1);
    const map = result[result.length - 1];
    expect(map.name).toBe("hyuze");
    expect(map.role).toBe("admin");
  });

  test("ε with column-headed grid", () => {
    const input = `${G}${MARKERS.COL_MARKER}name${MARKERS.ROW_SEP}role${R}hyuze${MARKERS.ROW_SEP}admin${T}`;
    const result = decode(input);
    expect(result.length).toBeGreaterThanOrEqual(1);
    const grid = result[result.length - 1];
    expect(grid[0].name).toBe("hyuze");
    expect(grid[0].role).toBe("admin");
  });
});
