import { test, expect } from 'bun:test';
import { decode } from '../src/adn/decode';
import { encode } from '../src/adn/encode';
import { MZ_ID, MARKERS } from '../src/util';

const circularPayload =
  MZ_ID +
  MARKERS.VALUE_MARKER + 'a' +                           // pool entry 0 = "a"
  MARKERS.GRID_MARKER + MARKERS.COL_MARKER + MARKERS.VALUE_REF + '0' +   // start grid, heading "block"
  MARKERS.ROW_SEP + MARKERS.GRID_REF + '0';                      // reference to itself

test('Circular reference does not crash decode', () => {
  const result = decode(circularPayload);
  // Should not throw and should return a decoded structure
  expect(result).not.toBeNull();
  // The unresolvable self-reference (GRID_REF 0) should resolve to null, not the raw "GRID_REF 0" string
  const block = (result as any[])[0];
  const rows = block?.rows ?? block?.data ?? Object.values(block ?? {})[0];
  const flat = JSON.stringify(result);
  expect(flat).not.toContain(MARKERS.GRID_REF + '0');
});
