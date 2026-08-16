import { test, expect } from "bun:test";
import { encode } from "../src/adn/encode";
import { ENC_VALUES, ENC_INTERN_ALL } from "../src/index";
import { MARKERS } from "../src/util";

const data = [
    { name: "item1", type: "regular-file-record", "app-config-spec": "active" }, 
    { name: "item2", type: "regular-file-record", "app-config-spec": "active" },
    { name: "item3", type: "regular-file-record", "app-config-spec": "active" },
    { name: "item4", type: "regular-file-record", "app-config-spec": "active" },
    { name: "item5", type: "regular-file-record", "app-config-spec": "active" }
];
const meta = { 
    "app-config-spec": "active",
    author: "hyuze-the-architect-of-pakakas"
};
const meta2 = {
    "app-config-spec": "active",
    version: "1.0.0"
};

// Unified Input: meta, meta2 and data are just blocks in an array
const unifiedInput = [meta, meta2, data];

test("Always Literal Mode (Default)", () => {
  const result = encode(unifiedInput);
  // Should NOT have a pool part after first block start
  // In MarkZero (pure notation), it starts directly with the block marker
  expect(result.startsWith(MARKERS.GRID_MARKER)).toBe(true);
  expect(result).toContain("regular-file-record");
  console.log("Literal Mode Verified");
});

test("ENC_VALUES Mode (Pool Values Only)", () => {
  const result = encode(unifiedInput, ENC_VALUES);
  // Should have "regular-file-record" in pool (prefixed by VALUE_MARKER)
  expect(result).toContain(`${MARKERS.VALUE_MARKER}regular-file-record`);
  expect(result).toContain(`${MARKERS.VALUE_MARKER}app-config-spec`);
  console.log("ENC_VALUES Mode Verified (Smart Token Interning)");
});

test("ENC_INTERN_ALL Mode (Pool Everything)", () => {
  const result = encode(unifiedInput, ENC_INTERN_ALL);
  // Both keys and values should be interned if profitable
  expect(result).toContain(`${MARKERS.VALUE_MARKER}regular-file-record`);
  expect(result).toContain(`${MARKERS.GRID_MARKER}${MARKERS.ROW_MARKER}${MARKERS.VALUE_REF}`); // Keys should be pointers
  console.log("ENC_INTERN_ALL Mode Verified");
});
