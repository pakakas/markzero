import {
  CLOSE_MARKER,
  ESCAPE_CHAR,
  ESCAPE_SEQUENCE_LENGTH,
  VALUE_MARKER,
  GRID_MARKER,
  TITLE_MARKER,
  COL_MARKER,
  ROW_SEP,
  ROW_MARKER,
  KV_RELATION,
  VALUE_REF,
  GRID_REF,
  NOT_FOUND,
  DECIMAL_RADIX,
  ID_OFFSET,
  ALL_MARKERS,
  unescape,
  MZ_ID
} from "./util";



/**
 * Escaping-aware boundary finder.
 * Finds the next unescaped structural marker.
 */
function findBoundary(text: string, markers: string[], start: number = 0): { pos: number, marker: string | null } {
  let i = start;
  while (i < text.length) {
    const char = text[i]!;
    if (char === ESCAPE_CHAR) { // Explicitly check for escape char
        if (i + ESCAPE_SEQUENCE_LENGTH <= text.length && ALL_MARKERS.includes(text[i + ESCAPE_CHAR.length]!)) {
            i += ESCAPE_SEQUENCE_LENGTH;
            continue;
        }
    }
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
  const parts: string[] = [];
  let current = "";
  let i = 0;
  while (i < text.length) {
    if (text[i] === ESCAPE_CHAR && i + ESCAPE_CHAR.length < text.length && text[i + ESCAPE_CHAR.length] === marker) {
        current += ESCAPE_CHAR + marker;
        i += ESCAPE_SEQUENCE_LENGTH;
    } else if (text[i] === marker) {
        parts.push(current);
        current = "";
        i++;
    } else {
        current += text[i];
        i++;
    }
  }
  parts.push(current);
  return parts;
}

/**
 * Decodes a Set/Grid block string or fragment.
 */
function readGrid(blockString: string, resolve: (value: string) => any): any {
  const isFragment = blockString.startsWith(GRID_MARKER);
  const content = isFragment ? blockString.substring(ID_OFFSET) : blockString;
  
  const rows = splitEscaped(content, ROW_MARKER).filter(row => row !== "");
  const firstRow = rows.shift();
  if (!firstRow) return [];

  // 2D Set
  const hasHeaders = firstRow.startsWith(COL_MARKER);
  const headerRaw = hasHeaders ? firstRow.substring(ID_OFFSET) : firstRow;
  const cellsOfFirstRow = splitEscaped(headerRaw, ROW_SEP);

  if (hasHeaders) {
    const headers = cellsOfFirstRow.map(resolve);
    return rows.map(row => {
      const cells = splitEscaped(row, ROW_SEP);
      const rowObject: any = {};
      headers.forEach((header, index) => { rowObject[header] = cells[index] ? resolve(cells[index]) : ""; });
      return rowObject;
    });
  } else {
    // Check if it is a Map (Metadata) block structurally
    const isMap = firstRow.includes(KV_RELATION);

    if (isMap) {
      const obj: any = {};
      const allRows = [firstRow, ...rows];
      allRows.forEach(row => {
        const parts = splitEscaped(row, KV_RELATION);
        const key = resolve(parts[0]!);
        const val = resolve(parts[1]!);
        obj[key] = val;
      });
      return obj;
    }

    const grid = [cellsOfFirstRow.map(resolve), ...rows.map(row => splitEscaped(row, ROW_SEP).map(resolve))];
    if (grid.every(row => row.length === 1)) {
      return grid.map(row => row[0]);
    }
    return grid;
  }
}

/**
 * Decodes a MarkZero string into an array of Data Blocks.
 */
export function decode(m0String: string): any[] {
  if (!m0String) throw new Error("Input string is required");

  if (m0String.startsWith(MZ_ID)) {
    m0String = m0String.substring(MZ_ID.length);
  }

  let pool: string[] = [];
  let cursor = 0;
  const blockMarkers = [GRID_MARKER, TITLE_MARKER];

  const { pos: poolEndRelative } = findBoundary(m0String, [CLOSE_MARKER, GRID_MARKER, TITLE_MARKER], 0);
  const poolEnd = poolEndRelative === NOT_FOUND ? m0String.length : poolEndRelative;
  const poolPart = m0String.substring(0, poolEnd);
  pool = splitEscaped(poolPart, VALUE_MARKER).filter(item => item !== "");
  cursor = poolEndRelative !== NOT_FOUND && m0String[poolEndRelative] === CLOSE_MARKER ? poolEndRelative + CLOSE_MARKER.length : poolEnd;

  const decodedResults: any[] = [];
  const resolve = (value: string): any => {
    let raw: string = value;
    if (value.startsWith(VALUE_REF)) {
      const index = parseInt(value.substring(VALUE_REF.length), DECIMAL_RADIX);
      raw = pool[index] !== undefined ? pool[index] : value;
    } else if (value.startsWith(GRID_REF)) {
      const index = parseInt(value.substring(GRID_REF.length), DECIMAL_RADIX);
      return decodedResults[index] !== undefined ? decodedResults[index] : null;
    } else {
      raw = unescape(value);
    }

    // Note: Recursive MZ decoding heuristic was removed because MZ_ID is now purely protocol-level.
    return raw;
  };

  // 2. Extract Payload Blocks
  let currentTitle = "";

  while (cursor < m0String.length) {
    const marker = m0String[cursor];
    if (!blockMarkers.includes(marker!)) {
      break;
    }

    const { pos: nextBoundary } = findBoundary(m0String, [CLOSE_MARKER, GRID_MARKER, TITLE_MARKER], cursor + ID_OFFSET);
    const actualEnd = nextBoundary === NOT_FOUND ? m0String.length : nextBoundary;
    const content = m0String.substring(cursor + ID_OFFSET, actualEnd);

    if (marker === TITLE_MARKER) {
      currentTitle = resolve(content);
    }
    else if (marker === GRID_MARKER) {
      const decodedRows = readGrid(marker + content, resolve);
      if (currentTitle) {
        decodedRows[Symbol.for('title')] = currentTitle;
        currentTitle = "";
      }
      decodedResults.push(decodedRows);
    }

    cursor = nextBoundary !== NOT_FOUND && m0String[nextBoundary] === CLOSE_MARKER ? nextBoundary + CLOSE_MARKER.length : actualEnd;
  }

  return [...pool, ...decodedResults];
}
