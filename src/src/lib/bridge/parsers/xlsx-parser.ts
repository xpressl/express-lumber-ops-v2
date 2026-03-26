/** XLSX parser placeholder
 * In production, use a library like 'xlsx' or 'exceljs'
 * For now this exports the interface and a stub
 */

export interface XLSXParseResult {
  headers: string[];
  rows: Array<{ rowNumber: number; data: Record<string, string> }>;
  totalRows: number;
  errors: string[];
}

/** Parse XLSX buffer (placeholder - requires xlsx library) */
export function parseXLSX(_buffer: Buffer): XLSXParseResult {
  // TODO: Implement with xlsx or exceljs library
  // Example: const workbook = XLSX.read(buffer); const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return {
    headers: [],
    rows: [],
    totalRows: 0,
    errors: ["XLSX parsing not yet implemented - install 'xlsx' package"],
  };
}
