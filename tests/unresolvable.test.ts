import { test, expect } from 'bun:test';
import { decode, encode } from '../src';
import { MZ_ID, VALUE_MARKER, GRID_MARKER, COL_MARKER, ROW_SEP, VALUE_REF, GRID_REF } from '../src/util';

const circularPayload =
  MZ_ID +
  VALUE_MARKER + 'a' +                           // pool entry 0 = "a"
  GRID_MARKER + COL_MARKER + VALUE_REF + '0' +   // start grid, heading "block"
  ROW_SEP + GRID_REF + '0';                     // reference to itself

test('Circular reference does not crash decode', () => {
  const result = decode(circularPayload);
  // Should not throw and should return a decoded structure
  expect(result).not.toBeNull();
  // The unresolvable self-reference (※0) should resolve to null, not the raw "※0" string
  const block = (result as any[])[0];
  const rows = block?.rows ?? block?.data ?? Object.values(block ?? {})[0];
  const flat = JSON.stringify(result);
  expect(flat).not.toContain(GRID_REF + '0');
});
