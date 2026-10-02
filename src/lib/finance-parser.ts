// Parser for BCA and Panin Bank Statements (PDF & CSV)
import { categorizeTransaction, FinanceCategoryType } from './finance-categories';

export interface ParsedBankTransaction {
  txDate: string; // YYYY-MM-DD
  description: string;
  rawDescription: string;
  branch: string;
  txType: 'CR' | 'DB';
  amount: number;
  balance: number;
  category: string;
  subcategory: string;
  categoryType: FinanceCategoryType;
}

export interface ParsedBankStatement {
  bankName: 'BCA' | 'Panin';
  accountNumber: string;
  accountName: string;
  period: string; // e.g. "2026-07"
  currency: string;
  startingBalance: number;
  endingBalance: number;
  totalCr: number;
  totalDb: number;
  transactions: ParsedBankTransaction[];
}

function parseIndoNumber(str: string): number {
  if (!str) return 0;
  // Replace comma with dot if dot is thousand sep, or handle Indonesian format e.g. "1,234.56" or "1.234,56"
  const clean = str.replace(/[^\d.,-]/g, '').trim();
  if (clean.includes(',') && clean.includes('.')) {
    if (clean.lastIndexOf('.') > clean.lastIndexOf(',')) {
      // 1,234.56 format (BCA format)
      return parseFloat(clean.replace(/,/g, '')) || 0;
    } else {
      // 1.234,56 format
      return parseFloat(clean.replace(/\./g, '').replace(',', '.')) || 0;
    }
  }
  if (clean.includes(',')) {
    // Check if it's decimal or thousand: e.g. 15,834.00 vs 15,834
    const parts = clean.split(',');
    if (parts.length === 2 && parts[1].length === 2) {
      return parseFloat(clean.replace(',', '.')) || 0;
    }
    return parseFloat(clean.replace(/,/g, '')) || 0;
  }
  return parseFloat(clean) || 0;
}

const MONTH_MAP: Record<string, string> = {
  JANUARI: '01', JAN: '01',
  FEBRUARI: '02', FEB: '02',
  MARET: '03', MAR: '03',
  APRIL: '04', APR: '04',
  MEI: '05', MAY: '05',
  JUNI: '06', JUN: '06',
  JULI: '07', JUL: '07',
  AGUSTUS: '08', AGT: '08', AUG: '08',
  SEPTEMBER: '09', SEP: '09', SEPT: '09',
  OKTOBER: '10', OKT: '10', OCT: '10',
  NOVEMBER: '11', NOV: '11',
  DESEMBER: '12', DES: '12', DEC: '12',
};

// ─── BCA CSV PARSER ──────────────────────────────────────────────────────────

export function parseBcaCsv(csvText: string): ParsedBankStatement[] {
  const statements: ParsedBankStatement[] = [];
  const lines = csvText.split(/\r?\n/);

  let currentAccountNumber = '4080067271';
  let currentAccountName = 'FELIX SALIM';
  let currentCurrency = 'IDR';
  let currentTx: ParsedBankTransaction[] = [];
  let currentStartBalance = 0;
  let currentEndBalance = 0;
  let currentTotalCr = 0;
  let currentTotalDb = 0;
  let inDataSection = false;

  const finalizeSection = () => {
    if (currentTx.length > 0) {
      // Determine period from first transaction
      const firstDate = currentTx[0].txDate;
      const period = firstDate ? firstDate.slice(0, 7) : '2026-08';
      
      // Calculate totals if not found in footer
      const calcCr = currentTotalCr || currentTx.filter(t => t.txType === 'CR').reduce((s, t) => s + t.amount, 0);
      const calcDb = currentTotalDb || currentTx.filter(t => t.txType === 'DB').reduce((s, t) => s + t.amount, 0);
      const lastBal = currentEndBalance || currentTx[currentTx.length - 1].balance;

      statements.push({
        bankName: 'BCA',
        accountNumber: currentAccountNumber,
        accountName: currentAccountName,
        period,
        currency: currentCurrency,
        startingBalance: currentStartBalance,
        endingBalance: lastBal,
        totalCr: calcCr,
        totalDb: calcDb,
        transactions: [...currentTx],
      });
      currentTx = [];
      currentStartBalance = 0;
      currentEndBalance = 0;
      currentTotalCr = 0;
      currentTotalDb = 0;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Check account headers
    if (rawLine.startsWith('Account No.')) {
      if (currentTx.length > 0) {
        finalizeSection();
      }
      const match = rawLine.match(/['"]?(\d+)['"]?/);
      if (match) currentAccountNumber = match[1];
      inDataSection = false;
      continue;
    }
    if (rawLine.startsWith('Name')) {
      const parts = rawLine.split(',');
      if (parts.length >= 3) currentAccountName = parts[2].replace(/['"=]/g, '').trim();
      continue;
    }
    if (rawLine.startsWith('Currency')) {
      const parts = rawLine.split(',');
      if (parts.length >= 3) currentCurrency = parts[2].replace(/['"=]/g, '').trim();
      continue;
    }
    if (rawLine.startsWith('Date,Description') || rawLine.includes('Amount,,Balance')) {
      inDataSection = true;
      continue;
    }
    if (rawLine.startsWith('Starting Balance')) {
      const parts = rawLine.split(',');
      if (parts.length >= 3) currentStartBalance = parseIndoNumber(parts[2]);
      continue;
    }
    if (rawLine.startsWith('Credit,')) {
      const parts = rawLine.split(',');
      if (parts.length >= 3) currentTotalCr = parseIndoNumber(parts[2]);
      continue;
    }
    if (rawLine.startsWith('Debet,')) {
      const parts = rawLine.split(',');
      if (parts.length >= 3) currentTotalDb = parseIndoNumber(parts[2]);
      continue;
    }
    if (rawLine.startsWith('Ending Balance')) {
      const parts = rawLine.split(',');
      if (parts.length >= 3) currentEndBalance = parseIndoNumber(parts[2]);
      finalizeSection();
      inDataSection = false;
      continue;
    }

    if (inDataSection) {
      // Row pattern: '01/08/2026,Description,'0000,57518.00,CR,17505018.31
      // or using CSV split
      const tokens = parseCsvLine(rawLine);
      if (tokens.length >= 5) {
        const rawDate = tokens[0].replace(/['"]/g, '').trim();
        // check date format DD/MM/YYYY
        const dateMatch = rawDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (dateMatch) {
          const formattedDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
          const description = tokens[1].replace(/['"]/g, '').trim();
          const branch = tokens[2].replace(/['"]/g, '').trim();
          const amount = parseIndoNumber(tokens[3]);
          const txType = (tokens[4].replace(/['"]/g, '').trim().toUpperCase() === 'DB' ? 'DB' : 'CR') as 'CR' | 'DB';
          const balance = tokens[5] ? parseIndoNumber(tokens[5]) : 0;

          const cat = categorizeTransaction(description, txType, amount);

          currentTx.push({
            txDate: formattedDate,
            description,
            rawDescription: description,
            branch,
            txType,
            amount,
            balance,
            category: cat.category,
            subcategory: cat.subcategory,
            categoryType: cat.type,
          });
        }
      }
    }
  }

  finalizeSection();
  return statements;
}

// ─── BCA PDF PARSER ──────────────────────────────────────────────────────────

function isBcaPdfHeaderOrFooter(line: string): boolean {
  const l = line.toUpperCase();
  if (l.includes('--') && l.includes('OF')) return true;
  if (l.includes('REKENING TAHAPAN')) return true;
  if (l.includes('KCP KAPUK MUARA') || l.includes('K C P K A P U K')) return true;
  if (
    l.includes('FELIX SALIM') ||
    l.includes('PENJARINGAN') ||
    l.includes('KAPUK MUARA') ||
    l.includes('WALET PERMAI') ||
    l.includes('JAKARTA 14450') ||
    l.includes('INDONESIA')
  )
    return true;
  if (
    l.includes('NO. REKENING') ||
    l.includes('HALAMAN :') ||
    l.includes('PERIODE :') ||
    l.includes('MATA UANG :')
  )
    return true;
  if (
    l.includes('CATATAN') ||
    l.includes('C A T A T A N') ||
    l.includes('APABILA NASABAH') ||
    l.includes('A P A B I L A') ||
    l.includes('R E K E N I N G') ||
    l.includes('T E L A H') ||
    l.includes('B C A B E R H A K') ||
    l.includes('L A P O R A N')
  )
    return true;
  if (l === '•' || l === '• •' || l.includes('BERSAMBUNG KE')) return true;
  if (l.includes('TANGGAL KETERANGAN CBG MUTASI SALDO')) return true;
  if (l.match(/^\d+\s*\/\s*\d+$/)) return true;
  return false;
}

export function parseBcaPdfText(pdfText: string): ParsedBankStatement {
  // Extract Account No
  const accMatch = pdfText.match(/NO\.?\s*REKENING\s*:\s*(\d+)/i);
  const accountNumber = accMatch ? accMatch[1] : '4080067271';

  // Extract Name
  const nameMatch = pdfText.match(/(?:REKENING TAHAPAN\s+KCP [^\n]+\n+)([A-Z\s]{3,30})\n/i);
  const accountName = nameMatch ? nameMatch[1].trim() : 'FELIX SALIM';

  // Extract Period
  const periodMatch = pdfText.match(/PERIODE\s*:\s*([A-Z]+)\s+(\d{4})/i);
  let year = '2026';
  let month = '07';
  if (periodMatch) {
    const rawMonth = periodMatch[1].toUpperCase();
    year = periodMatch[2];
    month = MONTH_MAP[rawMonth] || '07';
  }
  const period = `${year}-${month}`;

  // Extract Footers
  const startBalMatch = pdfText.match(/SALDO\s+AWAL\s*:\s*([\d,.]+)/i);
  const startingBalance = startBalMatch ? parseIndoNumber(startBalMatch[1]) : 0;

  const mutasiCrMatch = pdfText.match(/MUTASI\s+CR\s*:\s*([\d,.]+)/i);
  const totalCr = mutasiCrMatch ? parseIndoNumber(mutasiCrMatch[1]) : 0;

  const mutasiDbMatch = pdfText.match(/MUTASI\s+DB\s*:\s*([\d,.]+)/i);
  const totalDb = mutasiDbMatch ? parseIndoNumber(mutasiDbMatch[1]) : 0;

  const endBalMatch = pdfText.match(/SALDO\s+AKHIR\s*:\s*([\d,.]+)/i);
  const endingBalance = endBalMatch ? parseIndoNumber(endBalMatch[1]) : 0;

  // Filter out headers and footers from lines
  const rawLines = pdfText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => Boolean(l) && !isBcaPdfHeaderOrFooter(l));

  // Group lines into transaction blocks starting with DD/MM
  const txBlocks: { date: string; lines: string[] }[] = [];
  let curBlock: { date: string; lines: string[] } | null = null;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (
      line.startsWith('SALDO AWAL :') ||
      line.startsWith('MUTASI CR :') ||
      line.startsWith('MUTASI DB :') ||
      line.startsWith('SALDO AKHIR :')
    ) {
      continue;
    }

    const dateMatch = line.match(/^(\d{2}\/\d{2})\s+(.*)$/);
    if (dateMatch) {
      if (curBlock) txBlocks.push(curBlock);
      curBlock = { date: dateMatch[1], lines: [dateMatch[2]] };
    } else if (curBlock) {
      curBlock.lines.push(line);
    }
  }
  if (curBlock) txBlocks.push(curBlock);

  const transactions: ParsedBankTransaction[] = [];

  for (const block of txBlocks) {
    const blockText = block.lines.join(' ');
    // Skip standalone SALDO AWAL lines without transfer context
    if (blockText.includes('SALDO AWAL') && !blockText.includes('TRSF') && !blockText.includes('TRANSFER')) {
      continue;
    }

    const lastLine = block.lines[block.lines.length - 1];
    let amount = 0;
    let balance = 0;
    let isDb = false;
    let branch = '';
    const descLines = block.lines.slice(0, -1);

    // Branch code is 4 digits e.g. 0998 or 0960
    // Pattern 1: '0998 89,765.15 6,116,246.51' (branch, amount, balance)
    // Pattern 2: '0998 152,950.00' (branch, amount)
    // Pattern 3: '15,834.00 4,899,182.36' (amount, balance)
    // Pattern 4: '216,962.00 DB' (amount)
    const branchMatch = lastLine.match(/^(\d{4})\s+([\d,.]+(?:\s*DB)?)(?:\s+([\d,.]+))?$/);
    if (branchMatch) {
      branch = branchMatch[1];
      const amtStr = branchMatch[2];
      isDb = amtStr.includes('DB') || lastLine.includes('DB');
      amount = parseIndoNumber(amtStr);
      if (branchMatch[3]) balance = parseIndoNumber(branchMatch[3]);
    } else {
      const noBranchMatch = lastLine.match(/^([\d,.]+(?:\s*DB)?)(?:\s+([\d,.]+))?$/);
      if (noBranchMatch) {
        const amtStr = noBranchMatch[1];
        isDb = amtStr.includes('DB') || lastLine.includes('DB');
        amount = parseIndoNumber(amtStr);
        if (noBranchMatch[2]) balance = parseIndoNumber(noBranchMatch[2]);
      } else {
        const trailingMatch = lastLine.match(/^(.*?)\s+([\d,.]+(?:\s*DB)?)(?:\s+([\d,.]+))?$/);
        if (trailingMatch) {
          if (trailingMatch[1]) descLines.push(trailingMatch[1].trim());
          const amtStr = trailingMatch[2];
          isDb = amtStr.includes('DB') || lastLine.includes('DB');
          amount = parseIndoNumber(amtStr);
          if (trailingMatch[3]) balance = parseIndoNumber(trailingMatch[3]);
        } else {
          descLines.push(lastLine);
        }
      }
    }

    if (amount > 0) {
      const fullDesc = descLines.join(' ').replace(/\s+/g, ' ').trim();
      const txType: 'CR' | 'DB' = isDb ? 'DB' : 'CR';
      const cat = categorizeTransaction(fullDesc, txType, amount);

      const [d, m] = block.date.split('/');
      const txDate = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;

      transactions.push({
        txDate,
        description: fullDesc,
        rawDescription: fullDesc,
        branch,
        txType,
        amount,
        balance,
        category: cat.category,
        subcategory: cat.subcategory,
        categoryType: cat.type,
      });
    }
  }

  return {
    bankName: 'BCA',
    accountNumber,
    accountName,
    period,
    currency: 'IDR',
    startingBalance,
    endingBalance,
    totalCr,
    totalDb,
    transactions,
  };
}

// ─── PANIN BANK PDF PARSER ───────────────────────────────────────────────────

export function parsePaninPdfText(pdfText: string): ParsedBankStatement {
  // Extract Account No
  const accMatch = pdfText.match(/Nomor\s*Rekening\s*:\s*([A-Z0-9-]+)/i);
  const accountNumber = accMatch ? accMatch[1] : '1002036756-IDR';

  // Extract Name
  const nameMatch = pdfText.match(/Nama\s*:\s*([A-Za-z\s]+)/i);
  const accountName = nameMatch ? nameMatch[1].trim() : 'Felix Salim';

  // Extract Period: e.g. "Mutasi Bulanan : Agt 2026"
  const periodMatch = pdfText.match(/Mutasi\s*Bulanan\s*:\s*([A-Za-z]+)\s+(\d{4})/i);
  let year = '2026';
  let month = '08';
  if (periodMatch) {
    const rawMonth = periodMatch[1].toUpperCase();
    year = periodMatch[2];
    month = MONTH_MAP[rawMonth] || '08';
  }
  const period = `${year}-${month}`;

  // Summary lines
  const startBalMatch = pdfText.match(/Saldo\s*Awal\s*([\d,.]+)/i);
  const startingBalance = startBalMatch ? parseIndoNumber(startBalMatch[1]) : 0;

  const totalCrMatch = pdfText.match(/Total\s*Yang\s*Dikredit\s*([\d,.]+)/i);
  const totalCr = totalCrMatch ? parseIndoNumber(totalCrMatch[1]) : 0;

  const totalDbMatch = pdfText.match(/Total\s*Yang\s*Didebit\s*([\d,.]+)/i);
  const totalDb = totalDbMatch ? parseIndoNumber(totalDbMatch[1]) : 0;

  const endBalMatch = pdfText.match(/Saldo\s*Akhir\s*([\d,.]+)/i);
  const endingBalance = endBalMatch ? parseIndoNumber(endBalMatch[1]) : 0;

  const transactions: ParsedBankTransaction[] = [];
  const lines = pdfText.split(/\r?\n/);

  let curDate = '';
  let curDescParts: string[] = [];
  let curDebit = 0;
  let curCredit = 0;
  let curBalance = 0;

  const commitPaninTx = () => {
    if (curDate && (curDebit > 0 || curCredit > 0)) {
      const txType: 'CR' | 'DB' = curCredit > 0 ? 'CR' : 'DB';
      const amount = curCredit > 0 ? curCredit : curDebit;
      const fullDesc = curDescParts.join(' ').replace(/\s+/g, ' ').trim();
      const cat = categorizeTransaction(fullDesc, txType, amount);

      // format date YYYY-MM-DD
      const [d, m, y] = curDate.split('/');
      const txDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;

      transactions.push({
        txDate,
        description: fullDesc,
        rawDescription: fullDesc,
        branch: 'Panin',
        txType,
        amount,
        balance: curBalance,
        category: cat.category,
        subcategory: cat.subcategory,
        categoryType: cat.type,
      });

      curDate = '';
      curDescParts = [];
      curDebit = 0;
      curCredit = 0;
      curBalance = 0;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.includes('PaninBank') || line.includes('Detil Rekening') || line.includes('Catatan:') || line.includes('Informasi mutasi')) {
      continue;
    }
    if (line.startsWith('Saldo Awal') || line.startsWith('Total Yang Di')) {
      commitPaninTx();
      continue;
    }

    // Check if line starts with DD/MM/YYYY
    const dateMatch = line.match(/^(\d{2}\/\d{2}\/\d{4})\s+(.*)$/);
    if (dateMatch) {
      commitPaninTx();
      curDate = dateMatch[1];
      const rest = dateMatch[2];

      // Check if amounts are on this line
      parsePaninAmounts(rest, curDescParts, (deb, cred, bal) => {
        curDebit = deb;
        curCredit = cred;
        curBalance = bal;
      });
    } else if (curDate) {
      // Continuation line: might contain remaining amounts or description
      const amtMatch = line.match(/([\d,.]+)\s+([\d,.]+)$/);
      if (amtMatch && curCredit === 0 && curDebit === 0) {
        // e.g. "76,768.00 4,234,064.80"
        curCredit = parseIndoNumber(amtMatch[1]);
        curBalance = parseIndoNumber(amtMatch[2]);
        const prefix = line.slice(0, amtMatch.index).trim();
        if (prefix) curDescParts.push(prefix);
      } else {
        curDescParts.push(line);
      }
    }
  }

  commitPaninTx();

  return {
    bankName: 'Panin',
    accountNumber,
    accountName,
    period,
    currency: 'IDR',
    startingBalance,
    endingBalance,
    totalCr,
    totalDb,
    transactions,
  };
}

function parsePaninAmounts(
  rest: string,
  descParts: string[],
  setValues: (debit: number, credit: number, balance: number) => void
) {
  // Line like: "ADMIN CHARGE 16,800.00 4,464,229.80"
  // or "INC CR. DOMPET... 76,768.00 4,234,064.80"
  const twoAmtMatch = rest.match(/^(.*?)\s+([\d,.]+)\s+([\d,.]+)$/);
  if (twoAmtMatch) {
    const desc = twoAmtMatch[1].trim();
    const amt1 = parseIndoNumber(twoAmtMatch[2]);
    const bal = parseIndoNumber(twoAmtMatch[3]);
    descParts.push(desc);

    if (desc.toUpperCase().includes('ADMIN') || desc.toUpperCase().includes('CHARGE') || desc.toUpperCase().includes('DEBIT')) {
      setValues(amt1, 0, bal);
    } else {
      setValues(0, amt1, bal);
    }
    return;
  }
  descParts.push(rest);
}

// ─── PANIN CSV PARSER ────────────────────────────────────────────────────────

export function parsePaninCsv(csvText: string): ParsedBankStatement {
  const lines = csvText.split(/\r?\n/);
  const transactions: ParsedBankTransaction[] = [];
  let accountNumber = '1002036756-IDR';
  let accountName = 'Felix Salim';
  let currency = 'IDR';
  let startBal = 0;
  let endBal = 0;
  let period = '2026-08';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.includes('Nomor Rekening') || line.includes('Account')) {
      const m = line.match(/[:=,]\s*['"]?([A-Za-z0-9-]+)['"]?/);
      if (m) accountNumber = m[1];
      continue;
    }
    if (line.includes('Nama') || line.includes('Name')) {
      const m = line.match(/[:=,]\s*['"]?([^,'"]+)['"]?/);
      if (m) accountName = m[1].trim();
      continue;
    }
    if (line.includes('Saldo Awal') || line.includes('Starting Balance')) {
      const parts = line.split(/[,:=]/);
      if (parts.length >= 2) startBal = parseIndoNumber(parts[parts.length - 1]);
      continue;
    }
    if (line.includes('Saldo Akhir') || line.includes('Ending Balance')) {
      const parts = line.split(/[,:=]/);
      if (parts.length >= 2) endBal = parseIndoNumber(parts[parts.length - 1]);
      continue;
    }
    if (line.includes('Mata Uang') || line.includes('Currency')) {
      const parts = line.split(/[,:=]/);
      if (parts.length >= 2) currency = parts[parts.length - 1].trim();
      continue;
    }

    const tokens = parseCsvLine(line);
    if (tokens.length >= 4) {
      const rawDate = tokens[0].replace(/['"]/g, '').trim();
      const dateMatch = rawDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (dateMatch) {
        const formattedDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
        period = `${dateMatch[3]}-${dateMatch[2]}`;
        const description = tokens[1].replace(/['"]/g, '').trim();
        const debit = parseIndoNumber(tokens[2]);
        const credit = parseIndoNumber(tokens[3]);
        const balance = tokens[4] ? parseIndoNumber(tokens[4]) : 0;

        const txType: 'CR' | 'DB' = credit > 0 ? 'CR' : 'DB';
        const amount = credit > 0 ? credit : debit;
        const cat = categorizeTransaction(description, txType, amount);

        transactions.push({
          txDate: formattedDate,
          description,
          rawDescription: description,
          branch: 'Panin',
          txType,
          amount,
          balance,
          category: cat.category,
          subcategory: cat.subcategory,
          categoryType: cat.type,
        });
      }
    }
  }

  const totalCr = transactions.filter((t) => t.txType === 'CR').reduce((s, t) => s + t.amount, 0);
  const totalDb = transactions.filter((t) => t.txType === 'DB').reduce((s, t) => s + t.amount, 0);

  return {
    bankName: 'Panin',
    accountNumber,
    accountName,
    period,
    currency,
    startingBalance: startBal,
    endingBalance: endBal || (transactions.length > 0 ? transactions[transactions.length - 1].balance : 0),
    totalCr,
    totalDb,
    transactions,
  };
}

// ─── CSV HELPER ──────────────────────────────────────────────────────────────

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if ((char === ',' || char === ';') && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
