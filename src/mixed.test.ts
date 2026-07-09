import { expect, test, describe } from "bun:test";
import { decode } from "./decode";
import { MARKERS } from "./util";

describe("MarkZero Decoder - Mixed Content & EOF Boundaries", () => {
  test("decodes Data MarkZero successfully when mixed with surrounding human text and closed by О", () => {
    const mixedWithClose = `Ini teks awalan manusia.
${MARKERS.GRID_MARKER}${MARKERS.ROW_MARKER}a${MARKERS.ROW_MARKER}b${MARKERS.MZ_ENVELOPE_END}
Dan ini adalah teks basa-basi setelah data MarkZero.`;

    const result = decode(mixedWithClose);
    // Pool captures the prefix text before the grid marker
    expect(result[result.length - 1]).toEqual(["a", "b"]);
  });

  // akan dibuang
  test("decodes pure Data MarkZero properly without О (relying on EOF)", () => {
    const pureMarkZero = `${MARKERS.GRID_MARKER}${MARKERS.ROW_MARKER}a${MARKERS.ROW_MARKER}b`;
    const result = decode(pureMarkZero);
    expect(result).toEqual([["a", "b"]]);
  });

  // akan dibuang
  test("decodes multi-grid Data MarkZero without О (relying on ░ and EOF boundaries)", () => {
    const multiGrid = `${MARKERS.GRID_MARKER}${MARKERS.ROW_MARKER}a${MARKERS.ROW_MARKER}b${MARKERS.GRID_MARKER}${MARKERS.ROW_MARKER}c${MARKERS.ROW_MARKER}d`;
    const result = decode(multiGrid);
    expect(result).toEqual([["a", "b"], ["c", "d"]]);
  });
});
