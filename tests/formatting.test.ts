import { test, expect, describe } from "bun:test";
import { encode } from "../src/adn/encode";
import { decode } from "../src/adn/decode";
import { ENC_VALUES } from "../src/index";
import {
  MARKERS,
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

  test("1D Set (List) with explicit row marker on first row", () => {
    // Both forms are valid: anon (no leading ROW_MARKER) and explicit (with leading ROW_MARKER).
    // Decoder must accept either form.
    const explicit = MARKERS.GRID_MARKER + MARKERS.ROW_MARKER + "apple" + MARKERS.ROW_MARKER + "banana" + MARKERS.ROW_MARKER + "cherry";
    const decodedExplicit = decode(explicit);
    expect(decodedExplicit[0]).toEqual(["apple", "banana", "cherry"]);

    const anon = MARKERS.GRID_MARKER + "apple" + MARKERS.ROW_MARKER + "banana" + MARKERS.ROW_MARKER + "cherry";
    const decodedAnon = decode(anon);
    expect(decodedAnon[0]).toEqual(["apple", "banana", "cherry"]);
  });

  test("2D Grid (Table)", () => {
    const data = [
      { name: "hyuze", role: "admin" },
      { name: "alice", role: "dev" }
    ];
    const encoded = encode(data);
    const decoded = decode(encoded);
    expect(decoded[0]).toEqual(data);
  });

  test("Interning (Value Pool Optimization)", () => {
    // Repeated long string should be interned
    const longString = "This is a very long string that should definitely be interned for efficiency.";
    const data = [
      { id: "1", text: longString },
      { id: "2", text: longString }
    ];
    const encoded = encode(data, ENC_VALUES);
    // Should have a pool entry
    expect(encoded).toContain(MARKERS.VALUE_MARKER + longString);
    // Should have a reference pointer (VALUE_REF 0)
    expect(encoded).toContain(`${MARKERS.VALUE_REF}0`);

    const decoded = decode(encoded);
    expect(decoded[decoded.length - 1]).toEqual(data);
  });

  test("Implicit/Contextual Escaping (UPPER_CASE_PLACEHOLDER & Context-Based Decoding)", () => {
    const data = {
      note: `Sign: ${MARKERS.MESSAGE_START}, Marker: ${MARKERS.GRID_MARKER}, Row: ${MARKERS.ROW_MARKER}`
    };
    const encoded = encode(data);
    // Serialized output should use UPPER_CASE_PLACEHOLDER constants
    expect(encoded).toContain("MESSAGE_START");
    expect(encoded).toContain("GRID_MARKER");
    expect(encoded).toContain("ROW_MARKER");

    // Decode with context that maps placeholders back to concrete characters
    const context = {
      unescape: (text: string) => {
        return text
          .replaceAll("MESSAGE_START", MARKERS.MESSAGE_START)
          .replaceAll("GRID_MARKER", MARKERS.GRID_MARKER)
          .replaceAll("ROW_MARKER", MARKERS.ROW_MARKER);
      }
    };
    const decoded = decode(encoded, context);
    expect(decoded[0]).toEqual(data);

    // Decode without passing context explicitly should also decode perfectly
    // using the default unescaping behavior.
    const decodedDefault = decode(encoded);
    expect(decodedDefault[0]).toEqual(data);
  });

  test("Implicit/Contextual Escaping with Custom Context Escaper", () => {
    const data = {
      note: `Sign: ${MARKERS.MESSAGE_START}, Marker: ${MARKERS.GRID_MARKER}, Row: ${MARKERS.ROW_MARKER}`
    };
    // Custom context that replaces markers with a custom notation
    const context = {
      escaper: (text: string) => {
        return text
          .replaceAll(MARKERS.MESSAGE_START, "[START]")
          .replaceAll(MARKERS.GRID_MARKER, "[GRID]")
          .replaceAll(MARKERS.ROW_MARKER, "[ROW]");
      }
    };
    const encoded = encode(data, context);
    expect(encoded).toContain("[START]");
    expect(encoded).toContain("[GRID]");
    expect(encoded).toContain("[ROW]");
  });

  test("Empty and Edge Cases", () => {
    expect(() => decode("")).toThrow();
    expect(() => encode([])).toThrow(TypeError);
    expect(() => encode({})).toThrow(TypeError);
  });

});
