import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { processUploadedFile, getRawFilesAudit, IngestSummary } from '@/lib/ingest';
import { getOrderItemCoverageAudit } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [rawFiles, coverageAudit] = await Promise.all([
      getRawFilesAudit(),
      getOrderItemCoverageAudit(),
    ]);
    return NextResponse.json({ success: true, files: rawFiles, coverageAudit });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      // Also check single file field
      const single = formData.get('file') as File | null;
      if (single) {
        files.push(single);
      } else {
        return NextResponse.json(
          { success: false, error: 'No files provided in upload request.' },
          { status: 400 }
        );
      }
    }

    const summaries: IngestSummary[] = [];
    const errors: { fileName: string; error: string }[] = [];

    for (const file of files) {
      if (!file.name) continue;
      try {
        const arrayBuf = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const summary = await processUploadedFile(file.name, buffer);
        summaries.push(summary);
      } catch (err: unknown) {
        console.error(`[Ingest Error] Failed processing ${file.name}:`, err);
        const msg = err instanceof Error ? err.message : String(err);
        errors.push({ fileName: file.name, error: msg });
      }
    }

    // Bust Next.js cache so dashboard, brand drill-downs, and freshness indicators update instantly
    revalidatePath('/');
    revalidatePath('/brands/[brandId]', 'page');
    revalidatePath('/ingest');

    return NextResponse.json({
      success: summaries.length > 0,
      summaries,
      errors,
      totalFiles: files.length,
      successCount: summaries.length,
      errorCount: errors.length,
    });
  } catch (err: unknown) {
    console.error('[API /api/ingest Fatal Error]', err);
    const msg = err instanceof Error ? err.message : 'Server error during ingestion processing.';
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
