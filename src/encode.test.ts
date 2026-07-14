import { expect, test, describe } from "bun:test";
import { encode, decode, ENC_GRID_DEDUPLICATE } from "./index";
import { MARKERS } from "./util";

describe("MarkZero Encoder (Default Mode)", () => {
  test("throws TypeError for primitive, empty, or irrelevant inputs", () => {
    expect(() => encode("hello")).toThrow(TypeError);
    expect(() => encode(123 as any)).toThrow(TypeError);
    expect(() => encode(true as any)).toThrow(TypeError);
    expect(() => encode(false as any)).toThrow(TypeError);
    expect(() => encode(null as any)).toThrow(TypeError);
    expect(() => encode(undefined as any)).toThrow(TypeError);
    expect(() => encode(new Date() as any)).toThrow(TypeError);
    expect(() => encode(/abc/ as any)).toThrow(TypeError);
    expect(() => encode((() => {}) as any)).toThrow(TypeError);
    expect(() => encode([])).toThrow(TypeError);
    expect(() => encode({})).toThrow(TypeError);
  });

  test("encodes an array (Set)", () => {
    const input = ["a", "b", "c"];
    const result = encode(input);
    // Anonymous set: first row ROW_MARKER is optional.
    expect(result).toBe(MARKERS.GRID_MARKER + "a" + MARKERS.ROW_MARKER + "b" + MARKERS.ROW_MARKER + "c");
  });

  test("encodes an object (Map)", () => {
    const input = { key: "value" };
    const result = encode(input);
    // GRID_MARKER + ROW_MARKER + key + KV_RELATION + value
    expect(result).toBe(MARKERS.GRID_MARKER + MARKERS.ROW_MARKER + "key" + MARKERS.KV_RELATION + "value");
  });

  test("encodes grid references (※0) without escaping at the top-level", () => {
    const input = { ref: MARKERS.GRID_REF + "0" };
    const result = encode(input);
    // Should preserve GRID_REF + 0 as is (no escape) because of the grid ref bypass
    expect(result).toBe(MARKERS.GRID_MARKER + MARKERS.ROW_MARKER + "ref" + MARKERS.KV_RELATION + MARKERS.GRID_REF + "0");
  });



  test("encodes nested objects into flattened multiple grids with references", () => {
    const input = {
      name: "hyu",
      addresses: {
        line1: "jl bandung",
        line2: "jl riau"
      }
    };
    const result = encode(input);
    // Should flatten into 2 grids: 
    // Grid 0 (outer object): GRID_MARKER ROW_MARKER name KV_RELATION hyu ROW_MARKER addresses KV_RELATION GRID_REF 1
    // Grid 1 (addresses): GRID_MARKER ROW_MARKER line1 KV_RELATION jl bandung ROW_MARKER line2 KV_RELATION jl riau
    const expected = 
      MARKERS.GRID_MARKER + MARKERS.ROW_MARKER + "name" + MARKERS.KV_RELATION + "hyu" + MARKERS.ROW_MARKER + "addresses" + MARKERS.KV_RELATION + MARKERS.GRID_REF + "1" +
      MARKERS.GRID_MARKER + MARKERS.ROW_MARKER + "line1" + MARKERS.KV_RELATION + "jl bandung" + MARKERS.ROW_MARKER + "line2" + MARKERS.KV_RELATION + "jl riau";
    
    expect(result).toBe(expected);
  });

  test("encodes deeply nested objects into flattened 3 grids with correct reference indexing", () => {
    const input = {
      code: 500,
      cause: {
        code: 501,
        cause: {
          code: 502
        }
      }
    };
    const result = encode(input);
    // Should flatten into 3 grids:
    // Grid 0 (main object): GRID_MARKER ROW_MARKER code KV_RELATION 500 ROW_MARKER cause KV_RELATION GRID_REF 2
    // Grid 1 (deepest cause): GRID_MARKER ROW_MARKER code KV_RELATION 502
    // Grid 2 (middle cause): GRID_MARKER ROW_MARKER code KV_RELATION 501 ROW_MARKER cause KV_RELATION GRID_REF 1
    const expected =
      MARKERS.GRID_MARKER + MARKERS.ROW_MARKER + "code" + MARKERS.KV_RELATION + "500" + MARKERS.ROW_MARKER + "cause" + MARKERS.KV_RELATION + MARKERS.GRID_REF + "2" +
      MARKERS.GRID_MARKER + MARKERS.ROW_MARKER + "code" + MARKERS.KV_RELATION + "502" +
      MARKERS.GRID_MARKER + MARKERS.ROW_MARKER + "code" + MARKERS.KV_RELATION + "501" + MARKERS.ROW_MARKER + "cause" + MARKERS.KV_RELATION + MARKERS.GRID_REF + "1";
    
    expect(result).toBe(expected);
  });

  test("encodes deeply nested JS Error Cause structures into flattened multi-grids", () => {
    const benchmarkError = {
      error: "Failed to fetch user profile",
      stack: [
        {
          at: "fetchUserProfile",
          file: "/app/src/api.ts",
          line: "120:5"
        },
        {
          at: "loadData",
          file: "/app/src/main.ts",
          line: "45:10"
        }
      ],
      cause: {
        error: "Connection timeout",
        stack: [
          {
            at: "Socket.onTimeout",
            file: "node:net",
            line: "950:12"
          },
          {
            at: "process.processTicksAndRejections",
            file: "node:internal/process/task_queues",
            line: "95:5"
          }
        ],
        cause: {
          error: "ECONNREFUSED 127.0.0.1:5432",
          stack: [
            {
              at: "TCP.onStreamRead",
              file: "node:internal/stream_base_commons",
              line: "190:23"
            }
          ]
        }
      }
    };

    const encoded = encode(benchmarkError);
    
    // Verify the correct flattened multi-grid representation is produced
    const expected =
      // Grid 0 (main outer error object)
      MARKERS.GRID_MARKER + MARKERS.ROW_MARKER + "error" + MARKERS.KV_RELATION + "Failed to fetch user profile" + MARKERS.ROW_MARKER + "stack" + MARKERS.KV_RELATION + MARKERS.GRID_REF + "1" + MARKERS.ROW_MARKER + "cause" + MARKERS.KV_RELATION + MARKERS.GRID_REF + "5" +
      // Grid 1 (stack trace of outer error)
      MARKERS.GRID_MARKER + MARKERS.COL_MARKER + "at" + MARKERS.ROW_SEP + "file" + MARKERS.ROW_SEP + "line" + 
      MARKERS.ROW_MARKER + "fetchUserProfile" + MARKERS.ROW_SEP + "/app/src/api.ts" + MARKERS.ROW_SEP + "120:5" +
      MARKERS.ROW_MARKER + "loadData" + MARKERS.ROW_SEP + "/app/src/main.ts" + MARKERS.ROW_SEP + "45:10" +
      // Grid 2 (stack trace of middle cause)
      MARKERS.GRID_MARKER + MARKERS.COL_MARKER + "at" + MARKERS.ROW_SEP + "file" + MARKERS.ROW_SEP + "line" + 
      MARKERS.ROW_MARKER + "Socket.onTimeout" + MARKERS.ROW_SEP + "node:net" + MARKERS.ROW_SEP + "950:12" +
      MARKERS.ROW_MARKER + "process.processTicksAndRejections" + MARKERS.ROW_SEP + "node:internal/process/task_queues" + MARKERS.ROW_SEP + "95:5" +
      // Grid 3 (stack trace of deepest cause)
      MARKERS.GRID_MARKER + MARKERS.COL_MARKER + "at" + MARKERS.ROW_SEP + "file" + MARKERS.ROW_SEP + "line" + 
      MARKERS.ROW_MARKER + "TCP.onStreamRead" + MARKERS.ROW_SEP + "node:internal/stream_base_commons" + MARKERS.ROW_SEP + "190:23" +
      // Grid 4 (deepest cause object)
      MARKERS.GRID_MARKER + MARKERS.ROW_MARKER + "error" + MARKERS.KV_RELATION + "ECONNREFUSED 127.0.0.1:5432" + MARKERS.ROW_MARKER + "stack" + MARKERS.KV_RELATION + MARKERS.GRID_REF + "3" +
      // Grid 5 (middle cause object)
      MARKERS.GRID_MARKER + MARKERS.ROW_MARKER + "error" + MARKERS.KV_RELATION + "Connection timeout" + MARKERS.ROW_MARKER + "stack" + MARKERS.KV_RELATION + MARKERS.GRID_REF + "2" + MARKERS.ROW_MARKER + "cause" + MARKERS.KV_RELATION + MARKERS.GRID_REF + "4";

    expect(encoded).toBe(expected);

    // Verify it decodes back perfectly
    const decoded = decode(encoded);
    const mainDecoded = decoded[decoded.length - 6];
    expect(mainDecoded.error).toBe("Failed to fetch user profile");
    expect(Array.isArray(mainDecoded.stack)).toBe(true);
    expect(mainDecoded.stack[0].at).toBe("fetchUserProfile");
    expect(mainDecoded.stack[0].file).toBe("/app/src/api.ts");
    expect(mainDecoded.stack[0].line).toBe("120:5");
    expect(mainDecoded.stack[1].at).toBe("loadData");

    const cause1 = mainDecoded.cause;
    expect(cause1.error).toBe("Connection timeout");
    expect(Array.isArray(cause1.stack)).toBe(true);
    expect(cause1.stack[0].at).toBe("Socket.onTimeout");

    const cause2 = cause1.cause;
    expect(cause2.error).toBe("ECONNREFUSED 127.0.0.1:5432");
    expect(Array.isArray(cause2.stack)).toBe(true);
  });

  test("deduplicates identical nested structures (Grid Deduplication / Grid Interning)", () => {
    const input = {
      alice: { role: "admin", level: "5" },
      bob: { role: "admin", level: "5" }
    };
    const encoded = encode(input, ENC_GRID_DEDUPLICATE);
    
    // Grid 0 (main outer object): GRID_MARKER ROW_MARKER alice KV_RELATION GRID_REF 1 ROW_MARKER bob KV_RELATION GRID_REF 1
    // Grid 1 (deduplicated role map): GRID_MARKER ROW_MARKER role KV_RELATION admin ROW_MARKER level KV_RELATION 5
    const expected =
      MARKERS.GRID_MARKER + MARKERS.ROW_MARKER + "alice" + MARKERS.KV_RELATION + MARKERS.GRID_REF + "1" + MARKERS.ROW_MARKER + "bob" + MARKERS.KV_RELATION + MARKERS.GRID_REF + "1" +
      MARKERS.GRID_MARKER + MARKERS.ROW_MARKER + "role" + MARKERS.KV_RELATION + "admin" + MARKERS.ROW_MARKER + "level" + MARKERS.KV_RELATION + "5";
      
    expect(encoded).toBe(expected);
    
    // Verify it decodes back perfectly to independent matching structures
    const decoded = decode(encoded);
    const mainDecoded = decoded[decoded.length - 2];
    expect(mainDecoded.alice.role).toBe("admin");
    expect(mainDecoded.alice.level).toBe("5");
    expect(mainDecoded.bob.role).toBe("admin");
    expect(mainDecoded.bob.level).toBe("5");
  });

  test("resolves valid nested grid references (GRID_REF 1) and resolves invalid/out-of-bounds references to null", () => {
    // 1. Valid nesting (GRID_REF 1 resolves to the nested object) & Negative test for GRID_REF 2 (out of bounds)
    const payloadValid = "░→name≡hyu→info≡※1→missing2≡※2░→role≡admin";
    const decodedValid = decode(payloadValid);
    const rootValid = decodedValid[0];
    expect(rootValid.name).toBe("hyu");
    expect(rootValid.info.role).toBe("admin");
    expect(rootValid.missing2).toBeNull(); // GRID_REF 2 is out of bounds, should resolve to null

    // 2. GRID_REF 0 reference (parent grid reference) resolves to null (biar hemat)
    const payloadParentRef = "░→self≡※0";
    const decodedParentRef = decode(payloadParentRef);
    const rootParentRef = decodedParentRef[0];
    expect(rootParentRef.self).toBeNull();

    // 3. Out-of-bounds reference (GRID_REF 99) resolves to null
    const payloadOutOfBounds = "░→missing≡※99";
    const decodedOutOfBounds = decode(payloadOutOfBounds);
    const rootOutOfBounds = decodedOutOfBounds[0];
    expect(rootOutOfBounds.missing).toBeNull();
  });

  test("GRID_REF edge cases: malformed references resolve correctly", () => {
    // ※ without number → parseInt("") = NaN → null
    const payloadNoNum = "░→x≡※";
    const decodedNoNum = decode(payloadNoNum);
    expect(decodedNoNum[0].x).toBeNull();

    // ※ + non-digit suffix → parseInt("abc") = NaN → null
    const payloadNonDigit = "░→x≡※abc";
    const decodedNonDigit = decode(payloadNonDigit);
    expect(decodedNonDigit[0].x).toBeNull();

    // ※ + negative index → parseInt("-1") = -1 → null (index -1 not in array)
    const payloadNegative = "░→x≡※-1";
    const decodedNegative = decode(payloadNegative);
    expect(decodedNegative[0].x).toBeNull();
  });

  test("triple nested grids (3 levels deep) resolve recursively", () => {
    // Grid 0: root → data ≡ ※1
    // Grid 1: child → items ≡ ※2
    // Grid 2: leaf → ["x", "y"]
    const payload = "░→data≡※1░→items≡※2░→x→y";
    const decoded = decode(payload);
    const root = decoded[0];
    expect(root.data.items[0]).toBe("x");
    expect(root.data.items[1]).toBe("y");
  });

  test("circular 2-grid reference: grid0→※1, grid1→※0 resolves gracefully", () => {
    // Grid 0 has ref to grid 1, grid 1 has ref to grid 0 (parent)
    // ※0 always resolves to null → no infinite loop
    const payload = "░→x≡※1░→ref≡※0";
    const decoded = decode(payload);
    const root = decoded[0];
    expect(root.x.ref).toBeNull(); // ※0 → null
  });

  test("undefined grid (※N where N never defined) resolves to null", () => {
    const payload = "░→a≡※5→b≡※3";
    const decoded = decode(payload);
    expect(decoded[0].a).toBeNull();
    expect(decoded[0].b).toBeNull();
  });
});
