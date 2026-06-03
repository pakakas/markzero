import { test, expect } from "bun:test";
import { decode, encode } from "../src";
import {
  ,
  VALUE_MARKER,
  GRID_MARKER,
  COL_MARKER,
  ROW_SEP,
  ROW_MARKER,
  KV_RELATION,
  VALUE_REF,
} from "../src/util";

test("Decoding Unified Blocks (Trading)", () => {
  // Pattern:  VALUE_MARKER pool GRID_MARKER map GRID_MARKER ᴄheading ʀitem
  const tradingData = 
     +
    VALUE_MARKER + "ticker" +
    VALUE_MARKER + "price" +
    VALUE_MARKER + "change" +
    VALUE_MARKER + "status" +
    VALUE_MARKER + "active" +
    VALUE_MARKER + "buy" +
    VALUE_MARKER + "sell" +
    VALUE_MARKER + "USD" +
    VALUE_MARKER + "2026-05-23" +
    VALUE_MARKER + "confidence" +
    VALUE_MARKER + "user_id" +
    VALUE_MARKER + "risk" +
    VALUE_MARKER + "value" +
    VALUE_MARKER + "curr" +
    VALUE_MARKER + "date" +
    GRID_MARKER + VALUE_REF + "10" + KV_RELATION + VALUE_REF + "0" +
    ROW_MARKER + VALUE_REF + "11" + KV_RELATION + "aggressive" +
    ROW_MARKER + VALUE_REF + "12" + KV_RELATION + "54200.50" +
    ROW_MARKER + VALUE_REF + "13" + KV_RELATION + VALUE_REF + "7" +
    ROW_MARKER + VALUE_REF + "14" + KV_RELATION + VALUE_REF + "8" +
    GRID_MARKER + COL_MARKER + VALUE_REF + "0" +
    ROW_SEP + VALUE_REF + "1" +
    ROW_SEP + VALUE_REF + "2" +
    ROW_SEP + VALUE_REF + "3" +
    ROW_MARKER + "AAPL" + ROW_SEP + "190.2" + ROW_SEP + "+1.2%" + ROW_SEP + VALUE_REF + "4" +
    ROW_MARKER + "BTC" + ROW_SEP + "65000" + ROW_SEP + "-2.5%" + ROW_SEP + VALUE_REF + "4" +
    ROW_MARKER + "TSLA" + ROW_SEP + "175.5" + ROW_SEP + "0.0%" + ROW_SEP + VALUE_REF + "4" +
    GRID_MARKER + COL_MARKER + VALUE_REF + "0" +
    ROW_SEP + "action" +
    ROW_SEP + VALUE_REF + "9" +
    ROW_MARKER + "NVDA" + ROW_SEP + VALUE_REF + "5" + ROW_SEP + "85%" +
    ROW_MARKER + "COIN" + ROW_SEP + VALUE_REF + "6" + ROW_SEP + "60%";

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
