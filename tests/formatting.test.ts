import { test, expect, describe } from "bun:test";
import { encode, decode, ENC_VALUES } from "../src/index";
import {
  ESCAPE_CHAR,
  GRID_MARKER,
  ROW_SEP,
  VALUE_MARKER,
  VALUE_REF,
  KV_RELATION,
  MZ_ID,
} from "../src/util";

describe("MarkZero Data Formatting", () => {

  test("Simple Map (Metadata)", () => {
    const data = { os: "win32", arch: "x64" };
    const encoded = encode(data);
    const decoded = decode(encoded);
    expect(decoded[0]).toEqual(data);
  });

  test("1D Set (List)", () => {
    const data = ["apple", "banana", "cherry"];
    const encoded = encode(data);
    const decoded = decode(encoded);
    expect(decoded[0]).toEqual(["apple", "banana", "cherry"]);
  });

  test("2D Grid (Table)", () => {
    const data = [
      { name: "hyuze", role: "admin" },
      { name: "guest", role: "user" }
    ];
    const encoded = encode(data);
    const decoded = decode(encoded);
    expect(decoded[0]).toEqual(data);
  });

  test("Escaping (Structural Markers in Content)", () => {
    const data = { 
      note: `Sign: ${ESCAPE_CHAR}, Marker: ${GRID_MARKER}, Separator: ${ROW_SEP}`
    };
    const encoded = encode(data);
    // Encoded should contain escaped markers (prefixed with ESCAPE_CHAR)
    expect(encoded).toContain(`${ESCAPE_CHAR}${ESCAPE_CHAR}`);
    expect(encoded).toContain(`${ESCAPE_CHAR}${GRID_MARKER}`);
    expect(encoded).toContain(`${ESCAPE_CHAR}${ROW_SEP}`);
    
    const decoded = decode(encoded);
    expect(decoded[0]).toEqual(data);
  });

  test("Interning (Token Pool Optimization)", () => {
    // Repeated long string should be interned
    const longString = "This is a very long string that should definitely be interned for efficiency.";
    const data = [
      { id: "1", text: longString },
      { id: "2", text: longString }
    ];
    const encoded = encode(data, ENC_VALUES);
    // Should have a pool entry
    expect(encoded).toContain(VALUE_MARKER + longString);
    // Should have a reference pointer (¤0)
    expect(encoded).toContain(`${VALUE_REF}0`);

    const decoded = decode(encoded);
    expect(decoded[0]).toEqual(data);
  });

  test("Nested Structures (Recursive Recovery)", () => {
    const data = {
      title: "Root",
      config: `${GRID_MARKER}mode${KV_RELATION}debug` // String containing ADN
    };
    const encoded = encode(data);
    const decoded = decode(encoded);
    // Escaping should preserve the inner ADN string literal
    expect(decoded[0].config).toBe(`${GRID_MARKER}mode${KV_RELATION}debug`);
  });

  test("Empty and Edge Cases", () => {
    expect(() => decode("")).toThrow();
    expect(encode([])).toBe(MZ_ID + GRID_MARKER);
    expect(encode({})).toBe(MZ_ID + GRID_MARKER);
  });

});
