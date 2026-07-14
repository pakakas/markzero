import {
  MARKERS,
  TITLE_SYMBOL,
  escape,
  ENC_VALUES,
  ENC_INTERN_ALL,
  ENC_GRID_DEDUPLICATE,
  estimateTokenCount,
  isProfitable,
} from "../util";

function readTitle(grid: any): string {
  return String(grid[TITLE_SYMBOL] || "");
}

function scalarToString(val: any): string {
  if (val === true) return MARKERS.BOOL_TRUE;
  if (val === false) return MARKERS.BOOL_FALSE;
  if (val === null || val === undefined) return MARKERS.NULL_MARKER;
  return String(val);
}

type BlockWriter = {
  writeSet: (blocks: any[], grid: any[], encodeFn: any) => string,
  writeMap: (blocks: any[], grid: any, encodeFn: any) => string,
  writeString: (blocks: any[], val: any, encodeFn: any) => string
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
      return MARKERS.GRID_REF + (existingIndex + 1);
    }
  }
  blocks.push(serialized);
  return MARKERS.GRID_REF + blocks.length;
}


function isUniformGrid(arr: any[]): boolean {
  return arr.every(item => typeof item === "object" && item !== null && !Array.isArray(item) && !(item instanceof Date) && !(item instanceof RegExp));
}

function is2DMatrix(arr: any[]): boolean {
  return arr.every(item => Array.isArray(item));
}

/** Strip trailing empty cells to save tokens — decoder infers missing cells as "" */
function trimTrailing(cells: string[]): string[] {
  let end = cells.length;
  while (end > 0 && cells[end - 1] === "") end--;
  return cells.slice(0, end);
}

function createEncoder(mode: number, writer: BlockWriter) {
  encoders[mode] = function(blocks: any[], customEscape: (text: string, isKey?: boolean) => string, encodingMode: number = MODE_DEFAULT) {
    const encodeFn = function(input: any): string {
      let content = "";
      if (Array.isArray(input)) {
        content = writer.writeSet(blocks, input, encodeFn);
      } else if (typeof input === 'object' && input !== null) {
        content = writer.writeMap(blocks, input, encodeFn);
      } else {
        content = writer.writeString(blocks, input, encodeFn);
      }
      return content;
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
      return MARKERS.GRID_MARKER;
    }
    
    const customEscape = encodeFn.escape;
    const ctx = encodeFn.context;

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
      const headerRow = MARKERS.COL_MARKER + headers.map(h => customEscape(h, true)).join(MARKERS.ROW_SEP);
      const rows = grid.map(item => {
        const cells = headers.map(header => {
          const val = item[header];
          if (val === undefined || val === null) return MARKERS.NULL_MARKER;
          if (isNestedStructure(val)) {
            const serialized = encodeFn(val);
            return pushBlock(blocks, serialized, false);
          }
          return customEscape(scalarToString(val), false);
        });
        return trimTrailing(cells).join(MARKERS.ROW_SEP);
      });
      const title = readTitle(grid);
      // When title is present AND col header is present, title is implicit (no TITLE_MARKER).
      // When title is present AND no col header, TITLE_MARKER is REQUIRED.
      const titleStr = title
        ? (headers.length > 0 ? escape(title, ctx) : MARKERS.TITLE_MARKER + escape(title, ctx))
        : "";
      return MARKERS.GRID_MARKER + titleStr + [headerRow, ...rows].join(MARKERS.ROW_MARKER);
    }

    if (is2DMatrix(grid)) {
      const title = readTitle(grid);
      const titleStr = title ? MARKERS.TITLE_MARKER + escape(title, ctx) : "";
      const rows = grid.map(row => {
        const cells = row.map((val: any) => {
          if (val === undefined || val === null) return MARKERS.NULL_MARKER;
          if (isNestedStructure(val)) {
            const serialized = encodeFn(val);
            return pushBlock(blocks, serialized, false);
          }
          return customEscape(scalarToString(val), false);
        });
        return trimTrailing(cells).join(MARKERS.ROW_SEP);
      });
      if (rows.length === 0) return MARKERS.GRID_MARKER;
      // Anonymous matrix (no bound title): first row's ROW_MARKER is optional.
      return MARKERS.GRID_MARKER + titleStr + rows.map((r, i) => title || i > 0 ? MARKERS.ROW_MARKER + r : r).join("");
    }
    
    const items = grid.map(val => {
      if (val === undefined || val === null) return MARKERS.NULL_MARKER;
      if (isNestedStructure(val)) {
        const serialized = encodeFn(val);
        return pushBlock(blocks, serialized, encodeFn.deduplicate);
      }
      return customEscape(scalarToString(val), false);
    });
    if (items.length === 0) return MARKERS.GRID_MARKER;
    const title = readTitle(grid);
    const titleStr = title ? MARKERS.TITLE_MARKER + escape(title, ctx) : "";
    // Anonymous set (no bound title, no col header): first item's ROW_MARKER is optional.
    return MARKERS.GRID_MARKER + titleStr + items.map((it, i) => title || i > 0 ? MARKERS.ROW_MARKER + it : it).join("");
  },
  
  writeMap(blocks: any[], grid: any, encodeFn: any) {
    const customEscape = encodeFn.escape;
    let mapStr = MARKERS.GRID_MARKER;
    for (const k in grid) {
      if (k === "Symbol(title)") continue;
      const val = grid[k];
      let valStr = "";
      if (isNestedStructure(val)) {
        const serialized = encodeFn(val);
        valStr = pushBlock(blocks, serialized, encodeFn.deduplicate);
      } else {
        valStr = customEscape(scalarToString(val), false);
      }
      mapStr += MARKERS.ROW_MARKER + customEscape(k, true) + MARKERS.KV_RELATION + valStr;
    }
    return mapStr;
  },
  
  writeString(blocks: any[], val: any, encodeFn: any) {
    return encodeFn.escape(scalarToString(val), false);
  }
});

function buildValuePool(input: any, mode: number): { pool: string[], refMap: Map<string, string> } {
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
          if (k === "Symbol(title)") continue;
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
    refMap.set(s, MARKERS.VALUE_REF + i);
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

export function encode(input: any, encodingModeOrContext?: any, context?: any): string {
  assert(input);
  
  let mode = MODE_DEFAULT;
  let ctx: any;
  if (typeof encodingModeOrContext === "number") {
    mode = encodingModeOrContext;
    ctx = context;
  } else if (encodingModeOrContext && typeof encodingModeOrContext === "object") {
    ctx = encodingModeOrContext;
  }
  
  const { pool, refMap } = buildValuePool(input, mode);
  
  const customEscape = (text: string, isKey: boolean = false): string => {
    const source = String(text ?? "");
    if (isKey && (mode & ENC_INTERN_ALL) === 0) {
      return escape(source, ctx);
    }
    if (refMap.has(source)) {
      return refMap.get(source)!;
    }
    return escape(source, ctx);
  };

  const blocks: any[] = [];
  const baseMode = mode & (ENC_VALUES | ENC_INTERN_ALL);
  const encoderCreator = encoders[baseMode] || encoders[MODE_DEFAULT];
  const encodeFn = encoderCreator(blocks, customEscape, mode);
  (encodeFn as any).context = ctx;

  const mainBlock = createMainBlock(input, encodeFn);

  const poolStr = pool.length > 0 ? MARKERS.VALUE_MARKER + pool.join(MARKERS.VALUE_MARKER) : "";
  return poolStr + mainBlock + blocks.join("");
}

export default encode