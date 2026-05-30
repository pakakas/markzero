import {
  MZ_ID,
  CLOSE_MARKER,
  GRID_MARKER,
  ROW_MARKER,
  KV_RELATION,
  ROW_SEP,
  COL_MARKER,
  TITLE_MARKER,
  escape,
  ENC_VALUES,
  ENC_INTERN_ALL,
  ENC_GRID_DEDUPLICATE,
  GRID_REF,
  VALUE_REF,
  VALUE_MARKER,
  estimateTokenCount,
  isProfitable
} from "./util";

type BlockWriter = {
  writeSet: (blocks: any[], grid: any[], encodeFn: any) => string,
  writeMap: (blocks: any[], grid: any, encodeFn: any) => string,
  writeString: (blocks: any[], val: any, encodeFn: any) => string,
  writeTitle: (blocks: any[], val: any, encodeFn: any) => string
};

const MODE_DEFAULT = 0;

const encoders: any = {};

function isNestedStructure(val: any): boolean {
  return typeof val === "object" && val !== null && !(val instanceof Date) && !(val instanceof RegExp);
}

function pushBlock(blocks: any[], serialized: string, deduplicate: boolean): string {
  if (deduplicate) {
    const existingIndex = blocks.indexOf(serialized);
    if (existingIndex !== -1) {
      return GRID_REF + existingIndex;
    }
  }
  blocks.push(serialized);
  return GRID_REF + (blocks.length - 1);
}


function isUniformGrid(arr: any[]): boolean {
  return arr.every(item => typeof item === "object" && item !== null && !Array.isArray(item) && !(item instanceof Date) && !(item instanceof RegExp));
}

function is2DMatrix(arr: any[]): boolean {
  return arr.every(item => Array.isArray(item));
}

function createEncoder(mode: number, writer: BlockWriter) {
  encoders[mode] = function(blocks: any[], customEscape: (text: string, isKey?: boolean) => string, encodingMode: number = MODE_DEFAULT) {
    const encodeFn = function(input: any): string {
      let prefix = "";
      if (input && typeof input === 'object' && 'title' in input && input.title) {
        prefix = writer.writeTitle(blocks, input.title, encodeFn);
      }
      
      let content = "";
      if (Array.isArray(input)) {
        content = writer.writeSet(blocks, input, encodeFn);
      } else if (typeof input === 'object' && input !== null) {
        content = writer.writeMap(blocks, input, encodeFn);
      } else {
        content = writer.writeString(blocks, input, encodeFn);
      }
      return prefix + content;
    };
    
    (encodeFn as any).escape = customEscape;
    (encodeFn as any).deduplicate = (encodingMode & ENC_GRID_DEDUPLICATE) !== 0;
    
    for (const target in writer) {
      if (Object.prototype.hasOwnProperty.call(writer, target)) {
        (encodeFn as any)[target] = function(value: any) {
          return writer[target as keyof BlockWriter](blocks, value, encodeFn);
        };
      }
    }
    return encodeFn;
  };
  return encoders[mode];
}

createEncoder(MODE_DEFAULT, {
  writeSet(blocks: any[], grid: any[], encodeFn: any) {
    if (grid.length === 0) {
      return GRID_MARKER + CLOSE_MARKER;
    }
    
    const customEscape = encodeFn.escape;
    
    if (isUniformGrid(grid)) {
      const headersSet = new Set<string>();
      for (const item of grid) {
        for (const k in item) {
          if (k !== "title") {
            headersSet.add(k);
          }
        }
      }
      const headers = Array.from(headersSet);
      const headerRow = COL_MARKER + headers.map(h => customEscape(h, true)).join(ROW_SEP);
      const rows = grid.map(item => {
        return headers.map(header => {
          const val = item[header];
          if (val === undefined || val === null) return "";
          if (isNestedStructure(val)) {
            const serialized = encodeFn(val);
            return pushBlock(blocks, serialized);
          }
          return customEscape(String(val), false);
        }).join(ROW_SEP);
      });
      return GRID_MARKER + [headerRow, ...rows].join(ROW_MARKER) + CLOSE_MARKER;
    }
    
    if (is2DMatrix(grid)) {
      const rows = grid.map(row => {
        return row.map((val: any) => {
          if (val === undefined || val === null) return "";
          if (isNestedStructure(val)) {
            const serialized = encodeFn(val);
            return pushBlock(blocks, serialized);
          }
          return customEscape(String(val), false);
        }).join(ROW_SEP);
      });
      return GRID_MARKER + rows.join(ROW_MARKER) + CLOSE_MARKER;
    }
    
    const items = grid.map(val => {
      if (val === undefined || val === null) return "";
      if (isNestedStructure(val)) {
        const serialized = encodeFn(val);
        return pushBlock(blocks, serialized, encodeFn.deduplicate);
      }
      return customEscape(String(val), false);
    });
    return GRID_MARKER + items.join(ROW_MARKER) + CLOSE_MARKER;
  },
  
  writeMap(blocks: any[], grid: any, encodeFn: any) {
    const customEscape = encodeFn.escape;
    let mapStr = GRID_MARKER;
    for (const k in grid) {
      if (k === "title") continue;
      const val = grid[k];
      let valStr = "";
      if (isNestedStructure(val)) {
        const serialized = encodeFn(val);
        valStr = pushBlock(blocks, serialized, encodeFn.deduplicate);
      } else {
        valStr = customEscape(String(val), false);
      }
      mapStr += ROW_MARKER + customEscape(k, true) + KV_RELATION + valStr;
    }
    return mapStr + CLOSE_MARKER;
  },
  
  writeString(blocks: any[], val: any, encodeFn: any) {
    return encodeFn.escape(String(val), false);
  },
  
  writeTitle(blocks: any[], val: any, encodeFn: any) {
    return TITLE_MARKER + escape(String(val)) + CLOSE_MARKER;
  }
});

function buildTokenPool(input: any, mode: number): { pool: string[], refMap: Map<string, string> } {
  const pool: string[] = [];
  const refMap = new Map<string, string>();
  const isValuesMode = (mode & ENC_VALUES) !== 0;
  const isInternAllMode = (mode & ENC_INTERN_ALL) !== 0;
  if (!isValuesMode && !isInternAllMode) {
    return { pool, refMap };
  }

  const freqMap = new Map<string, number>();

  function collect(val: any) {
    if (val === null || val === undefined) return;
    if (typeof val === "object") {
      if (val instanceof Date || val instanceof RegExp) {
        const s = String(val);
        freqMap.set(s, (freqMap.get(s) || 0) + 1);
      } else if (Array.isArray(val)) {
        for (const item of val) {
          collect(item);
        }
      } else {
        for (const k in val) {
          if (k === "title") continue;
          // Collect both key and value as candidates in both modes
          const sKey = String(k);
          freqMap.set(sKey, (freqMap.get(sKey) || 0) + 1);
          collect(val[k]);
        }
      }
    } else if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
      const s = String(val);
      freqMap.set(s, (freqMap.get(s) || 0) + 1);
    }
  }

  collect(input);

  const candidates: string[] = [];
  for (const [str, freq] of freqMap.entries()) {
    if (!str) continue;
    const tokenLen = estimateTokenCount(str);
    if (isProfitable(freq, tokenLen, 1)) {
      candidates.push(str);
    }
  }

  for (let i = 0; i < candidates.length; i++) {
    const s = candidates[i]!;
    pool.push(s);
    refMap.set(s, VALUE_REF + i);
  }

  return { pool, refMap };
}

// AI Agent hanya membutuhkan representasi struktural/relasional kontekstual (Array/Object non-kosong)
// untuk dapat bernalar (reasoning) secara efisien. Format berorientasi manusia atau struktur data primitif,
// kosong (contoh: []), serta objek bawaan (seperti Date dan RegExp) ditolak karena tidak mengandung 
// struktur semantik relasional yang dapat diurai oleh Agent.
// Contoh input terstruktur yang valid: [meta, meta2, data] atau objek pasangan key-value.
function assert(input: any): void {
  if (
    typeof input !== "object" || 
    input === null || 
    input instanceof Date || 
    input instanceof RegExp ||
    (Array.isArray(input) && input.length === 0) ||
    (!Array.isArray(input) && Object.keys(input).length === 0)
  ) {
    throw new TypeError("Invalid input type. MarkZero encode only accepts non-empty Array or Object.");
  }
}

function createMainBlock(input: any, encodeFn: any): string {
  if (
    Array.isArray(input) &&
    // Array objek homogen (DoD/tabel) dibiarkan utuh sebagai satu grid tunggal
    // Contoh: [{name: "a"}, {name: "b"}] -> isUniformGrid(input) === false
    isUniformGrid(input) === false &&
    // Matriks 2D homogen dibiarkan utuh sebagai satu matriks grid tunggal
    // Contoh: [["1", "0"], ["0", "1"]] -> is2DMatrix(input) === false
    is2DMatrix(input) === false &&
    // Array heterogen bersarang layak dipecah menjadi multi-grid agar perhatian LLM lebih efisien
    // Contoh: [{title: "Main"}, [["1", "0"]]] -> memicu pemecahan rekursif
    input.some(isNestedStructure)
  ) {
    return input.map(item => encodeFn(item)).join("");
  }

  return encodeFn(input);
}

export function encode(input: any, encodingMode: number = MODE_DEFAULT): string {
  assert(input);
  
  const { pool, refMap } = buildTokenPool(input, encodingMode);
  
  const customEscape = (text: string, isKey: boolean = false): string => {
    const source = String(text ?? "");
    if (isKey && (encodingMode & ENC_INTERN_ALL) === 0) {
      return escape(source);
    }
    if (refMap.has(source)) {
      return refMap.get(source)!;
    }
    return escape(source);
  };

  const blocks: any[] = [];
  const baseMode = encodingMode & (ENC_VALUES | ENC_INTERN_ALL);
  const encodeFn = (encoders[baseMode] || encoders[MODE_DEFAULT])(blocks, customEscape, encodingMode);

  const mainBlock = createMainBlock(input, encodeFn);
  
  const poolStr = pool.length > 0 ? VALUE_MARKER + pool.join(VALUE_MARKER) + CLOSE_MARKER : "";
  return MZ_ID + poolStr + blocks.join("") + mainBlock;
}
