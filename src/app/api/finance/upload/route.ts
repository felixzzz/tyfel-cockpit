import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  parseBcaCsv,
  parseBcaPdfText,
  parsePaninPdfText,
  parsePaninCsv,
  ParsedBankStatement,
} from '@/lib/finance-parser';
import { storeBankStatement } from '@/lib/finance';

export const dynamic = 'force-dynamic';

export interface UploadResult {
  fileName: string;
  bankName: string;
  period: string;
  accountNumber: string;
  txCount: number;
  totalCr: number;
  totalDb: number;
  startingBalance: number;
  endingBalance: number;
  status: 'SUCCESS' | 'ERROR';
  message?: string;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const forcedBank = formData.get('bank') as string | null; // 'BCA', 'Panin', or 'auto'

    if (!files || files.length === 0) {
      const single = formData.get('file') as File | null;
      if (single) files.push(single);
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No bank statement files provided.' },
        { status: 400 }
      );
    }

    const results: UploadResult[] = [];

    for (const file of files) {
      if (!file.name) continue;
      const fileName = file.name;
      const fileLower = fileName.toLowerCase();
      const isPdf = fileLower.endsWith('.pdf');
      const isCsv = fileLower.endsWith('.csv') || fileLower.endsWith('.txt');

      try {
        const arrayBuf = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const statements: ParsedBankStatement[] = [];

        if (isPdf) {
          const { PDFParse } = await import('pdf-parse');
          const parser = new PDFParse({ data: buffer });
          const textResult = await parser.getText();
          const text = textResult.text;

          // Auto-detect bank from content or user choice
          const isPanin =
            forcedBank === 'Panin' ||
            (!forcedBank && (text.includes('PaninBank') || text.includes('Detil Rekening') || fileLower.includes('panin')));

          if (isPanin) {
            const stmt = parsePaninPdfText(text);
            statements.push(stmt);
          } else {
            // BCA PDF
            const stmt = parseBcaPdfText(text);
            statements.push(stmt);
          }
        } else if (isCsv) {
          const csvText = buffer.toString('utf-8');

          const isPanin =
            forcedBank === 'Panin' ||
            (!forcedBank && (fileLower.includes('panin') || csvText.includes('Panin') || csvText.includes('Detil Rekening')));

          if (isPanin) {
            const stmt = parsePaninCsv(csvText);
            statements.push(stmt);
          } else {
            // BCA CSV
            const stmts = parseBcaCsv(csvText);
            statements.push(...stmts);
          }
        } else {
          results.push({
            fileName,
            bankName: 'Unknown',
            period: 'N/A',
            accountNumber: 'N/A',
            txCount: 0,
            totalCr: 0,
            totalDb: 0,
            startingBalance: 0,
            endingBalance: 0,
            status: 'ERROR',
            message: 'Unsupported file format. Please upload PDF or CSV bank statements.',
          });
          continue;
        }

        // Store parsed statements
        for (const stmt of statements) {
          await storeBankStatement(stmt, fileName, isPdf ? 'pdf' : 'csv');
          results.push({
            fileName,
            bankName: stmt.bankName,
            period: stmt.period,
            accountNumber: stmt.accountNumber,
            txCount: stmt.transactions.length,
            totalCr: stmt.totalCr,
            totalDb: stmt.totalDb,
            startingBalance: stmt.startingBalance,
            endingBalance: stmt.endingBalance,
            status: 'SUCCESS',
            message: `Successfully parsed and recorded ${stmt.transactions.length} mutasi transactions.`,
          });
        }
      } catch (err: unknown) {
        console.error(`[Upload Error] Failed to process ${fileName}:`, err);
        const msg = err instanceof Error ? err.message : String(err);
        results.push({
          fileName,
          bankName: 'Unknown',
          period: 'N/A',
          accountNumber: 'N/A',
          txCount: 0,
          totalCr: 0,
          totalDb: 0,
          startingBalance: 0,
          endingBalance: 0,
          status: 'ERROR',
          message: msg,
        });
      }
    }

    revalidatePath('/finance');

    return NextResponse.json({
      success: results.some((r) => r.status === 'SUCCESS'),
      results,
    });
  } catch (err: unknown) {
    console.error('[API /api/finance/upload Error]', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
