import {
  MARKERS,
  TITLE_SYMBOL,
  NOT_FOUND,
  DECIMAL_RADIX,
  ID_OFFSET,
  unescape
} from "../util";

/**
 * Escaping-aware boundary finder.
 * Finds the next unescaped structural marker.
 */
function findBoundary(text: string, markers: string[], start: number = 0): { pos: number, marker: string | null } {
  let i = start;
  while (i < text.length) {
    const char = text[i]!;
    if (markers.includes(char)) {
      return { pos: i, marker: char };
    }
    i++;
  }
  return { pos: NOT_FOUND, marker: null };
}

/**
 * Escaping-aware splitter.
 */
function splitEscaped(text: string, marker: string): string[] {
  return text.split(marker);
}

/**
 * Reviver callback, called for every resolved value during decode.
 * Bottom-up traversal: deepest values first, then their containers.
 *
 * @param value - the resolved value (ref expanded, unescaped)
 * @param key   - the cell key (header name for grid rows, "" for root array)
 * @param parent - the parent container (row object, map, or root array)
 * @returns the value to use in place of the original. Return undefined to
 *   keep the original value.
 */
export type Reviver = (
  value: any,
  key: string | number,
  parent: any
) => any;

/**
 * Decodes a Set/Grid block string or fragment.
 */
function readGrid(blockString: string, resolve: (value: string) => any, reviver?: Reviver, parent?: any): any {
  const isFragment = blockString.startsWith(MARKERS.GRID_MARKER);
  const content = isFragment ? blockString.substring(ID_OFFSET) : blockString;

  // Detect title: content between GRID_MARKER and first unescaped COL_MARKER (if any)
  let title = "";
  let gridContent = content;
  const colPos = findFirstUnescaped(MARKERS.COL_MARKER, content);
  if (colPos !== -1) {
    title = unescape(content.substring(0, colPos));
    gridContent = content.substring(colPos);
  } else if (content.length > 0 && content[0] !== MARKERS.ROW_MARKER && findFirstUnescaped(MARKERS.TITLE_MARKER, content) === 0) {
    // Leading TITLE_MARKER marks a free title prefix; title is the segment before the first ROW_MARKER.
    const rowPos = findFirstUnescaped(MARKERS.ROW_MARKER, content);
    if (rowPos > 0) {
      title = unescape(content.substring(MARKERS.TITLE_MARKER.length, rowPos));
      gridContent = content.substring(rowPos);
    }
  }

  const rows = splitEscaped(gridContent, MARKERS.ROW_MARKER).filter(row => row !== "");
  const firstRow = rows.shift();
  if (!firstRow) return [];

  // 2D Set
  const hasHeaders = firstRow.startsWith(MARKERS.COL_MARKER);
  const headerRaw = hasHeaders ? firstRow.substring(ID_OFFSET) : firstRow;
  const cellsOfFirstRow = splitEscaped(headerRaw, MARKERS.ROW_SEP);

  // Apply reviver to a resolved cell value. Returns original if reviver absent.
  const revive = (val: any, key: string | number, par: any): any => {
    if (!reviver) return val;
    if (typeof val === "string" && val.startsWith(MARKERS.GRID_REF)) {
      return val;
    }
    const out = reviver(val, key, par);
    return out === undefined ? val : out;
  };

  let result: any;
  if (hasHeaders) {
    const headers = cellsOfFirstRow.map(resolve);
    result = rows.map(row => {
      const cells = splitEscaped(row, MARKERS.ROW_SEP);
      const rowObject: any = {};
      headers.forEach((header, index) => {
        const raw = cells[index] ?? "";
        const resolved = resolve(raw);
        rowObject[header] = revive(resolved, header, rowObject);
      });
      return rowObject;
    });
  } else {
    // Check if it is a Map (Metadata) block structurally
    const isMap = firstRow.includes(MARKERS.KV_RELATION);

    if (isMap) {
      const obj: any = {};
      const processRow = (row: string) => {
        const parts = splitEscaped(row, MARKERS.KV_RELATION);
        const key = resolve(parts[0]!);
        obj[key] = revive(resolve(parts[1]!), key, obj);
      };
      processRow(firstRow);
      rows.forEach(processRow);
      result = obj;
    } else {
      const grid = [cellsOfFirstRow.map(resolve), ...rows.map(row => splitEscaped(row, MARKERS.ROW_SEP).map(resolve))];
      if (grid.every(row => row.length === 1)) {
        result = grid.map(row => row[0]);
      } else {
        result = grid;
      }
    }
  }

  if (title) {
    result[TITLE_SYMBOL] = title;
  }
  return result;
}

/**
 * Finds the position of the first unescaped COL_MARKER (§) in the string.
 * Returns -1 if not found.
 */
function findFirstUnescaped(marker: string, text: string): number {
  return text.indexOf(marker);
}

function decodeGrids(adnString: string, reviver?: Reviver, ctx?: any): any[] {
  let cursor = 0;
  const blockMarkers = [MARKERS.GRID_MARKER];

  const firstGridIdx = adnString.indexOf(MARKERS.GRID_MARKER);
  if (firstGridIdx !== -1) {
    cursor = firstGridIdx;
  }

  // Build pool from interned values (supports both top-pool and bottom-pool Attention-First format)
  const pool: string[] = [];
  if (firstGridIdx > 0) {
    const topPart = adnString.substring(0, firstGridIdx);
    pool.push(...splitEscaped(topPart, MARKERS.VALUE_MARKER).filter(item => item !== ""));
  }
  if (firstGridIdx !== -1) {
    const rearPoolStart = adnString.indexOf(MARKERS.VALUE_MARKER, firstGridIdx);
    if (rearPoolStart !== -1) {
      const rearPart = adnString.substring(rearPoolStart);
      pool.push(...splitEscaped(rearPart, MARKERS.VALUE_MARKER).filter(item => item !== ""));
    }
  } else {
    pool.push(...splitEscaped(adnString, MARKERS.VALUE_MARKER).filter(item => item !== ""));
  }

  const resolve = (value: string): any => {
    let raw: string = value;
    if (value.startsWith(MARKERS.VALUE_REF)) {
      const index = parseInt(value.substring(MARKERS.VALUE_REF.length), DECIMAL_RADIX);
      raw = pool[index] !== undefined ? pool[index] : value;
    } else if (value.startsWith(MARKERS.GRID_REF)) {
      if (value === MARKERS.GRID_REF + "0") return null;
      return value;
    }

    if (ctx && typeof ctx.unescape === "function") {
      raw = ctx.unescape(raw);
    } else {
      raw = unescape(raw);
    }

    if (typeof raw === "string" && raw.startsWith(MARKERS.GRID_MARKER)) {
      return readGrid(raw, resolve, reviver);
    }
    return raw;
  };

  const decodedResults: any[] = [];
  while (cursor < adnString.length) {
    const marker = adnString[cursor];
    if (!blockMarkers.includes(marker!)) break;

    const { pos: nextBoundary } = findBoundary(adnString, [MARKERS.MZ_ENVELOPE_END, MARKERS.GRID_MARKER], cursor + ID_OFFSET);
    const actualEnd = nextBoundary === NOT_FOUND ? adnString.length : nextBoundary;
    const content = adnString.substring(cursor + ID_OFFSET, actualEnd);

    if (marker === MARKERS.GRID_MARKER) {
      decodedResults.push(readGrid(marker + content, resolve, reviver));
    }

    cursor = nextBoundary !== NOT_FOUND && adnString[nextBoundary] === MARKERS.MZ_ENVELOPE_END ? nextBoundary + MARKERS.MZ_ENVELOPE_END.length : actualEnd;
  }

  function resolveGridRefs(val: any, decodedResults: any[], reviver?: Reviver, parent?: any, key?: any): any {
    if (typeof val === "string" && val.startsWith(MARKERS.GRID_REF)) {
      const index = parseInt(val.substring(MARKERS.GRID_REF.length), DECIMAL_RADIX);
      if (index === 0) return null;
      const resolved = decodedResults[index] !== undefined ? decodedResults[index] : null;
      if (reviver) {
        const revived = reviver(resolved, key, parent);
        return revived === undefined ? resolved : revived;
      }
      return resolved;
    } else if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        val[i] = resolveGridRefs(val[i], decodedResults, reviver, val, i);
        if (reviver) {
          const revived = reviver(val[i], i, val);
          val[i] = revived === undefined ? val[i] : revived;
        }
      }
    } else if (typeof val === "object" && val !== null) {
      for (const k in val) {
        if (k === "Symbol(title)") continue;
        val[k] = resolveGridRefs(val[k], decodedResults, reviver, val, k);
        if (reviver) {
          const revived = reviver(val[k], k, val);
          val[k] = revived === undefined ? val[k] : revived;
        }
      }
    }
    return val;
  }

  for (let i = 0; i < decodedResults.length; i++) {
    let val = resolveGridRefs(decodedResults[i], decodedResults, reviver, decodedResults, i);
    if (reviver) {
      const revived = reviver(val, i, decodedResults);
      val = revived === undefined ? val : revived;
    }
    decodedResults[i] = val;
  }

  return decodedResults;
}

export { decodeGrids };

export function decode(adnString: string, ctx?: any): any[] {
  if (!adnString) throw new Error("Input string is required");

  const reviver = ctx && typeof ctx.reviver === "function" ? ctx.reviver : undefined;

  if (adnString.startsWith(MARKERS.MESSAGE_START)) {
    adnString = adnString.substring(MARKERS.MESSAGE_START.length);
  }

  const grids = decodeGrids(adnString, reviver, ctx);
  if (adnString.startsWith(MARKERS.VALUE_MARKER)) {
    const { pos: poolEndRelative } = findBoundary(adnString, [MARKERS.MZ_ENVELOPE_END, MARKERS.GRID_MARKER], 0);
    const poolEnd = poolEndRelative === NOT_FOUND ? adnString.length : poolEndRelative;
    const poolPart = adnString.substring(0, poolEnd);
    const pool = splitEscaped(poolPart, MARKERS.VALUE_MARKER).filter(item => item !== "");
    pool.push(...grids);
    return pool;
  }
  return grids;
}

export default decode
