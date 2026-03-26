/** Simple CSV parser for import files */
export interface ParsedRow {
  rowNumber: number;
  data: Record<string, string>;
}

export interface ParseResult {
  headers: string[];
  rows: ParsedRow[];
  totalRows: number;
  errors: string[];
}

/** Parse CSV content into structured rows */
export function parseCSV(content: string): ParseResult {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [], totalRows: 0, errors: ["Empty file"] };

  const headers = parseCSVLine(lines[0]!);
  const rows: ParsedRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]!);
      const data: Record<string, string> = {};
      headers.forEach((h, idx) => { data[h] = values[idx] ?? ""; });
      rows.push({ rowNumber: i, data });
    } catch (e) {
      errors.push(`Row ${i}: ${e instanceof Error ? e.message : "Parse error"}`);
    }
  }

  return { headers, rows, totalRows: rows.length, errors };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i]!;
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}
