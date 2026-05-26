import {
  MZ_ID,
  VALUE_MARKER,
  GRID_MARKER,
  TITLE_MARKER,
  COL_MARKER,
  ROW_SEP,
  ROW_MARKER,
  KV_RELATION,
  VALUE_REF,
  EMPTY_SIZE,
  INITIAL_COUNT,
  INCREMENT,
  DEFAULT_INDEX_LEN,
  ENC_VALUES,
  ENC_INTERN_ALL,
  isProfitable,
  estimateTokenCount,
  escape,
  MAPPED_KEY
} from "./util";

// Minimum character length threshold (3). Interning strings shorter than 3 characters is mathematically
// unprofitable because the VALUE_MARKER and pointer referencing costs ((VALUE_REF or GRID_REF) + index) will always exceed the original length.
const MIN_POOL_TEXT_LENGTH = 3;

/**
 * Encodes a 2D array or Array of Objects into a Grid string fragment.
 */
function writeGrid(grid: any[], encodingMode?: number, value?: (val: any) => string): string {
  if (grid.length === EMPTY_SIZE) return GRID_MARKER;
  const isObjectSet = grid.length > EMPTY_SIZE && typeof grid[MAPPED_KEY] === 'object' && !Array.isArray(grid[MAPPED_KEY]) && grid[MAPPED_KEY] !== null;

  const resolve = value || ((val: any) => {
    if (typeof val === 'object' && val !== null) return escape(encode(val, encodingMode));
    return escape(String(val ?? ""));
  });

  if (isObjectSet) {
    const headers = Object.keys(grid[MAPPED_KEY]);
    const headerRow = headers.map(header => (encodingMode === ENC_INTERN_ALL) ? resolve(header) : escape(header)).join(ROW_SEP);
    const dataRows = grid.map(row => `${ROW_MARKER}${headers.map(header => resolve(row[header])).join(ROW_SEP)}`).join("");
    return `${GRID_MARKER}${COL_MARKER}${headerRow}${dataRows}`;
  } else {
    const dataRows = grid.map((rowOrCell: any, index) => {
      const rowContent = Array.isArray(rowOrCell)
        ? rowOrCell.map(cell => resolve(cell)).join(ROW_SEP)
        : resolve(rowOrCell);
      return index === 0 ? rowContent : `${ROW_MARKER}${rowContent}`;
    }).join("");
    return `${GRID_MARKER}${dataRows}`;
  }
}

/**
 * Encodes data into MarkZero notation.
 */
export function encode(input: any, encodingMode?: number): string {
  const normalizedBlocks: any[] = [];
  
  let blocks: any[] = [];
  if (Array.isArray(input)) {
    const first = input[0];
    
    // Heuristic: If it's a 1D array of primitives (or empty array), treat as a single Set block
    const is1DSet = input.length === 0 || (input.length > 0 && typeof first !== 'object');
    
    // Heuristic: If all elements are plain objects without titles, treat as a single Set block
    const isUniformSet = input.length > 0 && input.every(item => 
      typeof item === 'object' && item !== null && !item.title && !Array.isArray(item)
    );

    if (is1DSet || isUniformSet) {
      blocks = [input];
    } else {
      blocks = input;
    }
  } else {
    blocks = [input];
  }

  blocks.forEach(block => {
    if (Array.isArray(block)) {
      normalizedBlocks.push(block);
    } else if (typeof block === 'object' && block !== null) {
      if (block.title) {
        normalizedBlocks.push({ title: block.title });
        const metadata: any = {};
        Object.entries(block).forEach(([key, value]) => { if (key !== 'title') metadata[key] = value; });
        if (Object.keys(metadata).length > EMPTY_SIZE) normalizedBlocks.push(metadata);
      } else {
        const metadata: any = {};
        Object.entries(block).forEach(([key, value]) => { metadata[key] = value; });
        normalizedBlocks.push(metadata);
      }
    }
  });

  if (normalizedBlocks.length === 0) return "";

  const frequencyMap = new Map<string, number>();
  const mapKeys = new Set<string>();

  const collectFrequencies = (value: any) => {
    if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
            value.forEach(collectFrequencies);
        } else {
            Object.entries(value).forEach(([key, val]) => {
                if (key !== 'title') {
                    mapKeys.add(key);
                    collectFrequencies(key);
                    collectFrequencies(val);
                }
            });
        }
        return;
    }
    const text = String(value ?? "");
    if (text === "") return;
    frequencyMap.set(text, (frequencyMap.get(text) || INITIAL_COUNT) + INCREMENT);
  };

  normalizedBlocks.forEach(block => {
    if (block.title) collectFrequencies(block.title);
    else if (Array.isArray(block)) {
      const isObjectSet = block.length > EMPTY_SIZE && typeof block[MAPPED_KEY] === 'object' && !Array.isArray(block[MAPPED_KEY]) && block[MAPPED_KEY] !== null;
      if (isObjectSet) {
        const headers = Object.keys(block[MAPPED_KEY]);
        headers.forEach(collectFrequencies);
        block.forEach(row => headers.forEach(header => collectFrequencies(row[header])));
      } else {
        block.forEach((row: any) => Array.isArray(row) ? row.forEach(collectFrequencies) : collectFrequencies(row));
      }
    } else {
      Object.entries(block).forEach(([key, value]) => { 
        mapKeys.add(key);
        collectFrequencies(key); 
        collectFrequencies(value); 
      });
    }
  });

  const poolMap = new Map<string, number>();
  const poolArray: string[] = [];

  // Map keys are only interned in the Token Pool in ENC_INTERN_ALL mode if profitable
  if (encodingMode === ENC_INTERN_ALL) {
    mapKeys.forEach(key => {
      if (poolMap.has(key)) return;
      if (key.length < MIN_POOL_TEXT_LENGTH) return;
      const frequency = frequencyMap.get(key) ?? INCREMENT;
      const tokenLength = estimateTokenCount(key);
      if (isProfitable(frequency, tokenLength, DEFAULT_INDEX_LEN)) {
        poolMap.set(key, poolArray.length);
        poolArray.push(key);
      }
    });
  }

  // Values are only interned in ENC_VALUES or ENC_INTERN_ALL mode if profitable
  if (encodingMode === ENC_VALUES || encodingMode === ENC_INTERN_ALL) {
    frequencyMap.forEach((frequency, text) => {
      if (poolMap.has(text)) return;

      // Avoid interning structural markers if they were escaped as literals
      if (text.length < MIN_POOL_TEXT_LENGTH) return; 

      const tokenLength = estimateTokenCount(text);
      const indexTokenLength = DEFAULT_INDEX_LEN; 

      if (isProfitable(frequency, tokenLength, indexTokenLength)) {
        poolMap.set(text, poolArray.length);
        poolArray.push(text);
      }
    });
  }

  const resolve = (val: any): string => {
    if (typeof val === 'object' && val !== null) {
        return escape(encode(val, encodingMode));
    }
    const text = String(val ?? "");
    return poolMap.has(text) ? `${VALUE_REF}${poolMap.get(text)}` : escape(text);
  };

  const payloadParts = normalizedBlocks.map(block => {
    if (block.title) return `${TITLE_MARKER}${resolve(block.title)}`;
    if (Array.isArray(block)) return writeGrid(block, encodingMode, resolve);
    const metaItems = Object.entries(block)
      .map(([key, val], index) => {
          const k = resolve(key); // Map key is resolved (to ¤ pointer if in pool, or literal if not)
          const value = resolve(val);
          const rowContent = `${k}${KV_RELATION}${value}`;
          return index === 0 ? rowContent : `${ROW_MARKER}${rowContent}`;
      }).join("");
    return `${GRID_MARKER}${metaItems}`;
  });

  const poolPart = poolArray.map(entry => `${VALUE_MARKER}${escape(entry)}`).join("");
  return `${MZ_ID}${poolPart}${payloadParts.join("")}`;
}
