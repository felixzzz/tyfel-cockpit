import fs from "fs";
import path from "path";
import { DuckDBConnection } from "@duckdb/node-api";
import { getDuckDB } from "./duckdb";

const RAW_DIR =
  process.env.RAW_REPORTS_DIR ||
  path.resolve(process.cwd(), "../reports/raw");

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
  if (!fs.existsSync(RAW_DIR)) return [];
  const files = fs.readdirSync(RAW_DIR);
  const result: RawFileAudit[] = [];

  for (const f of files) {
    if (!f.endsWith(".csv")) continue;
    const fullPath = path.join(RAW_DIR, f);
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

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

function escSql(val: string): string {
  return val.replace(/'/g, "''");
}

export async function processUploadedFile(
  fileName: string,
  contentBuffer: Buffer
): Promise<IngestSummary> {
  if (!fs.existsSync(RAW_DIR)) {
    fs.mkdirSync(RAW_DIR, { recursive: true });
  }

  const contentStr = contentBuffer.toString("utf-8");
  const fileType = detectFileType(contentStr, fileName);

  if (fileType === "unknown") {
    throw new Error("Unrecognized CSV format. Please upload either a Klikit aggregator export or a Majoo POS export.");
  }

  const { minDate, maxDate } = extractDateRange(contentStr, fileType);
  const canonicalName = getCanonicalFileName(fileType, minDate, maxDate, fileName);
  const targetFilePath = path.join(RAW_DIR, canonicalName);
  
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

  await conn.run(`CREATE OR REPLACE TEMP TABLE temp_upload_orders (
    dedup_id VARCHAR,
    order_id VARCHAR,
    external_id VARCHAR,
    short_id VARCHAR,
    provider VARCHAR,
    brand VARCHAR,
    branch VARCHAR,
    status VARCHAR,
    gross_amount DOUBLE,
    net_payout DOUBLE,
    merchant_promo_burn DOUBLE,
    provider_promo_burn DOUBLE,
    delivery_fee DOUBLE,
    net_sales DOUBLE,
    net_realization_rate DOUBLE,
    order_type VARCHAR,
    meal_prep_time_raw VARCHAR,
    prep_time_minutes DOUBLE,
    kpt_sla_breach BOOLEAN,
    kpt_red_alert BOOLEAN,
    created_at TIMESTAMP,
    delivered_at TIMESTAMP,
    source_file VARCHAR
  );`);

  const BATCH_SIZE = 250;
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
          '${escSql(o.source_file)}'
        )`
      )
      .join(",\n");

    await conn.run(`INSERT INTO temp_upload_orders VALUES ${valuesList};`);
  }

  const checkOrderRes = await conn.run(`
    SELECT
      count(*) as total_staged,
      count(fo.dedup_id) as existing_dupes,
      count(*) - count(fo.dedup_id) as new_orders
    FROM temp_upload_orders s
    LEFT JOIN fact_orders fo ON s.dedup_id = fo.dedup_id
  `);
  const orderCheckRows = await checkOrderRes.getRows();
  const existingDupes = Number(orderCheckRows[0][1]);
  const newOrders = Number(orderCheckRows[0][2]);

  await conn.run(`
    INSERT INTO fact_orders (
      dedup_id, order_id, external_id, short_id, provider, brand, branch,
      status, gross_amount, net_payout, merchant_promo_burn, provider_promo_burn,
      delivery_fee, net_sales, net_realization_rate, order_type,
      meal_prep_time_raw, prep_time_minutes, kpt_sla_breach, kpt_red_alert,
      created_at, delivered_at, source_file, ingested_at
    )
    SELECT 
      dedup_id, order_id, external_id, short_id, provider, brand, branch,
      status, gross_amount, net_payout, merchant_promo_burn, provider_promo_burn,
      delivery_fee, net_sales, net_realization_rate, order_type,
      meal_prep_time_raw, prep_time_minutes, kpt_sla_breach, kpt_red_alert,
      created_at, delivered_at, source_file, CURRENT_TIMESTAMP as ingested_at
    FROM temp_upload_orders
    ON CONFLICT (dedup_id) DO UPDATE SET
      gross_amount = EXCLUDED.gross_amount,
      net_payout = EXCLUDED.net_payout,
      net_sales = EXCLUDED.net_sales,
      delivered_at = EXCLUDED.delivered_at,
      source_file = EXCLUDED.source_file,
      ingested_at = EXCLUDED.ingested_at;
  `);

  await conn.run(`CREATE OR REPLACE TEMP TABLE temp_upload_items (
    dedup_id VARCHAR,
    order_id VARCHAR,
    external_id VARCHAR,
    provider VARCHAR,
    brand VARCHAR,
    branch VARCHAR,
    item_name VARCHAR,
    category VARCHAR,
    item_qty DOUBLE,
    item_price DOUBLE,
    total_price DOUBLE,
    created_at TIMESTAMP,
    status VARCHAR,
    source_file VARCHAR
  );`);

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
          '${escSql(it.source_file)}'
        )`
      )
      .join(",\n");

    await conn.run(`INSERT INTO temp_upload_items VALUES ${valuesList};`);
  }

  const checkItemRes = await conn.run(`
    SELECT
      count(*) as total_staged,
      count(fo.dedup_id) as existing_dupes,
      count(*) - count(fo.dedup_id) as new_items
    FROM temp_upload_items s
    LEFT JOIN fact_order_items fo ON s.dedup_id = fo.dedup_id
  `);
  const itemCheckRows = await checkItemRes.getRows();
  const newItems = Number(itemCheckRows[0][2]);

  await conn.run(`
    INSERT INTO fact_order_items (
      dedup_id, order_id, external_id, provider, brand, branch,
      item_name, category, item_qty, item_price, total_price,
      created_at, status, source_file, ingested_at
    )
    SELECT
      dedup_id, order_id, external_id, provider, brand, branch,
      item_name, category, item_qty, item_price, total_price,
      created_at, status, source_file, CURRENT_TIMESTAMP as ingested_at
    FROM temp_upload_items
    ON CONFLICT (dedup_id) DO UPDATE SET
      item_price = EXCLUDED.item_price,
      total_price = EXCLUDED.total_price,
      source_file = EXCLUDED.source_file,
      ingested_at = EXCLUDED.ingested_at;
  `);

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

async function ingestKlikitOrders(
  conn: DuckDBConnection,
  filePath: string,
  canonicalName: string,
  originalName: string,
  sizeBytes: number
): Promise<IngestSummary> {
  await conn.run(`
    CREATE OR REPLACE TEMP TABLE staging_upload_orders AS
    SELECT
      "Order ID" as order_id,
      "External ID" as external_id,
      "Short ID" as short_id,
      CASE
        WHEN LOWER("Provider") LIKE '%grab%' THEN 'GrabFood'
        WHEN LOWER("Provider") LIKE '%go%' THEN 'GoFood'
        ELSE "Provider"
      END as provider,
      trim(both '"' from "Brand") as brand,
      "Branch" as branch,
      "Status" as status,
      TRY_CAST("Gross Order Value" AS DOUBLE) as gross_amount,
      TRY_CAST("Net Order Value" AS DOUBLE) as net_payout,
      TRY_CAST("Merchant Discount" AS DOUBLE) as merchant_promo_burn,
      TRY_CAST("Provider Discount" AS DOUBLE) as provider_promo_burn,
      TRY_CAST("Delivery Fee" AS DOUBLE) as delivery_fee,
      "Order Type" as order_type,
      "Meal Preparation Time" as meal_prep_time_raw,
      TRY_CAST(regexp_extract("Meal Preparation Time", '(\\d+)\\s*min', 1) AS DOUBLE) + 
      COALESCE(TRY_CAST(regexp_extract("Meal Preparation Time", '(\\d+)\\s*sec', 1) AS DOUBLE) / 60.0, 0.0) as prep_time_minutes,
      TRY_STRPTIME("Created At", '%B %d, %Y %I:%M:%S%p') as created_at,
      TRY_STRPTIME("Delivered At", '%B %d, %Y %I:%M:%S%p') as delivered_at
    FROM read_csv_auto('${escSql(filePath)}', ignore_errors=true);
  `);

  const statRes = await conn.run(`
    SELECT 
      count(*) as cnt,
      COALESCE(sum(gross_amount), 0) as total_gross,
      cast(min(created_at) as varchar) as min_ts,
      cast(max(created_at) as varchar) as max_ts
    FROM staging_upload_orders
  `);
  const rows = await statRes.getRows();
  const cnt = Number(rows[0][0]);
  const gross = Number(rows[0][1]);
  const minTs = rows[0][2] ? String(rows[0][2]) : null;
  const maxTs = rows[0][3] ? String(rows[0][3]) : null;

  const checkRes = await conn.run(`
    WITH staged AS (
      SELECT md5(concat_ws(':', coalesce(provider, ''), coalesce(branch, ''), coalesce(order_id, ''), coalesce(strftime(created_at, '%Y-%m-%d %H:%M:%S'), ''))) as dedup_id
      FROM staging_upload_orders
    )
    SELECT
      count(*) as total_staged,
      count(fo.dedup_id) as existing_dupes,
      count(*) - count(fo.dedup_id) as new_orders
    FROM staged s
    LEFT JOIN fact_orders fo ON s.dedup_id = fo.dedup_id
  `);
  const checkRows = await checkRes.getRows();
  const existingDupes = Number(checkRows[0][1]);
  const newOrders = Number(checkRows[0][2]);

  await conn.run(`
    INSERT INTO fact_orders (
      dedup_id,
      order_id,
      external_id,
      short_id,
      provider,
      brand,
      branch,
      status,
      gross_amount,
      net_payout,
      merchant_promo_burn,
      provider_promo_burn,
      delivery_fee,
      net_sales,
      net_realization_rate,
      order_type,
      meal_prep_time_raw,
      prep_time_minutes,
      kpt_sla_breach,
      kpt_red_alert,
      created_at,
      delivered_at,
      source_file,
      ingested_at
    )
    SELECT
      md5(concat_ws(':', coalesce(provider, ''), coalesce(branch, ''), coalesce(order_id, ''), coalesce(strftime(created_at, '%Y-%m-%d %H:%M:%S'), ''))) as dedup_id,
      order_id,
      external_id,
      short_id,
      provider,
      brand,
      branch,
      status,
      gross_amount,
      net_payout,
      merchant_promo_burn,
      provider_promo_burn,
      delivery_fee,
      (gross_amount - merchant_promo_burn) as net_sales,
      CASE WHEN gross_amount > 0 THEN (net_payout / gross_amount) * 100.0 ELSE 0.0 END as net_realization_rate,
      order_type,
      meal_prep_time_raw,
      prep_time_minutes,
      CASE 
        WHEN LOWER(branch) = 'kemang' AND prep_time_minutes > 12.0 THEN TRUE 
        WHEN LOWER(branch) = 'greenville' AND prep_time_minutes > 15.0 THEN TRUE 
        ELSE FALSE 
      END as kpt_sla_breach,
      CASE WHEN prep_time_minutes > 20.0 THEN TRUE ELSE FALSE END as kpt_red_alert,
      created_at,
      delivered_at,
      '${escSql(canonicalName)}' as source_file,
      CURRENT_TIMESTAMP as ingested_at
    FROM staging_upload_orders
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

  let msg = `Saved as "${canonicalName}". `;
  if (newOrders === 0 && cnt > 0) {
    msg += `All ${cnt} delivery orders were already recorded in DuckDB (${minTs ? minTs.split(" ")[0] : ""} to ${maxTs ? maxTs.split(" ")[0] : ""}). Deduplication preserved clean GMV with zero double-counting.`;
  } else {
    msg += `Successfully merged ${newOrders} new delivery orders (${existingDupes} existing deduplicated) into DuckDB.`;
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
  await conn.run(`
    CREATE OR REPLACE TEMP TABLE staging_upload_items AS
    SELECT
      "Order ID" as order_id,
      "External ID" as external_id,
      CASE
        WHEN LOWER("Provider") LIKE '%grab%' THEN 'GrabFood'
        WHEN LOWER("Provider") LIKE '%go%' THEN 'GoFood'
        ELSE "Provider"
      END as provider,
      trim(both '"' from "Brand") as brand,
      "Branch" as branch,
      trim(both '"' from "Menu Items") as item_name,
      "Menu Categories" as category,
      TRY_CAST("Item Quantity" AS DOUBLE) as item_qty,
      TRY_CAST("Item Sale Price" AS DOUBLE) as item_price,
      TRY_STRPTIME("Created At", '%B %d, %Y %I:%M:%S%p') as created_at,
      "Status" as status
    FROM read_csv_auto('${escSql(filePath)}', ignore_errors=true);
  `);

  const statRes = await conn.run(`
    SELECT 
      count(*) as cnt,
      COALESCE(sum(item_qty * item_price), 0) as total_val,
      cast(min(created_at) as varchar) as min_ts,
      cast(max(created_at) as varchar) as max_ts
    FROM staging_upload_items
  `);
  const rows = await statRes.getRows();
  const cnt = Number(rows[0][0]);
  const gross = Number(rows[0][1]);
  const minTs = rows[0][2] ? String(rows[0][2]) : null;
  const maxTs = rows[0][3] ? String(rows[0][3]) : null;

  const checkRes = await conn.run(`
    WITH staged AS (
      SELECT md5(concat_ws(':', coalesce(provider, ''), coalesce(branch, ''), coalesce(order_id, ''), coalesce(item_name, ''), coalesce(cast(item_qty as varchar), ''))) as dedup_id
      FROM staging_upload_items
    )
    SELECT
      count(*) as total_staged,
      count(fo.dedup_id) as existing_dupes,
      count(*) - count(fo.dedup_id) as new_items
    FROM staged s
    LEFT JOIN fact_order_items fo ON s.dedup_id = fo.dedup_id
  `);
  const checkRows = await checkRes.getRows();
  const existingDupes = Number(checkRows[0][1]);
  const newItems = Number(checkRows[0][2]);

  await conn.run(`
    INSERT INTO fact_order_items (
      dedup_id,
      order_id,
      external_id,
      provider,
      brand,
      branch,
      item_name,
      category,
      item_qty,
      item_price,
      total_price,
      created_at,
      status,
      source_file,
      ingested_at
    )
    SELECT
      md5(concat_ws(':', coalesce(provider, ''), coalesce(branch, ''), coalesce(order_id, ''), coalesce(item_name, ''), coalesce(cast(item_qty as varchar), ''))) as dedup_id,
      order_id,
      external_id,
      provider,
      brand,
      branch,
      item_name,
      category,
      item_qty,
      item_price,
      (item_qty * item_price) as total_price,
      created_at,
      status,
      '${escSql(canonicalName)}' as source_file,
      CURRENT_TIMESTAMP as ingested_at
    FROM staging_upload_items
    ON CONFLICT (dedup_id) DO UPDATE SET
      provider = EXCLUDED.provider,
      status = EXCLUDED.status,
      item_price = EXCLUDED.item_price,
      total_price = EXCLUDED.total_price,
      source_file = EXCLUDED.source_file,
      ingested_at = EXCLUDED.ingested_at;
  `);

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
