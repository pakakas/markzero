import { test, expect } from "bun:test";
import { decode, encode } from "../src";
import { MARKERS } from "../src/util";

test("Decoding Unified Blocks (Trading)", () => {
  // Pattern:  VALUE_MARKER pool GRID_MARKER map GRID_MARKER COL_MARKER heading ROW_MARKER item
  const tradingData = 
    MARKERS.VALUE_MARKER + "ticker" +
    MARKERS.VALUE_MARKER + "price" +
    MARKERS.VALUE_MARKER + "change" +
    MARKERS.VALUE_MARKER + "status" +
    MARKERS.VALUE_MARKER + "active" +
    MARKERS.VALUE_MARKER + "buy" +
    MARKERS.VALUE_MARKER + "sell" +
    MARKERS.VALUE_MARKER + "USD" +
    MARKERS.VALUE_MARKER + "2026-05-23" +
    MARKERS.VALUE_MARKER + "confidence" +
    MARKERS.VALUE_MARKER + "user_id" +
    MARKERS.VALUE_MARKER + "risk" +
    MARKERS.VALUE_MARKER + "value" +
    MARKERS.VALUE_MARKER + "curr" +
    MARKERS.VALUE_MARKER + "date" +
    MARKERS.GRID_MARKER + MARKERS.VALUE_REF + "10" + MARKERS.KV_RELATION + MARKERS.VALUE_REF + "0" +
    MARKERS.ROW_MARKER + MARKERS.VALUE_REF + "11" + MARKERS.KV_RELATION + "aggressive" +
    MARKERS.ROW_MARKER + MARKERS.VALUE_REF + "12" + MARKERS.KV_RELATION + "54200.50" +
    MARKERS.ROW_MARKER + MARKERS.VALUE_REF + "13" + MARKERS.KV_RELATION + MARKERS.VALUE_REF + "7" +
    MARKERS.ROW_MARKER + MARKERS.VALUE_REF + "14" + MARKERS.KV_RELATION + MARKERS.VALUE_REF + "8" +
    MARKERS.GRID_MARKER + MARKERS.COL_MARKER + MARKERS.VALUE_REF + "0" +
    MARKERS.ROW_SEP + MARKERS.VALUE_REF + "1" +
    MARKERS.ROW_SEP + MARKERS.VALUE_REF + "2" +
    MARKERS.ROW_SEP + MARKERS.VALUE_REF + "3" +
    MARKERS.ROW_MARKER + "AAPL" + MARKERS.ROW_SEP + "190.2" + MARKERS.ROW_SEP + "+1.2%" + MARKERS.ROW_SEP + MARKERS.VALUE_REF + "4" +
    MARKERS.ROW_MARKER + "BTC" + MARKERS.ROW_SEP + "65000" + MARKERS.ROW_SEP + "-2.5%" + MARKERS.ROW_SEP + MARKERS.VALUE_REF + "4" +
    MARKERS.ROW_MARKER + "TSLA" + MARKERS.ROW_SEP + "175.5" + MARKERS.ROW_SEP + "0.0%" + MARKERS.ROW_SEP + MARKERS.VALUE_REF + "4" +
    MARKERS.GRID_MARKER + MARKERS.COL_MARKER + MARKERS.VALUE_REF + "0" +
    MARKERS.ROW_SEP + "action" +
    MARKERS.ROW_SEP + MARKERS.VALUE_REF + "9" +
    MARKERS.ROW_MARKER + "NVDA" + MARKERS.ROW_SEP + MARKERS.VALUE_REF + "5" + MARKERS.ROW_SEP + "85%" +
    MARKERS.ROW_MARKER + "COIN" + MARKERS.ROW_SEP + MARKERS.VALUE_REF + "6" + MARKERS.ROW_SEP + "60%";

  const result = decode(tradingData);
  expect(Array.isArray(result)).toBe(true);
  const grids = result.slice(15);
  expect(grids.length).toBe(3); 
  expect(typeof grids[0]).toBe("object");
  expect(Array.isArray(grids[0])).toBe(false);
  expect(grids[0].user_id).toBe("ticker");
  expect(grids[0].risk).toBe("aggressive");
  expect(grids[0].value).toBe("54200.50");
  expect(grids[0].curr).toBe("USD");
  expect(grids[0].date).toBe("2026-05-23");
  console.log("Trading Unified Decode Verified");
});

test("Decoding Titled and Anonymous Grids", () => {
  const input = [
    { title: "Main Context", version: "1.0.0" },
    [{ name: "index.ts", size: "1024" }], 
    [["1", "0"], ["0", "1"]]
  ];

  const encoded = encode(input);
  const decoded = decode(encoded);
  expect(decoded.length).toBe(3);

  // Check if first block is Meta
  expect(typeof decoded[0]).toBe("object");

  // Check if second block is Grid with Headers
  expect(Array.isArray(decoded[1])).toBe(true);
  expect(decoded[1][0].name).toBe("index.ts");

  // Check if third block is Anonymous Matrix (array of arrays)
  expect(Array.isArray(decoded[2])).toBe(true);
  expect(Array.isArray(decoded[2][0])).toBe(true);
  expect(decoded[2][0][0]).toBe("1");

  console.log("Titled and Anonymous Grids Verified");
});
