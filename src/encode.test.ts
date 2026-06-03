import { expect, test, describe } from "bun:test";
import { encode, decode, ENC_GRID_DEDUPLICATE } from "./index";
import { GRID_MARKER, ROW_MARKER, KV_RELATION, GRID_REF, COL_MARKER, ROW_SEP } from "./util";

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
    // GRID_MARKER + a + ROW_MARKER + b + ROW_MARKER + c
    expect(result).toBe(GRID_MARKER + "a" + ROW_MARKER + "b" + ROW_MARKER + "c");
  });

  test("encodes an object (Map)", () => {
    const input = { key: "value" };
    const result = encode(input);
    // GRID_MARKER + ROW_MARKER + key + KV_RELATION + value
    expect(result).toBe(GRID_MARKER + ROW_MARKER + "key" + KV_RELATION + "value");
  });

  test("encodes grid references (※0) without escaping at the top-level", () => {
    const input = { ref: GRID_REF + "0" };
    const result = encode(input);
    // Should preserve GRID_REF + 0 as is (no escape) because of the grid ref bypass
    expect(result).toBe(GRID_MARKER + ROW_MARKER + "ref" + KV_RELATION + GRID_REF + "0");
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
    // Grid 0 (addresses): ⓖʀline1→jl bandungʀline2→jl riauⓩ
    // Grid 1 (outer object): ⓖʀname→hyuʀaddresses→※0ⓩ
    const expected = 
      
      GRID_MARKER + ROW_MARKER + "line1" + KV_RELATION + "jl bandung" + ROW_MARKER + "line2" + KV_RELATION + "jl riau" +
      GRID_MARKER + ROW_MARKER + "name" + KV_RELATION + "hyu" + ROW_MARKER + "addresses" + KV_RELATION + GRID_REF + "0";
    
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
    // Should flatten into 3 grids in post-order or bottom-up traversal:
    // Grid 0 (deepest cause): ⓖʀcode→502ⓩ
    // Grid 1 (middle cause): ⓖʀcode→501ʀcause→※0ⓩ
    // Grid 2 (main object): ⓖʀcode→500ʀcause→※1ⓩ
    const expected =
       +
      GRID_MARKER + ROW_MARKER + "code" + KV_RELATION + "502" +
      GRID_MARKER + ROW_MARKER + "code" + KV_RELATION + "501" + ROW_MARKER + "cause" + KV_RELATION + GRID_REF + "0" +
      GRID_MARKER + ROW_MARKER + "code" + KV_RELATION + "500" + ROW_MARKER + "cause" + KV_RELATION + GRID_REF + "1";
    
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
       +
      // Grid 0 (stack trace of outer error)
      GRID_MARKER + COL_MARKER + "at" + ROW_SEP + "file" + ROW_SEP + "line" + 
      ROW_MARKER + "fetchUserProfile" + ROW_SEP + "/app/src/api.ts" + ROW_SEP + "120:5" +
      ROW_MARKER + "loadData" + ROW_SEP + "/app/src/main.ts" + ROW_SEP + "45:10" +
      // Grid 1 (stack trace of middle cause)
      GRID_MARKER + COL_MARKER + "at" + ROW_SEP + "file" + ROW_SEP + "line" + 
      ROW_MARKER + "Socket.onTimeout" + ROW_SEP + "node:net" + ROW_SEP + "950:12" +
      ROW_MARKER + "process.processTicksAndRejections" + ROW_SEP + "node:internal/process/task_queues" + ROW_SEP + "95:5" +
      // Grid 2 (stack trace of deepest cause)
      GRID_MARKER + COL_MARKER + "at" + ROW_SEP + "file" + ROW_SEP + "line" + 
      ROW_MARKER + "TCP.onStreamRead" + ROW_SEP + "node:internal/stream_base_commons" + ROW_SEP + "190:23" +
      // Grid 3 (deepest cause object)
      GRID_MARKER + ROW_MARKER + "error" + KV_RELATION + "ECONNREFUSED 127.0.0.1:5432" + ROW_MARKER + "stack" + KV_RELATION + GRID_REF + "2" +
      // Grid 4 (middle cause object)
      GRID_MARKER + ROW_MARKER + "error" + KV_RELATION + "Connection timeout" + ROW_MARKER + "stack" + KV_RELATION + GRID_REF + "1" + ROW_MARKER + "cause" + KV_RELATION + GRID_REF + "3" +
      // Grid 5 (main outer error object)
      GRID_MARKER + ROW_MARKER + "error" + KV_RELATION + "Failed to fetch user profile" + ROW_MARKER + "stack" + KV_RELATION + GRID_REF + "0" + ROW_MARKER + "cause" + KV_RELATION + GRID_REF + "4";

    expect(encoded).toBe(expected);

    // Verify it decodes back perfectly
    const decoded = decode(encoded);
    const mainDecoded = decoded[decoded.length - 1];
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
    
    // Grid 0 (deduplicated role map): ⓖʀrole→adminʀlevel→5ⓩ
    // Grid 1 (main outer object): ⓖʀalice→※0ʀbob→※0ⓩ
    const expected =
       +
      GRID_MARKER + ROW_MARKER + "role" + KV_RELATION + "admin" + ROW_MARKER + "level" + KV_RELATION + "5" +
      GRID_MARKER + ROW_MARKER + "alice" + KV_RELATION + GRID_REF + "0" + ROW_MARKER + "bob" + KV_RELATION + GRID_REF + "0";
      
    expect(encoded).toBe(expected);
    
    // Verify it decodes back perfectly to independent matching structures
    const decoded = decode(encoded);
    const mainDecoded = decoded[decoded.length - 1];
    expect(mainDecoded.alice.role).toBe("admin");
    expect(mainDecoded.alice.level).toBe("5");
    expect(mainDecoded.bob.role).toBe("admin");
    expect(mainDecoded.bob.level).toBe("5");
  });
});
