import crypto from "crypto";
import fs from "fs";
import path from "path";
import type { DuckDBConnection } from "@duckdb/node-api";
import { getDuckDB, getRawReportsReadDirs, getRawReportsWriteDir } from "./duckdb";

export type DetectedFileType = "majoo" | "majoo_attendance" | "klikit_orders" | "klikit_items" | "unknown";

export interface IngestSummary {
  success: boolean;
  fileType: DetectedFileType;
  fileTypeLabel: string;
  fileName: string;
  originalFileName: string;
  fileSizeBytes: number;
  ordersProcessed: number;
  newOrdersInserted: number;
  duplicatesHandled: number;
  itemsProcessed: number;
  newItemsInserted: number;
  grossAmount: number;
  minDate: string | null;
  maxDate: string | null;
  message: string;
}

export interface RawFileAudit {
  name: string;
  canonicalName?: string;
  sizeBytes: number;
  sizeFormatted: string;
  modifiedAt: string;
  fileType: DetectedFileType;
  fileTypeLabel: string;
  dateRangeLabel?: string;
}

const MONTHS: Record<string, string> = {
  january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12"
};

export function detectFileType(contentSample: string, fileName?: string): DetectedFileType {
  const lines = contentSample.split(/\r?\n/).slice(0, 35);
  const sampleText = lines.join("\n");
  const firstLine = lines[0] || "";
  const lowerName = (fileName || "").toLowerCase();

  // Majoo Attendance Report: Laporan Absensi or Tanggal,Nama,Outlet,Jam Masuk,Jam Pulang
  if (
    sampleText.includes("Laporan Absensi") ||
    (sampleText.includes("Jam Masuk") && sampleText.includes("Jam Pulang")) ||
    lowerName.includes("attendance") ||
    lowerName.includes("absensi")
  ) {
    return "majoo_attendance";
  }

  // Majoo POS: Semicolon delimited or contains DETAIL PENJUALAN / No Transaksi
  if (
    sampleText.includes("DETAIL PENJUALAN") ||
    (sampleText.includes("No Transaksi") && sampleText.includes("Waktu Order")) ||
    (sampleText.includes(";") && (lowerName.includes("majoo") || lowerName.includes("detil_penjualan")))
  ) {
    return "majoo";
  }

  // Klikit Orders report: contains Gross Order Value / Meal Preparation Time / Status
  if (
    firstLine.includes("Gross Order Value") ||
    firstLine.includes("Meal Preparation Time") ||
    sampleText.includes("Gross Order Value") ||
    sampleText.includes("Meal Preparation Time")
  ) {
    return "klikit_orders";
  }

  // Klikit Items report: contains Menu Items / Item Quantity / Item Sale Price
  if (
    firstLine.includes("Menu Items") ||
    firstLine.includes("Item Quantity") ||
    sampleText.includes("Menu Items") ||
    sampleText.includes("Item Quantity")
  ) {
    return "klikit_items";
  }

  // Fallback filename checks
  if (lowerName.includes("klikit") && lowerName.includes("order")) return "klikit_orders";
  if (lowerName.includes("klikit") && lowerName.includes("item")) return "klikit_items";

  return "unknown";
}

export function getFileTypeLabel(type: DetectedFileType): string {
  switch (type) {
    case "majoo":
      return "Majoo POS (Greenville Dine-in / Takeaway)";
    case "majoo_attendance":
      return "Majoo Attendance (Laporan Absensi Karyawan)";
    case "klikit_orders":
      return "Klikit Orders (GrabFood & GoFood Delivery)";
    case "klikit_items":
      return "Klikit Menu Items (Product Itemization)";
    default:
      return "Unrecognized Format";
  }
}

export function extractDateRange(content: string, fileType: DetectedFileType): { minDate: string | null; maxDate: string | null } {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { minDate: null, maxDate: null };

  if (fileType === "majoo_attendance") {
    const dates: string[] = [];
    for (const line of lines) {
      const m = line.match(/^(\d{4}-\d{2}-\d{2}),/);
      if (m) dates.push(m[1]);
    }
    if (dates.length === 0) return { minDate: null, maxDate: null };
    dates.sort();
    return { minDate: dates[0], maxDate: dates[dates.length - 1] };
  } else if (fileType === "majoo") {
    const regex = /(\d{2})-(\d{2})-(\d{4})/;
    const dates: string[] = [];
    for (const line of lines) {
      if (line.includes(";")) {
        const match = line.match(regex);
        if (match) {
          dates.push(`${match[3]}-${match[2]}-${match[1]}`);
        }
      }
    }
    if (dates.length === 0) return { minDate: null, maxDate: null };
    dates.sort();
    return { minDate: dates[0], maxDate: dates[dates.length - 1] };
  } else {
    // Klikit: match "Month DD, YYYY"
    const regex = /([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/;
    const dates: string[] = [];
    for (const line of lines.slice(1)) {
      const match = line.match(regex);
      if (match) {
        const mon = MONTHS[match[1].toLowerCase()];
        if (mon) {
          const day = match[2].padStart(2, "0");
          const year = match[3];
          dates.push(`${year}-${mon}-${day}`);
        }
      }
    }
    if (dates.length === 0) return { minDate: null, maxDate: null };
    dates.sort();
    return { minDate: dates[0], maxDate: dates[dates.length - 1] };
  }
}

export function getCanonicalFileName(
  fileType: DetectedFileType,
  minDate: string | null,
  maxDate: string | null,
  originalName: string
): string {
  if (fileType === "klikit_orders") {
    return minDate && maxDate ? `klikit_orders_${minDate}_to_${maxDate}.csv` : `klikit_orders_${Date.now()}.csv`;
  }
  if (fileType === "klikit_items") {
    return minDate && maxDate ? `klikit_items_${minDate}_to_${maxDate}.csv` : `klikit_items_${Date.now()}.csv`;
  }
  if (fileType === "majoo_attendance") {
    return minDate && maxDate ? `majoo_attendance_${minDate}_to_${maxDate}.csv` : `majoo_attendance_${Date.now()}.csv`;
  }
  if (fileType === "majoo") {
    return minDate && maxDate ? `majoo_greenville_${minDate}_to_${maxDate}.csv` : `majoo_greenville_${Date.now()}.csv`;
  }
  return originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function parseDateWIB(dateStr: string | null): string | null {
  if (!dateStr || !dateStr.includes("-")) return null;
  const [datePart, timePart] = dateStr.trim().split(" ");
  if (!datePart) return null;
  const [day, month, year] = datePart.split("-");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")} ${timePart || "00:00:00"}`;
}

function categorizeItem(itemName: string): string {
  const lower = itemName.toLowerCase();
  if (lower.includes("custom amount")) return "Custom / Manual";
  if (
    lower.includes("coffee") || lower.includes("black") || lower.includes("latte") ||
    lower.includes("tea") || lower.includes("brew") || lower.includes("water") ||
    lower.includes("mojito") || lower.includes("cappuccino") || lower.includes("espresso") ||
    lower.includes("choco")
  ) {
    return "Drinks";
  }
  if (
    lower.includes("fries") || lower.includes("stick") || lower.includes("nugget") ||
    lower.includes("chunk") || lower.includes("snack") || lower.includes("bites") ||
    lower.includes("tots")
  ) {
    return "Lite Bites";
  }
  if (
    lower.includes("katsu") || lower.includes("risotto") || lower.includes("nasi goreng") ||
    lower.includes("sandwich") || lower.includes("burrito") || lower.includes("quesadilla") ||
    lower.includes("pesmol") || lower.includes("teriyaki") || lower.includes("olio")
  ) {
    return "Main Course";
  }
  return "General";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function getRawFilesAudit(): Promise<RawFileAudit[]> {
  const readDirs = getRawReportsReadDirs();
  if (readDirs.length === 0) return [];
  const seenNames = new Set<string>();
  const result: RawFileAudit[] = [];

  for (const rawDir of readDirs) {
    const files = fs.readdirSync(rawDir);
    for (const f of files) {
      if (!f.endsWith(".csv") || seenNames.has(f)) continue;
      const fullPath = path.join(rawDir, f);
      try {
        const stat = fs.statSync(fullPath);
        let detected: DetectedFileType = "unknown";
        let dateRangeLabel: string | undefined = undefined;

        try {
          const fd = fs.openSync(fullPath, "r");
          const buf = Buffer.alloc(16384);
          const bytesRead = fs.readSync(fd, buf, 0, 16384, 0);
          fs.closeSync(fd);
          const sample = buf.toString("utf-8", 0, bytesRead);
          detected = detectFileType(sample, f);

          const nameMatch = f.match(/(\d{4}-\d{2}-\d{2})_to_(\d{4}-\d{2}-\d{2})/);
          if (nameMatch) {
            dateRangeLabel = `${nameMatch[1]} to ${nameMatch[2]}`;
          }
        } catch {
          if (f.startsWith("majoo_")) detected = "majoo";
          else if (f.startsWith("klikit_orders_")) detected = "klikit_orders";
          else if (f.startsWith("klikit_items_")) detected = "klikit_items";
        }

        seenNames.add(f);
        result.push({
          name: f,
          sizeBytes: stat.size,
          sizeFormatted: formatBytes(stat.size),
          modifiedAt: stat.mtime.toISOString(),
          fileType: detected,
          fileTypeLabel: getFileTypeLabel(detected),
          dateRangeLabel,
        });
      } catch {
        // ignore
      }
    }
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

function escSql(val: string): string {
  return val.replace(/'/g, "''");
}

export async function processUploadedFile(
  fileName: string,
  contentBuffer: Buffer
): Promise<IngestSummary> {
  const writeDir = getRawReportsWriteDir();
  if (!fs.existsSync(writeDir)) {
    fs.mkdirSync(writeDir, { recursive: true });
  }

  const contentStr = contentBuffer.toString("utf-8");
  const fileType = detectFileType(contentStr, fileName);

  if (fileType === "unknown") {
    throw new Error("Unrecognized CSV format. Please upload either a Klikit aggregator export or a Majoo POS export.");
  }

  const { minDate, maxDate } = extractDateRange(contentStr, fileType);
  const canonicalName = getCanonicalFileName(fileType, minDate, maxDate, fileName);
  const targetFilePath = path.join(writeDir, canonicalName);

  fs.writeFileSync(targetFilePath, contentBuffer);

  const db = await getDuckDB();
  let conn: DuckDBConnection | null = null;
  try {
    conn = await db.connect();

    if (fileType === "majoo_attendance") {
      const { upsertAttendanceCsvToConn } = await import("./attendance");
      const res = await upsertAttendanceCsvToConn(conn, contentStr, canonicalName);
      const msg =
        res.newInserted === 0 && res.totalParsed > 0
          ? `Saved as "${canonicalName}". All ${res.totalParsed} attendance logs were already present in DuckDB (updated in place).`
          : `Saved as "${canonicalName}". Ingested ${res.newInserted} new attendance logs (${res.updatedCount} updated) across ${res.minDate || "?"} to ${res.maxDate || "?"}.`;
      return {
        success: true,
        fileType: "majoo_attendance",
        fileTypeLabel: getFileTypeLabel("majoo_attendance"),
        fileName: canonicalName,
        originalFileName: fileName,
        fileSizeBytes: contentBuffer.length,
        ordersProcessed: res.totalParsed,
        newOrdersInserted: res.newInserted,
        duplicatesHandled: res.updatedCount,
        itemsProcessed: 0,
        newItemsInserted: 0,
        grossAmount: 0,
        minDate: res.minDate,
        maxDate: res.maxDate,
        message: msg,
      };
    } else if (fileType === "majoo") {
      return await ingestMajooPOS(conn, targetFilePath, canonicalName, fileName, contentBuffer.length);
    } else if (fileType === "klikit_orders") {
      return await ingestKlikitOrders(conn, targetFilePath, canonicalName, fileName, contentBuffer.length);
    } else if (fileType === "klikit_items") {
      return await ingestKlikitItems(conn, targetFilePath, canonicalName, fileName, contentBuffer.length);
    }

    throw new Error("Unsupported file type");
  } finally {
    if (conn) {
      try {
        conn.closeSync();
      } catch {
        // ignore close errors
      }
    }
  }
}

async function ingestMajooPOS(
  conn: DuckDBConnection,
  filePath: string,
  canonicalName: string,
  originalName: string,
  sizeBytes: number
): Promise<IngestSummary> {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/);

  let headerIdx = -1;
  for (let i = 0; i < Math.min(30, lines.length); i++) {
    if (lines[i].includes("No Transaksi") && lines[i].includes("Waktu Order")) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) {
    throw new Error("Could not find standard Majoo table headers (No Transaksi; Waktu Order).");
  }

  const headers = lines[headerIdx].split(";").map(h => h.trim());
  const noIdx = headers.indexOf("No Transaksi");
  const waktuOrderIdx = headers.indexOf("Waktu Order");
  const waktuBayarIdx = headers.indexOf("Waktu Bayar");
  const outletIdx = headers.indexOf("Outlet");
  const produkIdx = headers.indexOf("Produk");
  const jenisOrderIdx = headers.indexOf("Jenis Order");
  const totalPenjualanIdx = headers.indexOf("Total Penjualan (Rp)");

  const ordersToInsert: {
    dedup_id: string;
    order_id: string;
    external_id: string;
    short_id: string;
    provider: string;
    brand: string;
    branch: string;
    status: string;
    gross_amount: number;
    net_payout: number;
    merchant_promo_burn: number;
    provider_promo_burn: number;
    delivery_fee: number;
    net_sales: number;
    net_realization_rate: number;
    order_type: string;
    created_at: string | null;
    delivered_at: string | null;
    source_file: string;
  }[] = [];
  const itemsToInsert: {
    dedup_id: string;
    order_id: string;
    external_id: string;
    provider: string;
    brand: string;
    branch: string;
    item_name: string;
    category: string;
    item_qty: number;
    item_price: number;
    total_price: number;
    created_at: string | null;
    status: string;
    source_file: string;
  }[] = [];
  let totalGross = 0;
  let minDate: string | null = null;
  let maxDate: string | null = null;

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(";").map(c => c.trim());
    if (cols.length < headers.length - 2) continue;

    const orderId = cols[noIdx];
    if (!orderId) continue;

    const rawCreated = cols[waktuOrderIdx];
    const rawBayar = waktuBayarIdx >= 0 ? cols[waktuBayarIdx] : null;
    const createdStr = parseDateWIB(rawCreated);
    const bayarStr = parseDateWIB(rawBayar);

    if (createdStr) {
      if (!minDate || createdStr < minDate) minDate = createdStr;
      if (!maxDate || createdStr > maxDate) maxDate = createdStr;
    }

    const outlet = outletIdx >= 0 && cols[outletIdx] ? cols[outletIdx] : "Tyfel Coffee";
    const rawGross = totalPenjualanIdx >= 0 ? parseFloat(cols[totalPenjualanIdx]) : 0;
    const grossAmount = isNaN(rawGross) ? 0 : rawGross;
    totalGross += grossAmount;

    const jenisOrder = jenisOrderIdx >= 0 ? cols[jenisOrderIdx] : "Dine In";
    const shortId = orderId.split("/").pop() || orderId;
    const brand = outlet === "Tyfel Coffee" ? "Tyfel Coffee" : outlet;
    const branch = "Greenville";
    const provider = "Greenville POS";
    const dedupId = `MAJOO-GV-${orderId.replace(/[^a-zA-Z0-9]/g, "_")}`;

    ordersToInsert.push({
      dedup_id: dedupId,
      order_id: orderId,
      external_id: orderId,
      short_id: shortId,
      provider,
      brand,
      branch,
      status: "COMPLETED",
      gross_amount: grossAmount,
      net_payout: grossAmount,
      merchant_promo_burn: 0.0,
      provider_promo_burn: 0.0,
      delivery_fee: 0.0,
      net_sales: grossAmount,
      net_realization_rate: 100.0,
      order_type: jenisOrder === "Takeaway" ? "Takeaway" : "Dine In",
      created_at: createdStr,
      delivered_at: bayarStr,
      source_file: canonicalName,
    });

    const rawProduk = produkIdx >= 0 ? cols[produkIdx] : "";
    if (rawProduk) {
      const itemTokens = rawProduk.split(",").map(s => s.trim()).filter(Boolean);
      if (itemTokens.length > 0) {
        const counts: Record<string, number> = {};
        for (const token of itemTokens) {
          counts[token] = (counts[token] || 0) + 1;
        }

        const unitPrice = grossAmount / itemTokens.length;

        for (const [itemName, qty] of Object.entries(counts)) {
          const itemDedupId = `MAJOO-ITEM-GV-${orderId.replace(/[^a-zA-Z0-9]/g, "_")}-${itemName.replace(/[^a-zA-Z0-9]/g, "_")}-${qty}`;
          const category = categorizeItem(itemName);
          itemsToInsert.push({
            dedup_id: itemDedupId,
            order_id: orderId,
            external_id: orderId,
            provider,
            brand,
            branch,
            item_name: itemName,
            category,
            item_qty: qty,
            item_price: Math.round(unitPrice),
            total_price: Math.round(unitPrice * qty),
            created_at: createdStr,
            status: "COMPLETED",
            source_file: canonicalName,
          });
        }
      }
    }
  }

  let existingDupes = 0;
  for (let i = 0; i < ordersToInsert.length; i += 200) {
    const idChunk = ordersToInsert
      .slice(i, i + 200)
      .map((o) => `'${escSql(o.dedup_id)}'`)
      .join(",");
    const checkOrderRes = await conn.run(`
      SELECT count(*) FROM fact_orders WHERE dedup_id IN (${idChunk})
    `);
    const orderCheckRows = await checkOrderRes.getRows();
    existingDupes += Number(orderCheckRows[0]?.[0] ?? 0);
  }
  const newOrders = Math.max(0, ordersToInsert.length - existingDupes);

  const BATCH_SIZE = 100;
  for (let i = 0; i < ordersToInsert.length; i += BATCH_SIZE) {
    const chunk = ordersToInsert.slice(i, i + BATCH_SIZE);
    const valuesList = chunk
      .map(
        (o) => `(
          '${escSql(o.dedup_id)}',
          '${escSql(o.order_id)}',
          '${escSql(o.external_id)}',
          '${escSql(o.short_id)}',
          '${escSql(o.provider)}',
          '${escSql(o.brand)}',
          '${escSql(o.branch)}',
          '${escSql(o.status)}',
          ${o.gross_amount},
          ${o.net_payout},
          ${o.merchant_promo_burn},
          ${o.provider_promo_burn},
          ${o.delivery_fee},
          ${o.net_sales},
          ${o.net_realization_rate},
          '${escSql(o.order_type)}',
          NULL,
          NULL,
          FALSE,
          FALSE,
          ${o.created_at ? `TIMESTAMP '${escSql(o.created_at)}'` : "NULL"},
          ${o.delivered_at ? `TIMESTAMP '${escSql(o.delivered_at)}'` : "NULL"},
          '${escSql(o.source_file)}',
          CURRENT_TIMESTAMP
        )`
      )
      .join(",\n");

    await conn.run(`
      INSERT INTO fact_orders (
        dedup_id, order_id, external_id, short_id, provider, brand, branch,
        status, gross_amount, net_payout, merchant_promo_burn, provider_promo_burn,
        delivery_fee, net_sales, net_realization_rate, order_type,
        meal_prep_time_raw, prep_time_minutes, kpt_sla_breach, kpt_red_alert,
        created_at, delivered_at, source_file, ingested_at
      )
      VALUES ${valuesList}
      ON CONFLICT (dedup_id) DO UPDATE SET
        gross_amount = EXCLUDED.gross_amount,
        net_payout = EXCLUDED.net_payout,
        net_sales = EXCLUDED.net_sales,
        delivered_at = EXCLUDED.delivered_at,
        source_file = EXCLUDED.source_file,
        ingested_at = EXCLUDED.ingested_at;
    `);
  }

  let existingItemDupes = 0;
  for (let i = 0; i < itemsToInsert.length; i += 200) {
    const idChunk = itemsToInsert
      .slice(i, i + 200)
      .map((it) => `'${escSql(it.dedup_id)}'`)
      .join(",");
    const checkItemRes = await conn.run(`
      SELECT count(*) FROM fact_order_items WHERE dedup_id IN (${idChunk})
    `);
    const itemCheckRows = await checkItemRes.getRows();
    existingItemDupes += Number(itemCheckRows[0]?.[0] ?? 0);
  }
  const newItems = Math.max(0, itemsToInsert.length - existingItemDupes);

  for (let i = 0; i < itemsToInsert.length; i += BATCH_SIZE) {
    const chunk = itemsToInsert.slice(i, i + BATCH_SIZE);
    const valuesList = chunk
      .map(
        (it) => `(
          '${escSql(it.dedup_id)}',
          '${escSql(it.order_id)}',
          '${escSql(it.external_id)}',
          '${escSql(it.provider)}',
          '${escSql(it.brand)}',
          '${escSql(it.branch)}',
          '${escSql(it.item_name)}',
          '${escSql(it.category)}',
          ${it.item_qty},
          ${it.item_price},
          ${it.total_price},
          ${it.created_at ? `TIMESTAMP '${escSql(it.created_at)}'` : "NULL"},
          '${escSql(it.status)}',
          '${escSql(it.source_file)}',
          CURRENT_TIMESTAMP
        )`
      )
      .join(",\n");

    await conn.run(`
      INSERT INTO fact_order_items (
        dedup_id, order_id, external_id, provider, brand, branch,
        item_name, category, item_qty, item_price, total_price,
        created_at, status, source_file, ingested_at
      )
      VALUES ${valuesList}
      ON CONFLICT (dedup_id) DO UPDATE SET
        item_price = EXCLUDED.item_price,
        total_price = EXCLUDED.total_price,
        source_file = EXCLUDED.source_file,
        ingested_at = EXCLUDED.ingested_at;
    `);
  }

  let msg = `Saved as "${canonicalName}". `;
  if (newOrders === 0 && ordersToInsert.length > 0) {
    msg += `All ${ordersToInsert.length} Majoo tickets were already synced in DuckDB. Deduplication updated records in place with zero revenue inflation.`;
  } else {
    msg += `Successfully ingested ${newOrders} new Majoo tickets (${existingDupes} existing updated) and ${newItems} item rows.`;
  }

  return {
    success: true,
    fileType: "majoo",
    fileTypeLabel: getFileTypeLabel("majoo"),
    fileName: canonicalName,
    originalFileName: originalName,
    fileSizeBytes: sizeBytes,
    ordersProcessed: ordersToInsert.length,
    newOrdersInserted: newOrders,
    duplicatesHandled: existingDupes,
    itemsProcessed: itemsToInsert.length,
    newItemsInserted: newItems,
    grossAmount: totalGross,
    minDate,
    maxDate,
    message: msg,
  };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
  }
  result.push(cur);
  return result;
}

function parseCsvRecords(content: string): Array<Record<string, string>> {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCsvLine(lines[i]);
    if (vals.length < 3) continue;
    const obj: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = vals[c] !== undefined ? vals[c] : "";
    }
    rows.push(obj);
  }
  return rows;
}

function parseKlikitTimestamp(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/^"+|"+$/g, "");
  const m = trimmed.match(
    /^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/i
  );
  if (!m) return null;
  const mon = MONTHS[m[1].toLowerCase()];
  if (!mon) return null;
  const day = m[2].padStart(2, "0");
  const year = m[3];
  let hour = parseInt(m[4], 10);
  const ampm = m[7].toUpperCase();
  if (ampm === "PM" && hour < 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;
  const hh = String(hour).padStart(2, "0");
  return `${year}-${mon}-${day} ${hh}:${m[5]}:${m[6]}`;
}

function parsePrepTimeMinutes(raw: string | undefined): number | null {
  if (!raw) return null;
  const minMatch = raw.match(/(\d+)\s*min/i);
  const secMatch = raw.match(/(\d+)\s*sec/i);
  if (!minMatch && !secMatch) return null;
  const mins = minMatch ? parseFloat(minMatch[1]) : 0;
  const secs = secMatch ? parseFloat(secMatch[1]) / 60.0 : 0;
  return mins + secs;
}

function md5Hex(input: string): string {
  return crypto.createHash("md5").update(input).digest("hex");
}

function formatDuckDbDoubleForMd5(n: number): string {
  return Number.isInteger(n) ? `${n}.0` : String(n);
}

async function ingestKlikitOrders(
  conn: DuckDBConnection,
  filePath: string,
  canonicalName: string,
  originalName: string,
  sizeBytes: number
): Promise<IngestSummary> {
  const content = fs.readFileSync(filePath, "utf-8");
  const rawRecords = parseCsvRecords(content);

  interface StagedKlikitOrder {
    dedup_id: string;
    order_id: string;
    external_id: string;
    short_id: string;
    provider: string;
    brand: string;
    branch: string;
    status: string;
    gross_amount: number;
    net_payout: number;
    merchant_promo_burn: number;
    provider_promo_burn: number;
    delivery_fee: number;
    net_sales: number;
    net_realization_rate: number;
    order_type: string;
    meal_prep_time_raw: string | null;
    prep_time_minutes: number | null;
    kpt_sla_breach: boolean;
    kpt_red_alert: boolean;
    cancellation_reason: string;
    cancelled_by: string;
    menu_items_summary: string;
    items_ordered: number;
    created_at: string | null;
    delivered_at: string | null;
  }

  const stagedOrders: StagedKlikitOrder[] = [];
  let gross = 0;
  let minTs: string | null = null;
  let maxTs: string | null = null;
  let cancelledCnt = 0;

  for (const r of rawRecords) {
    const orderId = (r["Order ID"] || "").trim();
    if (!orderId) continue;
    const externalId = (r["External ID"] || "").trim();
    const shortId = (r["Short ID"] || "").trim();
    const rawProvider = (r["Provider"] || "").trim();
    const lowerProv = rawProvider.toLowerCase();
    const provider = lowerProv.includes("grab")
      ? "GrabFood"
      : lowerProv.includes("go")
        ? "GoFood"
        : rawProvider;
    const brand = (r["Brand"] || "").replace(/^"+|"+$/g, "").trim();
    const branch = (r["Branch"] || "").trim();
    const status = (r["Status"] || "").trim();
    const upperStatus = status.toUpperCase();
    const isCancelled = upperStatus === "CANCELLED" || upperStatus === "CANCELED";

    const grossAmount = parseFloat(r["Gross Order Value"]) || 0;
    const netPayout = parseFloat(r["Net Order Value"]) || 0;
    const merchantPromo = parseFloat(r["Merchant Discount"]) || 0;
    const providerPromo = parseFloat(r["Provider Discount"]) || 0;
    const deliveryFee = parseFloat(r["Delivery Fee"]) || 0;
    const netSales = grossAmount - merchantPromo;
    const netRealizationRate = grossAmount > 0 ? (netPayout / grossAmount) * 100.0 : 0.0;
    const orderType = (r["Order Type"] || "").trim();
    const mealPrepRaw = (r["Meal Preparation Time"] || "").trim() || null;
    const prepMinutes = parsePrepTimeMinutes(mealPrepRaw || undefined);

    const lowerBranch = branch.toLowerCase();
    const kptSlaBreach =
      prepMinutes !== null &&
      ((lowerBranch === "kemang" && prepMinutes > 12.0) ||
        (lowerBranch === "greenville" && prepMinutes > 15.0));
    const kptRedAlert = prepMinutes !== null && prepMinutes > 20.0;

    const rawCancelReason = (r["Cancellation Reason"] || "").trim();
    const cancellationReason =
      !rawCancelReason || ["-", "N/A", "null"].includes(rawCancelReason)
        ? "UNSPECIFIED_PLATFORM_CANCEL"
        : rawCancelReason.toUpperCase();

    const rawCancelledBy = (r["Cancelled By"] || "").trim();
    const cancelledBy =
      !rawCancelledBy || ["-", "N/A", "null"].includes(rawCancelledBy)
        ? "unspecified"
        : rawCancelledBy.toLowerCase();

    const menuItemsSummary = (r["Menu Items"] || "").replace(/^"+|"+$/g, "").trim();
    const itemsOrdered = parseInt(r["Items Ordered"], 10) || 1;
    const createdAt = parseKlikitTimestamp(r["Created At"]);
    const deliveredAt = parseKlikitTimestamp(r["Delivered At"]);

    if (!isCancelled) {
      gross += grossAmount;
    } else {
      cancelledCnt++;
    }

    if (createdAt) {
      if (!minTs || createdAt < minTs) minTs = createdAt;
      if (!maxTs || createdAt > maxTs) maxTs = createdAt;
    }

    const dedupId = md5Hex(
      `${provider}:${branch}:${orderId}:${createdAt || ""}`
    );

    stagedOrders.push({
      dedup_id: dedupId,
      order_id: orderId,
      external_id: externalId,
      short_id: shortId,
      provider,
      brand,
      branch,
      status,
      gross_amount: grossAmount,
      net_payout: netPayout,
      merchant_promo_burn: merchantPromo,
      provider_promo_burn: providerPromo,
      delivery_fee: deliveryFee,
      net_sales: netSales,
      net_realization_rate: netRealizationRate,
      order_type: orderType,
      meal_prep_time_raw: mealPrepRaw,
      prep_time_minutes: prepMinutes,
      kpt_sla_breach: kptSlaBreach,
      kpt_red_alert: kptRedAlert,
      cancellation_reason: cancellationReason,
      cancelled_by: cancelledBy,
      menu_items_summary: menuItemsSummary,
      items_ordered: itemsOrdered,
      created_at: createdAt,
      delivered_at: deliveredAt,
    });
  }

  const cnt = stagedOrders.length;
  let existingDupes = 0;
  for (let i = 0; i < stagedOrders.length; i += 200) {
    const idChunk = stagedOrders
      .slice(i, i + 200)
      .map((o) => `'${escSql(o.dedup_id)}'`)
      .join(",");
    const checkRes = await conn.run(`
      SELECT count(*) FROM fact_orders WHERE dedup_id IN (${idChunk})
    `);
    const checkRows = await checkRes.getRows();
    existingDupes += Number(checkRows[0]?.[0] ?? 0);
  }
  const newOrders = Math.max(0, cnt - existingDupes);

  const BATCH_SIZE = 100;
  for (let i = 0; i < stagedOrders.length; i += BATCH_SIZE) {
    const chunk = stagedOrders.slice(i, i + BATCH_SIZE);
    const valuesSql = chunk
      .map(
        (o) => `(
          '${escSql(o.dedup_id)}',
          '${escSql(o.order_id)}',
          '${escSql(o.external_id)}',
          '${escSql(o.short_id)}',
          '${escSql(o.provider)}',
          '${escSql(o.brand)}',
          '${escSql(o.branch)}',
          '${escSql(o.status)}',
          ${o.gross_amount},
          ${o.net_payout},
          ${o.merchant_promo_burn},
          ${o.provider_promo_burn},
          ${o.delivery_fee},
          ${o.net_sales},
          ${o.net_realization_rate},
          '${escSql(o.order_type)}',
          ${o.meal_prep_time_raw ? `'${escSql(o.meal_prep_time_raw)}'` : "NULL"},
          ${o.prep_time_minutes !== null ? o.prep_time_minutes : "NULL"},
          ${o.kpt_sla_breach ? "TRUE" : "FALSE"},
          ${o.kpt_red_alert ? "TRUE" : "FALSE"},
          ${o.created_at ? `TIMESTAMP '${escSql(o.created_at)}'` : "NULL"},
          ${o.delivered_at ? `TIMESTAMP '${escSql(o.delivered_at)}'` : "NULL"},
          '${escSql(canonicalName)}',
          CURRENT_TIMESTAMP
        )`
      )
      .join(",\n");

    await conn.run(`
      INSERT INTO fact_orders (
        dedup_id, order_id, external_id, short_id, provider, brand, branch,
        status, gross_amount, net_payout, merchant_promo_burn, provider_promo_burn,
        delivery_fee, net_sales, net_realization_rate, order_type,
        meal_prep_time_raw, prep_time_minutes, kpt_sla_breach, kpt_red_alert,
        created_at, delivered_at, source_file, ingested_at
      )
      VALUES ${valuesSql}
      ON CONFLICT (dedup_id) DO UPDATE SET
        provider = EXCLUDED.provider,
        status = EXCLUDED.status,
        gross_amount = EXCLUDED.gross_amount,
        net_payout = EXCLUDED.net_payout,
        net_sales = EXCLUDED.net_sales,
        merchant_promo_burn = EXCLUDED.merchant_promo_burn,
        provider_promo_burn = EXCLUDED.provider_promo_burn,
        prep_time_minutes = EXCLUDED.prep_time_minutes,
        kpt_sla_breach = EXCLUDED.kpt_sla_breach,
        kpt_red_alert = EXCLUDED.kpt_red_alert,
        delivered_at = EXCLUDED.delivered_at,
        source_file = EXCLUDED.source_file,
        ingested_at = EXCLUDED.ingested_at;
    `);
  }

  const cancelledOrders = stagedOrders.filter((o) =>
    ["CANCELLED", "CANCELED"].includes(o.status.trim().toUpperCase())
  );
  for (let i = 0; i < cancelledOrders.length; i += 50) {
    const chunk = cancelledOrders.slice(i, i + 50);
    const valuesSql = chunk
      .map(
        (o) => `(
          '${escSql(o.order_id)}',
          '${escSql(o.external_id)}',
          '${escSql(o.short_id)}',
          '${escSql(o.provider)}',
          '${escSql(o.brand)}',
          '${escSql(o.branch)}',
          '${escSql(o.status.trim().toUpperCase())}',
          ${o.gross_amount},
          ${o.net_payout},
          ${o.merchant_promo_burn},
          ${o.provider_promo_burn},
          '${escSql(o.cancellation_reason)}',
          '${escSql(o.cancelled_by)}',
          '${escSql(o.menu_items_summary)}',
          ${o.items_ordered},
          '${escSql(o.meal_prep_time_raw || "N/A")}',
          ${o.prep_time_minutes !== null ? o.prep_time_minutes : "NULL"},
          ${o.created_at ? `TIMESTAMP '${escSql(o.created_at)}'` : "NULL"},
          '${escSql(canonicalName)}'
        )`
      )
      .join(",\n");

    await conn.run(`
      INSERT INTO dim_order_cancellations (
        order_id, external_id, short_id, provider, brand, branch, status,
        gross_amount, net_payout, merchant_promo_burn, provider_promo_burn,
        cancellation_reason, cancelled_by, menu_items_summary, items_ordered,
        meal_prep_time_raw, prep_time_minutes, created_at, source_file
      )
      VALUES ${valuesSql}
      ON CONFLICT (order_id) DO UPDATE SET
        provider = EXCLUDED.provider,
        brand = EXCLUDED.brand,
        branch = EXCLUDED.branch,
        status = EXCLUDED.status,
        gross_amount = EXCLUDED.gross_amount,
        net_payout = EXCLUDED.net_payout,
        merchant_promo_burn = EXCLUDED.merchant_promo_burn,
        provider_promo_burn = EXCLUDED.provider_promo_burn,
        cancellation_reason = EXCLUDED.cancellation_reason,
        cancelled_by = EXCLUDED.cancelled_by,
        menu_items_summary = EXCLUDED.menu_items_summary,
        items_ordered = EXCLUDED.items_ordered,
        meal_prep_time_raw = EXCLUDED.meal_prep_time_raw,
        prep_time_minutes = EXCLUDED.prep_time_minutes,
        created_at = EXCLUDED.created_at,
        source_file = EXCLUDED.source_file;
    `);
  }

  let msg = `Saved as "${canonicalName}". `;
  if (newOrders === 0 && cnt > 0) {
    msg += `All ${cnt} delivery orders (${cancelledCnt} cancelled) were already recorded in DuckDB (${minTs ? minTs.split(" ")[0] : ""} to ${maxTs ? maxTs.split(" ")[0] : ""}). Deduplication preserved clean GMV with zero double-counting.`;
  } else {
    msg += `Successfully merged ${newOrders} new delivery orders (${existingDupes} existing deduplicated, ${cancelledCnt} cancelled tracked in Cancellation Ledger) into DuckDB.`;
  }

  return {
    success: true,
    fileType: "klikit_orders",
    fileTypeLabel: getFileTypeLabel("klikit_orders"),
    fileName: canonicalName,
    originalFileName: originalName,
    fileSizeBytes: sizeBytes,
    ordersProcessed: cnt,
    newOrdersInserted: newOrders,
    duplicatesHandled: existingDupes,
    itemsProcessed: 0,
    newItemsInserted: 0,
    grossAmount: gross,
    minDate: minTs,
    maxDate: maxTs,
    message: msg,
  };
}

async function ingestKlikitItems(
  conn: DuckDBConnection,
  filePath: string,
  canonicalName: string,
  originalName: string,
  sizeBytes: number
): Promise<IngestSummary> {
  const content = fs.readFileSync(filePath, "utf-8");
  const rawRecords = parseCsvRecords(content);

  interface StagedKlikitItem {
    dedup_id: string;
    order_id: string;
    external_id: string;
    provider: string;
    brand: string;
    branch: string;
    item_name: string;
    category: string;
    item_qty: number;
    item_price: number;
    total_price: number;
    created_at: string | null;
    status: string;
  }

  const stagedItems: StagedKlikitItem[] = [];
  let gross = 0;
  let minTs: string | null = null;
  let maxTs: string | null = null;

  for (const r of rawRecords) {
    const orderId = (r["Order ID"] || "").trim();
    if (!orderId) continue;
    const externalId = (r["External ID"] || "").trim();
    const rawProvider = (r["Provider"] || "").trim();
    const lowerProv = rawProvider.toLowerCase();
    const provider = lowerProv.includes("grab")
      ? "GrabFood"
      : lowerProv.includes("go")
        ? "GoFood"
        : rawProvider;
    const brand = (r["Brand"] || "").replace(/^"+|"+$/g, "").trim();
    const branch = (r["Branch"] || "").trim();
    const itemName = (r["Menu Items"] || "").replace(/^"+|"+$/g, "").trim();
    const category = (r["Menu Categories"] || "").replace(/^"+|"+$/g, "").trim();
    const itemQty = parseFloat(r["Item Quantity"]) || 0;
    const itemPrice = parseFloat(r["Item Sale Price"]) || 0;
    const totalPrice = itemQty * itemPrice;
    const createdAt = parseKlikitTimestamp(r["Created At"]);
    const status = (r["Status"] || "").trim();

    gross += totalPrice;
    if (createdAt) {
      if (!minTs || createdAt < minTs) minTs = createdAt;
      if (!maxTs || createdAt > maxTs) maxTs = createdAt;
    }

    const dedupId = md5Hex(
      `${provider}:${branch}:${orderId}:${itemName}:${formatDuckDbDoubleForMd5(itemQty)}`
    );

    stagedItems.push({
      dedup_id: dedupId,
      order_id: orderId,
      external_id: externalId,
      provider,
      brand,
      branch,
      item_name: itemName,
      category,
      item_qty: itemQty,
      item_price: itemPrice,
      total_price: totalPrice,
      created_at: createdAt,
      status,
    });
  }

  const cnt = stagedItems.length;
  let existingDupes = 0;
  for (let i = 0; i < stagedItems.length; i += 200) {
    const idChunk = stagedItems
      .slice(i, i + 200)
      .map((it) => `'${escSql(it.dedup_id)}'`)
      .join(",");
    const checkRes = await conn.run(`
      SELECT count(*) FROM fact_order_items WHERE dedup_id IN (${idChunk})
    `);
    const checkRows = await checkRes.getRows();
    existingDupes += Number(checkRows[0]?.[0] ?? 0);
  }
  const newItems = Math.max(0, cnt - existingDupes);

  const BATCH_SIZE = 100;
  for (let i = 0; i < stagedItems.length; i += BATCH_SIZE) {
    const chunk = stagedItems.slice(i, i + BATCH_SIZE);
    const valuesSql = chunk
      .map(
        (it) => `(
          '${escSql(it.dedup_id)}',
          '${escSql(it.order_id)}',
          '${escSql(it.external_id)}',
          '${escSql(it.provider)}',
          '${escSql(it.brand)}',
          '${escSql(it.branch)}',
          '${escSql(it.item_name)}',
          '${escSql(it.category)}',
          ${it.item_qty},
          ${it.item_price},
          ${it.total_price},
          ${it.created_at ? `TIMESTAMP '${escSql(it.created_at)}'` : "NULL"},
          '${escSql(it.status)}',
          '${escSql(canonicalName)}',
          CURRENT_TIMESTAMP
        )`
      )
      .join(",\n");

    await conn.run(`
      INSERT INTO fact_order_items (
        dedup_id, order_id, external_id, provider, brand, branch,
        item_name, category, item_qty, item_price, total_price,
        created_at, status, source_file, ingested_at
      )
      VALUES ${valuesSql}
      ON CONFLICT (dedup_id) DO UPDATE SET
        provider = EXCLUDED.provider,
        status = EXCLUDED.status,
        item_price = EXCLUDED.item_price,
        total_price = EXCLUDED.total_price,
        source_file = EXCLUDED.source_file,
        ingested_at = EXCLUDED.ingested_at;
    `);
  }

  let msg = `Saved as "${canonicalName}". `;
  if (newItems === 0 && cnt > 0) {
    msg += `All ${cnt} item records were already present in DuckDB. Deduplication preserved clean item velocity.`;
  } else {
    msg += `Successfully merged ${newItems} new SKU records (${existingDupes} existing updated) into DuckDB.`;
  }

  return {
    success: true,
    fileType: "klikit_items",
    fileTypeLabel: getFileTypeLabel("klikit_items"),
    fileName: canonicalName,
    originalFileName: originalName,
    fileSizeBytes: sizeBytes,
    ordersProcessed: 0,
    newOrdersInserted: 0,
    duplicatesHandled: existingDupes,
    itemsProcessed: cnt,
    newItemsInserted: newItems,
    grossAmount: gross,
    minDate: minTs,
    maxDate: maxTs,
    message: msg,
  };
}
