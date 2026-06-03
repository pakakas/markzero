import { expect, test, describe } from "bun:test";
import { decode } from "./decode";
import { GRID_MARKER, ROW_MARKER, CLOSE_MARKER } from "./util";

describe("MarkZero Decoder - Mixed Content & EOF Boundaries", () => {
  test("decodes Data MarkZero successfully when mixed with surrounding human text and closed by ⓩ", () => {
    const mixedWithClose = `Ini teks awalan manusia.
${GRID_MARKER}a${ROW_MARKER}b${CLOSE_MARKER}
Dan ini adalah teks basa-basi setelah data MarkZero.`;

    const result = decode(mixedWithClose);
    expect(result).toEqual([["a", "b"]]);
  });

  test("decodes pure Data MarkZero properly without ⓩ (relying on EOF)", () => {
    const pureMarkZero = `${GRID_MARKER}a${ROW_MARKER}b`;
    const result = decode(pureMarkZero);
    expect(result).toEqual([["a", "b"]]);
  });

  test("decodes multi-grid Data MarkZero without ⓩ (relying on ⓖ and EOF boundaries)", () => {
    const multiGrid = `${GRID_MARKER}a${ROW_MARKER}b${GRID_MARKER}c${ROW_MARKER}d`;
    const result = decode(multiGrid);
    expect(result).toEqual([["a", "b"], ["c", "d"]]);
  });
});
