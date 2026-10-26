import * as XLSX from 'xlsx';

/**
 * Indonesian month names mapping to 2-digit format.
 */
const ID_MONTHS: Record<string, string> = {
  januari: '01',
  jan: '01',
  februari: '02',
  pebruari: '02',
  feb: '02',
  maret: '03',
  mar: '03',
  april: '04',
  apr: '04',
  mei: '05',
  may: '05',
  juni: '06',
  jun: '06',
  juli: '07',
  jul: '07',
  agustus: '08',
  agt: '08',
  aug: '08',
  september: '09',
  sep: '09',
  oktober: '10',
  okt: '10',
  oct: '10',
  november: '11',
  nopember: '11',
  nov: '11',
  desember: '12',
  des: '12',
  dec: '12',
};

/**
 * Checks whether a file name or buffer is an Excel spreadsheet (.xlsx or .xls).
 */
export function isExcelFile(fileName: string, buffer?: Buffer): boolean {
  const lower = (fileName || '').toLowerCase();
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    return true;
  }
  if (buffer && buffer.length >= 4) {
    // PK\x03\x04 (ZIP signature used by .xlsx)
    if (
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      buffer[2] === 0x03 &&
      buffer[3] === 0x04
    ) {
      return true;
    }
    // \xD0\xCF\x11\xE0 (OLE2 signature used by legacy .xls)
    if (
      buffer[0] === 0xd0 &&
      buffer[1] === 0xcf &&
      buffer[2] === 0x11 &&
      buffer[3] === 0xe0
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Normalizes any date value (Date object, Excel serial number, or date string) into ISO 'YYYY-MM-DD'.
 */
export function normalizeDateToIso(val: unknown): string | null {
  if (val === null || val === undefined || val === '') return null;

  // Date instance
  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Excel serial number (approx 25000 to 75000 covers 1968 to 2105)
  if (typeof val === 'number' && val > 25000 && val < 75000) {
    const parsed = XLSX.SSF.parse_date_code(val);
    if (parsed && parsed.y && parsed.m && parsed.d) {
      return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
    }
  }

  const s = String(val).trim();
  if (!s || s === '-') return null;

  // ISO: YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }

  // Indonesian / UK format: DD/MM/YYYY or DD-MM-YYYY
  const idMatch = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
  if (idMatch) {
    return `${idMatch[3]}-${idMatch[2].padStart(2, '0')}-${idMatch[1].padStart(2, '0')}`;
  }

  // Text month format: 26 Oktober 2026 or 26-Okt-2026
  const textMatch = s.match(/^(\d{1,2})[\s\-]+([A-Za-z]+)[\s\-]+(\d{4})/);
  if (textMatch) {
    const day = textMatch[1].padStart(2, '0');
    const mon = ID_MONTHS[textMatch[2].toLowerCase()];
    if (mon) {
      return `${textMatch[3]}-${mon}-${day}`;
    }
  }

  // US short format: MM/DD/YY e.g. 10/26/26
  const shortMatch = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2})$/);
  if (shortMatch) {
    const yr = 2000 + parseInt(shortMatch[3], 10);
    return `${yr}-${shortMatch[1].padStart(2, '0')}-${shortMatch[2].padStart(2, '0')}`;
  }

  return null;
}

/**
 * Normalizes time string or Excel fraction to 24-hour 'HH:MM'
 */
export function normalizeTimeToHHMM(val: unknown): string {
  if (val === null || val === undefined || val === '' || val === '-') return '-';

  // Excel day fraction e.g. 0.297916666666667 -> 07:09
  if (typeof val === 'number') {
    if (val >= 0 && val < 1) {
      const parsed = XLSX.SSF.parse_date_code(val);
      if (parsed) {
        return `${String(parsed.H || 0).padStart(2, '0')}:${String(parsed.M || 0).padStart(2, '0')}`;
      }
    }
    // If it's a number > 1 with decimal part, extract time
    if (val >= 1) {
      const fraction = val - Math.floor(val);
      if (fraction > 0) {
        const parsed = XLSX.SSF.parse_date_code(fraction);
        if (parsed) {
          return `${String(parsed.H || 0).padStart(2, '0')}:${String(parsed.M || 0).padStart(2, '0')}`;
        }
      }
    }
  }

  const s = String(val).trim();
  if (!s || s === '-') return '-';

  // 12-hour AM/PM format (e.g. "7:09 AM" or "8:04 PM")
  const ampm = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = ampm[2];
    const isPm = ampm[3].toUpperCase() === 'PM';
    if (isPm && h < 12) h += 12;
    if (!isPm && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}`;
  }

  // 24-hour format HH:MM(:SS)
  const m24 = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (m24) {
    return `${m24[1].padStart(2, '0')}:${m24[2]}`;
  }

  return s;
}

/**
 * Safely parses a single delimited line (CSV / semicolon / TSV) into fields, respecting quotes.
 */
export function parseCsvLine(line: string, delim?: string): string[] {
  if (!delim) {
    delim = line.includes(';') ? ';' : line.includes('\t') ? '\t' : ',';
  }
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delim && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

/**
 * Formats a single Excel cell based on its column role and data types.
 */
function formatExcelCell(cell: XLSX.CellObject | undefined, colHeader: string): string {
  if (!cell) return '';

  const headerLower = (colHeader || '').toLowerCase();
  const isDateCol =
    headerLower.includes('tanggal') ||
    headerLower.includes('date') ||
    headerLower.includes('periode');
  const isTimeCol =
    headerLower.includes('masuk') ||
    headerLower.includes('pulang') ||
    headerLower.includes('clock') ||
    headerLower.includes('waktu');

  if (isDateCol) {
    const norm = normalizeDateToIso(cell.v) || normalizeDateToIso(cell.w);
    if (norm) return norm;
  }

  if (isTimeCol) {
    const normTime =
      normalizeTimeToHHMM(cell.v) !== '-'
        ? normalizeTimeToHHMM(cell.v)
        : normalizeTimeToHHMM(cell.w);
    if (normTime !== '-') return normTime;
  }

  // Default cell text
  if (cell.w !== undefined && cell.w !== '') return String(cell.w).trim();
  if (cell.v !== undefined && cell.v !== null) return String(cell.v).trim();
  return '';
}

/**
 * Converts an Excel spreadsheet buffer into a normalized standard CSV string.
 * Automatically chooses the most relevant sheet (e.g. Absensi, Detail Penjualan, Orders)
 * and formats date and time cells consistently so downstream DuckDB and parsers can read it.
 */
export function convertExcelToCsv(buffer: Buffer): {
  csv: string;
  sheetName: string;
  rowCount: number;
} {
  const workbook = XLSX.read(buffer, {
    type: 'buffer',
    cellDates: true,
    raw: false,
  });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Excel workbook contains no sheets.');
  }

  // Pick the most relevant sheet if multiple sheets exist
  let chosenSheetName = workbook.SheetNames[0];
  for (const name of workbook.SheetNames) {
    const lower = name.toLowerCase();
    if (
      lower.includes('absensi') ||
      lower.includes('attendance') ||
      lower.includes('penjualan') ||
      lower.includes('pos') ||
      lower.includes('order') ||
      lower.includes('item')
    ) {
      chosenSheetName = name;
      break;
    }
  }

  const sheet = workbook.Sheets[chosenSheetName];
  if (!sheet) {
    throw new Error(`Unable to load sheet "${chosenSheetName}" from workbook.`);
  }

  const ref = sheet['!ref'];
  if (!ref) {
    return { csv: '', sheetName: chosenSheetName, rowCount: 0 };
  }

  const range = XLSX.utils.decode_range(ref);

  // Scan first 35 rows to detect any recognizable table headers
  const colHeaders: string[] = [];
  let headerRowIdx = -1;

  for (let r = range.s.r; r <= Math.min(range.e.r, range.s.r + 35); r++) {
    const rowTexts: string[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr];
      rowTexts.push(cell ? String(cell.w || cell.v || '').trim() : '');
    }
    const joined = rowTexts.join(' ').toLowerCase();

    // Check known headers
    const isAttendanceHeader =
      joined.includes('tanggal') &&
      (joined.includes('nama') || joined.includes('jam masuk') || joined.includes('outlet'));
    const isMajooPosHeader =
      joined.includes('no transaksi') && joined.includes('waktu order');
    const isKlikitOrdersHeader =
      joined.includes('order id') && joined.includes('gross order value');
    const isKlikitItemsHeader =
      joined.includes('menu items') && joined.includes('item quantity');

    if (
      isAttendanceHeader ||
      isMajooPosHeader ||
      isKlikitOrdersHeader ||
      isKlikitItemsHeader
    ) {
      headerRowIdx = r;
      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = sheet[addr];
        colHeaders.push(cell ? String(cell.w || cell.v || '').trim() : '');
      }
      break;
    }
  }

  const csvRows: string[] = [];

  for (let r = range.s.r; r <= range.e.r; r++) {
    const rowCols: string[] = [];
    let hasContent = false;

    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr];
      const colHeader = colHeaders[c - range.s.c] || '';
      const formatted = formatExcelCell(cell, colHeader);

      if (formatted !== '') {
        hasContent = true;
      }

      // Standard CSV quoting
      if (
        formatted.includes(',') ||
        formatted.includes('"') ||
        formatted.includes('\n') ||
        formatted.includes('\r')
      ) {
        rowCols.push(`"${formatted.replace(/"/g, '""')}"`);
      } else {
        rowCols.push(formatted);
      }
    }

    // Keep rows that have content or rows up to the header
    if (hasContent || r <= headerRowIdx) {
      csvRows.push(rowCols.join(','));
    }
  }

  return {
    csv: csvRows.join('\n'),
    sheetName: chosenSheetName,
    rowCount: csvRows.length,
  };
}
