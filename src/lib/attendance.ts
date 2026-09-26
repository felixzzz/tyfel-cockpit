import fs from 'fs';
import path from 'path';
import type { DuckDBConnection, DuckDBInstance } from '@duckdb/node-api';
import { getDuckDB, getRawReportsReadDirs, runQuery } from './duckdb';

export interface EmployeeMaster {
  employee_name: string;
  full_name: string;
  role: string;
  outlet: string;
  join_date_label: string;
  shift_start_time: string; // default HH:MM e.g. '07:30'
  basic_salary: number;
  daily_rate: number;
  late_penalty_rate: number;
  no_late_bonus: number;
  is_active: boolean;
}

export interface PayrollAdjustment {
  period_key: string;
  employee_name: string;
  shift_start_override: string | null;
  basic_salary_override: number | null;
  daily_rate_override: number | null;
  late_penalty_override: number | null;
  no_late_bonus_override: number | null;
  daily_count_override: number | null;
  late_count_override: number | null;
  bonus_qty_override: number | null;
  bonus_override: number | null;
  custom_desc: string;
  custom_qty: number;
  custom_unit_value: number;
  kasbon_qty: number;
  kasbon_unit_value: number;
  notes: string;
}

export type AttendanceAnomalyType =
  | 'none'
  | 'closing_tap'
  | 'overnight_rollover'
  | 'missing_clock_out'
  | 'short_shift';

export interface AttendanceRecord {
  attendance_id: string;
  work_date: string;
  employee_name: string;
  outlet: string;
  clock_in: string;
  clock_out: string;
  raw_duration: string;
  duration_seconds: number;
  effective_hours: number;
  anomaly_type: AttendanceAnomalyType;
  status: string;
  notes: string;
  source_file: string;
  // Computed against effective shift schedule for this period
  shift_start_time: string;
  is_late: boolean;
  late_minutes: number;
  early_minutes: number;
}

export interface EmployeePayslipSummary {
  employee: EmployeeMaster;
  period_key: string;
  year: number;
  month: number;
  start_date: string;
  end_date: string;
  has_period_override: boolean;
  // Effective rates for this specific period (after period overrides)
  effective_shift_start: string;
  effective_basic_salary: number;
  effective_daily_rate: number;
  effective_late_penalty_rate: number;
  effective_no_late_bonus: number;
  // Attendance telemetry
  raw_logs_count: number;
  full_shifts_count: number;
  short_shifts_count: number;
  closing_taps_count: number;
  overnight_rollovers_count: number;
  open_shifts_count: number;
  computed_daily_count: number;
  computed_late_count: number;
  on_time_count: number;
  punctuality_rate_pct: number;
  total_effective_hours: number;
  avg_effective_hours: number;
  total_late_minutes: number;
  // Payslip lines (matching Tyfel Coffee Salary_8 template)
  basic_qty: number;
  basic_unit: number;
  basic_total: number;
  basic_is_overridden: boolean;

  daily_qty: number;
  daily_is_overridden: boolean;
  daily_unit: number;
  daily_rate_is_overridden: boolean;
  daily_total: number;

  late_qty: number;
  late_is_overridden: boolean;
  late_unit: number; // positive number; rendered as negative (Rp (20,000))
  late_rate_is_overridden: boolean;
  late_total: number; // negative number e.g. -100000

  bonus_tidak_telat_qty: number;
  bonus_qty_is_overridden: boolean;
  bonus_tidak_telat_unit: number;
  bonus_tidak_telat_total: number;

  custom_desc: string;
  custom_qty: number;
  custom_unit: number;
  custom_total: number;

  grand_total: number;

  kasbon_qty: number;
  kasbon_unit: number; // positive number; rendered as negative (Rp (900,000))
  kasbon_total: number; // negative number e.g. -900000

  net_take_home_pay: number;
  notes: string;

  late_logs: AttendanceRecord[];
  anomaly_logs: AttendanceRecord[];
  all_logs: AttendanceRecord[];
}

export interface PayrollCycleOption {
  period_key: string;
  year: number;
  month: number; // 1..12
  month_name: string;
  month_short: string;
  label: string;
  short_label: string;
  salary_code: string;
  start_date: string;
  end_date: string;
  badge: string;
  log_count: number;
  override_count: number;
  is_completed: boolean;
  is_current_running: boolean;
  is_future: boolean;
  is_selectable: boolean;
  is_editable: boolean;
  is_default?: boolean;
}

export interface AttendanceCycleReport {
  period_key: string;
  year: number;
  month: number;
  cycle_label: string;
  salary_code: string;
  start_date: string;
  end_date: string;
  is_current_running: boolean;
  is_editable: boolean;
  available_years: number[];
  available_cycles: PayrollCycleOption[];
  overall: {
    active_employees: number;
    total_attendance_logs: number;
    total_work_days_paid: number;
    total_late_incidents: number;
    overall_punctuality_pct: number;
    zero_late_achievers: number;
    total_closing_taps: number;
    total_overnight_rollovers: number;
    avg_daily_shift_hours: number;
    total_gross_payroll: number;
    total_late_penalties: number;
    total_bonuses_paid: number;
    total_kasbon_deducted: number;
    total_net_take_home: number;
  };
  payslips: EmployeePayslipSummary[];
  recent_logs: AttendanceRecord[];
}

export const MASTER_EMPLOYEES: EmployeeMaster[] = [
  {
    employee_name: 'Aji',
    full_name: 'Aji Perdi',
    role: 'Bar',
    outlet: 'Tyfel Coffee',
    join_date_label: 'Join 29 Juni 2025',
    shift_start_time: '07:30',
    basic_salary: 800000,
    daily_rate: 85000,
    late_penalty_rate: 20000,
    no_late_bonus: 85000,
    is_active: true,
  },
  {
    employee_name: 'Fauzi',
    full_name: 'Ahmad Fauzi',
    role: 'Bar & Floor',
    outlet: 'Tyfel Coffee',
    join_date_label: 'Join 15 Mei 2025',
    shift_start_time: '07:30',
    basic_salary: 800000,
    daily_rate: 85000,
    late_penalty_rate: 20000,
    no_late_bonus: 85000,
    is_active: true,
  },
  {
    employee_name: 'Icin',
    full_name: 'Icin Solihin',
    role: 'Senior Bar & Kitchen',
    outlet: 'Tyfel Coffee',
    join_date_label: 'Join 10 Maret 2025',
    shift_start_time: '07:00',
    basic_salary: 900000,
    daily_rate: 90000,
    late_penalty_rate: 20000,
    no_late_bonus: 90000,
    is_active: true,
  },
  {
    employee_name: 'Agus',
    full_name: 'Agus Setiawan',
    role: 'Opening Kitchen & Prep',
    outlet: 'Tyfel Coffee',
    join_date_label: 'Join 01 Februari 2025',
    shift_start_time: '06:00',
    basic_salary: 900000,
    daily_rate: 90000,
    late_penalty_rate: 20000,
    no_late_bonus: 90000,
    is_active: true,
  },
  {
    employee_name: 'Budi',
    full_name: 'Budi Santoso',
    role: 'Morning Prep & Griddle',
    outlet: 'Tyfel Coffee',
    join_date_label: 'Join 12 April 2025',
    shift_start_time: '06:00',
    basic_salary: 800000,
    daily_rate: 85000,
    late_penalty_rate: 20000,
    no_late_bonus: 85000,
    is_active: true,
  },
  {
    employee_name: 'Emanuel',
    full_name: 'Emanuel Putra',
    role: 'Day Operations',
    outlet: 'Tyfel Coffee',
    join_date_label: 'Join 20 Juli 2025',
    shift_start_time: '08:00',
    basic_salary: 800000,
    daily_rate: 85000,
    late_penalty_rate: 20000,
    no_late_bonus: 85000,
    is_active: true,
  },
  {
    employee_name: 'Dewi',
    full_name: 'Dewi Lestari',
    role: 'Cashier & Service',
    outlet: 'Tyfel Coffee',
    join_date_label: 'Join 05 Juni 2025',
    shift_start_time: '08:00',
    basic_salary: 800000,
    daily_rate: 85000,
    late_penalty_rate: 20000,
    no_late_bonus: 85000,
    is_active: true,
  },
  {
    employee_name: 'Hanifa',
    full_name: 'Hanifa Zahra',
    role: 'Service & Beverage',
    outlet: 'Tyfel Coffee',
    join_date_label: 'Join 18 Juni 2025',
    shift_start_time: '08:00',
    basic_salary: 800000,
    daily_rate: 85000,
    late_penalty_rate: 20000,
    no_late_bonus: 85000,
    is_active: true,
  },
  {
    employee_name: 'Elisah',
    full_name: 'Elisah Rahmawati',
    role: 'Part-Time / Relief',
    outlet: 'Tyfel Coffee',
    join_date_label: 'Join 17 Agustus 2026',
    shift_start_time: '06:00',
    basic_salary: 0,
    daily_rate: 85000,
    late_penalty_rate: 20000,
    no_late_bonus: 0,
    is_active: false,
  },
];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_SHORTS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function sqlEsc(val: string): string {
  return (val || '').replace(/'/g, "''");
}

export function parseDurationToSeconds(raw: string): number {
  if (!raw || raw.trim() === '-') return 0;
  let total = 0;
  const jamMatch = raw.match(/(\d+)\s*Jam/i);
  const menitMatch = raw.match(/(\d+)\s*Menit/i);
  const detikMatch = raw.match(/(\d+)\s*Detik/i);
  if (jamMatch) total += parseInt(jamMatch[1], 10) * 3600;
  if (menitMatch) total += parseInt(menitMatch[1], 10) * 60;
  if (detikMatch) total += parseInt(detikMatch[1], 10);
  return total;
}

export function classifyAttendanceRow(
  clockIn: string,
  clockOut: string,
  durationSeconds: number
): { anomalyType: AttendanceAnomalyType; effectiveHours: number } {
  if (!clockOut || clockOut === '-') {
    return { anomalyType: 'missing_clock_out', effectiveHours: 0 };
  }
  if (durationSeconds > 0 && durationSeconds < 300) {
    return { anomalyType: 'closing_tap', effectiveHours: 10.0 };
  }
  if (durationSeconds >= 18 * 3600) {
    return { anomalyType: 'overnight_rollover', effectiveHours: 12.0 };
  }
  const hours = Number((durationSeconds / 3600).toFixed(2));
  if (hours > 0 && hours < 8.5) {
    return { anomalyType: 'short_shift', effectiveHours: hours };
  }
  return { anomalyType: 'none', effectiveHours: hours };
}

export function parseMajooAttendanceCsv(
  content: string,
  sourceFileName: string
): {
  records: Array<{
    attendance_id: string;
    work_date: string;
    employee_name: string;
    outlet: string;
    clock_in: string;
    clock_out: string;
    raw_duration: string;
    duration_seconds: number;
    effective_hours: number;
    anomaly_type: AttendanceAnomalyType;
    status: string;
    notes: string;
    source_file: string;
  }>;
  minDate: string | null;
  maxDate: string | null;
} {
  const lines = content.split(/\r?\n/);
  let headerIdx = -1;
  for (let i = 0; i < Math.min(40, lines.length); i++) {
    if (
      lines[i].includes('Tanggal') &&
      lines[i].includes('Nama') &&
      lines[i].includes('Jam Masuk')
    ) {
      headerIdx = i;
      break;
    }
  }

  const records: Array<{
    attendance_id: string;
    work_date: string;
    employee_name: string;
    outlet: string;
    clock_in: string;
    clock_out: string;
    raw_duration: string;
    duration_seconds: number;
    effective_hours: number;
    anomaly_type: AttendanceAnomalyType;
    status: string;
    notes: string;
    source_file: string;
  }> = [];

  if (headerIdx === -1) {
    return { records, minDate: null, maxDate: null };
  }

  let minDate: string | null = null;
  let maxDate: string | null = null;

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith(',,,') || line.includes('Powered by')) continue;
    const cols = line.split(',').map((c) => c.trim());
    const workDate = cols[0] || '';
    const empName = cols[1] || '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(workDate) || !empName) continue;

    const outlet = cols[2] || 'Tyfel Coffee';
    const clockIn = cols[3] || '-';
    const clockOut = cols[4] || '-';
    const rawDuration = cols[5] || '-';
    const status = cols[6] || '';
    const notes = cols[7] || '';

    const durationSeconds = parseDurationToSeconds(rawDuration);
    const { anomalyType, effectiveHours } = classifyAttendanceRow(
      clockIn,
      clockOut,
      durationSeconds
    );

    if (!minDate || workDate < minDate) minDate = workDate;
    if (!maxDate || workDate > maxDate) maxDate = workDate;

    const attendanceId = `${workDate}_${empName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    records.push({
      attendance_id: attendanceId,
      work_date: workDate,
      employee_name: empName,
      outlet,
      clock_in: clockIn,
      clock_out: clockOut,
      raw_duration: rawDuration,
      duration_seconds: durationSeconds,
      effective_hours: effectiveHours,
      anomaly_type: anomalyType,
      status,
      notes,
      source_file: sourceFileName,
    });
  }

  return { records, minDate, maxDate };
}

export async function initializeAttendanceSchemaAndSeed(
  db: DuckDBInstance
): Promise<void> {
  const conn = await db.connect();
  try {
    await conn.run(`
      CREATE TABLE IF NOT EXISTS dim_employees (
        employee_name VARCHAR PRIMARY KEY,
        full_name VARCHAR NOT NULL,
        role VARCHAR NOT NULL,
        outlet VARCHAR NOT NULL,
        join_date_label VARCHAR NOT NULL,
        shift_start_time VARCHAR NOT NULL,
        basic_salary DOUBLE NOT NULL,
        daily_rate DOUBLE NOT NULL,
        late_penalty_rate DOUBLE NOT NULL,
        no_late_bonus DOUBLE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMP
      );
    `);

    await conn.run(`
      CREATE TABLE IF NOT EXISTS fact_attendance (
        attendance_id VARCHAR PRIMARY KEY,
        work_date DATE NOT NULL,
        employee_name VARCHAR NOT NULL,
        outlet VARCHAR NOT NULL,
        clock_in VARCHAR,
        clock_out VARCHAR,
        raw_duration VARCHAR,
        duration_seconds INTEGER,
        effective_hours DOUBLE,
        anomaly_type VARCHAR,
        status VARCHAR,
        notes VARCHAR,
        source_file VARCHAR,
        updated_at TIMESTAMP
      );
    `);

    const colCheck = await conn.run(`
      SELECT count(*) FROM information_schema.columns
      WHERE table_name = 'payroll_period_adjustments'
        AND column_name = 'bonus_qty_override';
    `);
    const colCheckRows = await colCheck.getRows();
    const hasNewCols = Number(colCheckRows[0]?.[0] ?? 0) > 0;
    if (!hasNewCols) {
      await conn.run(`DROP TABLE IF EXISTS payroll_period_adjustments;`);
    }

    await conn.run(`
      CREATE TABLE IF NOT EXISTS payroll_period_adjustments (
        period_key VARCHAR NOT NULL,
        employee_name VARCHAR NOT NULL,
        shift_start_override VARCHAR,
        basic_salary_override DOUBLE,
        daily_rate_override DOUBLE,
        late_penalty_override DOUBLE,
        no_late_bonus_override DOUBLE,
        daily_count_override INTEGER,
        late_count_override INTEGER,
        bonus_qty_override INTEGER,
        bonus_override DOUBLE,
        custom_desc VARCHAR DEFAULT '',
        custom_qty INTEGER DEFAULT 0,
        custom_unit_value DOUBLE DEFAULT 0,
        kasbon_qty INTEGER DEFAULT 0,
        kasbon_unit_value DOUBLE DEFAULT 0,
        notes VARCHAR DEFAULT '',
        updated_at TIMESTAMP,
        PRIMARY KEY (period_key, employee_name)
      );
    `);

    const empValues = MASTER_EMPLOYEES.map(
      (e) => `(
        '${sqlEsc(e.employee_name)}',
        '${sqlEsc(e.full_name)}',
        '${sqlEsc(e.role)}',
        '${sqlEsc(e.outlet)}',
        '${sqlEsc(e.join_date_label)}',
        '${sqlEsc(e.shift_start_time)}',
        ${e.basic_salary},
        ${e.daily_rate},
        ${e.late_penalty_rate},
        ${e.no_late_bonus},
        ${e.is_active ? 'TRUE' : 'FALSE'}
      )`
    ).join(',\n');

    await conn.run(`
      INSERT INTO dim_employees (
        employee_name, full_name, role, outlet, join_date_label,
        shift_start_time, basic_salary, daily_rate, late_penalty_rate,
        no_late_bonus, is_active
      )
      VALUES ${empValues}
      ON CONFLICT (employee_name) DO NOTHING;
    `);

    // Seed default Salary_8 adjustment for Aji (2026-08-16_to_2026-09-15) matching reference payslip
    await conn.run(`
      INSERT INTO payroll_period_adjustments (
        period_key, employee_name, daily_count_override, late_count_override,
        bonus_override, custom_desc, custom_qty, custom_unit_value,
        kasbon_qty, kasbon_unit_value, notes
      )
      VALUES (
        '2026-08-16_to_2026-09-15', 'Aji', 27, NULL,
        NULL, '', 0, 0,
        1, 900000, 'Salary_8 reference payslip (27 full days + Rp 900,000 Kasbon)'
      )
      ON CONFLICT (period_key, employee_name) DO NOTHING;
    `);

    const countRes = await conn.run(`SELECT count(*) FROM fact_attendance`);
    const countRows = await countRes.getRows();
    const existingCount = Number(countRows[0]?.[0] ?? 0);

    if (existingCount === 0) {
      for (const rawDir of getRawReportsReadDirs()) {
        const files = fs
          .readdirSync(rawDir)
          .filter((f) => f.startsWith('majoo_attendance_') && f.endsWith('.csv'));
        for (const f of files) {
          const fullPath = path.join(rawDir, f);
          const content = fs.readFileSync(fullPath, 'utf-8');
          await upsertAttendanceCsvToConn(conn, content, f);
        }
      }
      await conn.run(`CHECKPOINT;`);
    }
  } catch (err) {
    console.warn('[DuckDB Attendance Seed Notice]', err);
  } finally {
    try {
      conn.closeSync();
    } catch {
      // ignore
    }
  }
}

export async function upsertAttendanceCsvToConn(
  conn: DuckDBConnection,
  content: string,
  sourceFileName: string
): Promise<{
  totalParsed: number;
  newInserted: number;
  updatedCount: number;
  minDate: string | null;
  maxDate: string | null;
}> {
  const { records, minDate, maxDate } = parseMajooAttendanceCsv(
    content,
    sourceFileName
  );
  if (records.length === 0) {
    return {
      totalParsed: 0,
      newInserted: 0,
      updatedCount: 0,
      minDate: null,
      maxDate: null,
    };
  }

  const uniqueNames = Array.from(new Set(records.map((r) => r.employee_name)));
  for (const name of uniqueNames) {
    await conn.run(`
      INSERT INTO dim_employees (
        employee_name, full_name, role, outlet, join_date_label,
        shift_start_time, basic_salary, daily_rate, late_penalty_rate,
        no_late_bonus, is_active
      )
      VALUES (
        '${sqlEsc(name)}', '${sqlEsc(name)}', 'Staff', 'Tyfel Coffee',
        'Join 2025', '07:30', 800000, 85000, 20000, 85000, TRUE
      )
      ON CONFLICT (employee_name) DO NOTHING;
    `);
  }

  let updatedCount = 0;
  for (let i = 0; i < records.length; i += 100) {
    const idChunk = records
      .slice(i, i + 100)
      .map((r) => `'${sqlEsc(r.attendance_id)}'`)
      .join(',');
    const existingRes = await conn.run(`
      SELECT count(*) FROM fact_attendance WHERE attendance_id IN (${idChunk})
    `);
    const existingRows = await existingRes.getRows();
    updatedCount += Number(existingRows[0]?.[0] ?? 0);
  }
  const newInserted = Math.max(0, records.length - updatedCount);

  const BATCH_SIZE = 25;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const chunk = records.slice(i, i + BATCH_SIZE);
    const valuesSql = chunk
      .map(
        (r) => `(
          '${sqlEsc(r.attendance_id)}',
          DATE '${sqlEsc(r.work_date)}',
          '${sqlEsc(r.employee_name)}',
          '${sqlEsc(r.outlet)}',
          '${sqlEsc(r.clock_in)}',
          '${sqlEsc(r.clock_out)}',
          '${sqlEsc(r.raw_duration)}',
          ${r.duration_seconds},
          ${r.effective_hours},
          '${sqlEsc(r.anomaly_type)}',
          '${sqlEsc(r.status)}',
          '${sqlEsc(r.notes)}',
          '${sqlEsc(r.source_file)}'
        )`
      )
      .join(',\n');

    await conn.run(`
      INSERT INTO fact_attendance (
        attendance_id, work_date, employee_name, outlet, clock_in, clock_out,
        raw_duration, duration_seconds, effective_hours, anomaly_type,
        status, notes, source_file
      )
      VALUES ${valuesSql}
      ON CONFLICT (attendance_id) DO UPDATE SET
        clock_in = EXCLUDED.clock_in,
        clock_out = EXCLUDED.clock_out,
        raw_duration = EXCLUDED.raw_duration,
        duration_seconds = EXCLUDED.duration_seconds,
        effective_hours = EXCLUDED.effective_hours,
        anomaly_type = EXCLUDED.anomaly_type,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        source_file = EXCLUDED.source_file;
    `);
  }

  return {
    totalParsed: records.length,
    newInserted,
    updatedCount,
    minDate,
    maxDate,
  };
}

function timeToMinutes(hhmm: string): number | null {
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm.trim())) return null;
  const [h, m] = hhmm.trim().split(':').map(Number);
  return h * 60 + m;
}

/**
 * Generates chronological 16th-to-15th payroll periods ordered by Year and Month.
 * For (year, month):
 *   start_date = 16th of previous month (e.g. for January YYYY -> 16 Dec YYYY-1)
 *   end_date   = 15th of current month  (e.g. for January YYYY -> 15 Jan YYYY)
 * Only completed previous periods (end_date <= referenceDate) are selectable!
 */
export function buildChronologicalPayrollCycles(
  referenceDateStr: string,
  logCountsByPeriod: Map<string, number>,
  overrideCountsByPeriod: Map<string, number>
): { years: number[]; cycles: PayrollCycleOption[]; defaultPeriodKey: string } {
  const refYear = parseInt(referenceDateStr.slice(0, 4), 10) || 2026;
  const years = [refYear - 1, refYear]; // e.g. [2025, 2026]
  const cycles: PayrollCycleOption[] = [];

  for (const year of years) {
    for (let month = 1; month <= 12; month++) {
      const prevYear = month === 1 ? year - 1 : year;
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevMm = String(prevMonth).padStart(2, '0');
      const mm = String(month).padStart(2, '0');

      const startDate = `${prevYear}-${prevMm}-16`;
      const endDate = `${year}-${mm}-15`;

      const periodKey = `${startDate}_to_${endDate}`;
      const prevMonthShort = MONTH_SHORTS[prevMonth - 1];
      const monthName = MONTH_NAMES[month - 1];
      const monthShort = MONTH_SHORTS[month - 1];

      // A period is a completed previous period if its endDate <= referenceDateStr
      const isCompleted = endDate <= referenceDateStr;
      const isCurrentRunning =
        startDate <= referenceDateStr && endDate > referenceDateStr;
      const isFuture = startDate > referenceDateStr;

      // Completed previous periods AND the currently running in-progress period can be selected/shown,
      // but only completed previous periods are editable!
      const isSelectable = isCompleted || isCurrentRunning;
      const isEditable = isCompleted;

      const logCount = logCountsByPeriod.get(periodKey) || 0;
      const overrideCount = overrideCountsByPeriod.get(periodKey) || 0;

      let badge = `16 ${prevMonthShort} – 15 ${monthShort}`;
      if (isFuture) {
        badge = 'Future (Locked)';
      } else if (isCurrentRunning) {
        badge = `In Progress (Read-Only)`;
      } else if (logCount > 0) {
        badge = `${logCount} logs · 16 ${prevMonthShort}–15 ${monthShort}`;
      }

      cycles.push({
        period_key: periodKey,
        year,
        month,
        month_name: monthName,
        month_short: monthShort,
        label: `${year} · ${mm} ${monthName} (16 ${prevMonthShort} ${prevYear} – 15 ${monthShort} ${year})`,
        short_label: `${monthShort} ${year}`,
        salary_code: `Salary_${month}`,
        start_date: startDate,
        end_date: endDate,
        badge,
        log_count: logCount,
        override_count: overrideCount,
        is_completed: isCompleted,
        is_current_running: isCurrentRunning,
        is_future: isFuture,
        is_selectable: isSelectable,
        is_editable: isEditable,
      });
    }
  }

  // Default is the most recent completed previous period (e.g., 2026-09: 16 Aug - 15 Sep 2026)
  const completedCycles = cycles.filter((c) => c.is_completed);
  const latestWithLogs = [...completedCycles]
    .reverse()
    .find((c) => c.log_count > 0);
  const defaultCycle =
    latestWithLogs ||
    completedCycles[completedCycles.length - 1] ||
    cycles[0];

  if (defaultCycle) {
    defaultCycle.is_default = true;
  }

  return {
    years,
    cycles,
    defaultPeriodKey: defaultCycle?.period_key || '2026-08-16_to_2026-09-15',
  };
}

export async function getAttendanceCycleReport(params?: {
  periodKey?: string;
}): Promise<AttendanceCycleReport> {
  await getDuckDB();

  // Inspect max date in fact_attendance to anchor reference date (at least 2026-09-26)
  const [maxDateRows, allDatesRaw, allOverridesRaw] = await Promise.all([
    runQuery<{ max_d: string | null }>(
      `SELECT CAST(MAX(work_date) AS VARCHAR) as max_d FROM fact_attendance`
    ),
    runQuery<{ work_date: string; cnt: number }>(`
      SELECT CAST(work_date AS VARCHAR) as work_date, COUNT(*) as cnt
      FROM fact_attendance
      GROUP BY work_date
    `),
    runQuery<{ period_key: string; cnt: number }>(`
      SELECT period_key, COUNT(*) as cnt
      FROM payroll_period_adjustments
      GROUP BY period_key
    `),
  ]);

  const dbMaxDate = maxDateRows[0]?.max_d || '2026-09-26';
  const todayIso = new Date().toISOString().slice(0, 10);
  const referenceDate = dbMaxDate > todayIso ? dbMaxDate : todayIso;

  // Map date counts to 16-15 period keys
  const logCountsByPeriod = new Map<string, number>();
  for (const r of allDatesRaw) {
    const d = r.work_date;
    if (!d || d.length < 10) continue;
    const y = parseInt(d.slice(0, 4), 10);
    const m = parseInt(d.slice(5, 7), 10);
    const day = parseInt(d.slice(8, 10), 10);

    let cycleYear = y;
    let cycleMonth = m;
    if (day <= 15) {
      if (m === 1) {
        cycleYear = y - 1;
        cycleMonth = 12;
      } else {
        cycleMonth = m - 1;
      }
    }
    const endYear = cycleMonth === 12 ? cycleYear + 1 : cycleYear;
    const endMonth = cycleMonth === 12 ? 1 : cycleMonth + 1;
    const pKey = `${cycleYear}-${String(cycleMonth).padStart(2, '0')}-16_to_${endYear}-${String(endMonth).padStart(2, '0')}-15`;
    logCountsByPeriod.set(
      pKey,
      (logCountsByPeriod.get(pKey) || 0) + Number(r.cnt)
    );
  }

  const overrideCountsByPeriod = new Map<string, number>();
  for (const o of allOverridesRaw) {
    overrideCountsByPeriod.set(o.period_key, Number(o.cnt));
  }

  const { years, cycles, defaultPeriodKey } = buildChronologicalPayrollCycles(
    referenceDate,
    logCountsByPeriod,
    overrideCountsByPeriod
  );

  // Enforce only selectable previous periods; fallback to defaultPeriodKey if requested is future/invalid
  let selectedCycle = cycles.find(
    (c) => c.period_key === params?.periodKey && c.is_selectable
  );
  if (!selectedCycle) {
    selectedCycle =
      cycles.find((c) => c.period_key === defaultPeriodKey) || cycles[0];
  }

  const startDate = selectedCycle.start_date;
  const endDate = selectedCycle.end_date;
  const periodKey = selectedCycle.period_key;
  const cycleLabel = selectedCycle.label;
  const salaryCode = selectedCycle.salary_code;

  const [employeesRaw, logsRaw, adjustmentsRaw] = await Promise.all([
    runQuery<{
      employee_name: string;
      full_name: string;
      role: string;
      outlet: string;
      join_date_label: string;
      shift_start_time: string;
      basic_salary: number;
      daily_rate: number;
      late_penalty_rate: number;
      no_late_bonus: number;
      is_active: boolean;
    }>(`
      SELECT
        employee_name, full_name, role, outlet, join_date_label,
        shift_start_time, basic_salary, daily_rate, late_penalty_rate,
        no_late_bonus, is_active
      FROM dim_employees
      ORDER BY is_active DESC, employee_name ASC
    `),
    runQuery<{
      attendance_id: string;
      work_date: string;
      employee_name: string;
      outlet: string;
      clock_in: string;
      clock_out: string;
      raw_duration: string;
      duration_seconds: number;
      effective_hours: number;
      anomaly_type: AttendanceAnomalyType;
      status: string;
      notes: string;
      source_file: string;
    }>(`
      SELECT
        attendance_id,
        CAST(work_date AS VARCHAR) as work_date,
        employee_name,
        outlet,
        clock_in,
        clock_out,
        raw_duration,
        duration_seconds,
        effective_hours,
        anomaly_type,
        status,
        notes,
        source_file
      FROM fact_attendance
      WHERE work_date >= DATE '${sqlEsc(startDate)}'
        AND work_date <= DATE '${sqlEsc(endDate)}'
      ORDER BY work_date DESC, clock_in DESC
    `),
    runQuery<{
      period_key: string;
      employee_name: string;
      shift_start_override: string | null;
      basic_salary_override: number | null;
      daily_rate_override: number | null;
      late_penalty_override: number | null;
      no_late_bonus_override: number | null;
      daily_count_override: number | null;
      late_count_override: number | null;
      bonus_qty_override: number | null;
      bonus_override: number | null;
      custom_desc: string;
      custom_qty: number;
      custom_unit_value: number;
      kasbon_qty: number;
      kasbon_unit_value: number;
      notes: string;
    }>(`
      SELECT
        period_key,
        employee_name,
        shift_start_override,
        basic_salary_override,
        daily_rate_override,
        late_penalty_override,
        no_late_bonus_override,
        daily_count_override,
        late_count_override,
        bonus_qty_override,
        bonus_override,
        custom_desc,
        custom_qty,
        custom_unit_value,
        kasbon_qty,
        kasbon_unit_value,
        notes
      FROM payroll_period_adjustments
      WHERE period_key = '${sqlEsc(periodKey)}'
    `),
  ]);

  const empMap = new Map<string, EmployeeMaster>();
  for (const e of employeesRaw) {
    empMap.set(e.employee_name, {
      ...e,
      basic_salary: Number(e.basic_salary),
      daily_rate: Number(e.daily_rate),
      late_penalty_rate: Number(e.late_penalty_rate),
      no_late_bonus: Number(e.no_late_bonus),
      is_active: Boolean(e.is_active),
    });
  }

  const adjMap = new Map<string, PayrollAdjustment>();
  for (const a of adjustmentsRaw) {
    adjMap.set(a.employee_name, {
      period_key: a.period_key,
      employee_name: a.employee_name,
      shift_start_override: a.shift_start_override || null,
      basic_salary_override:
        a.basic_salary_override !== null &&
        a.basic_salary_override !== undefined
          ? Number(a.basic_salary_override)
          : null,
      daily_rate_override:
        a.daily_rate_override !== null && a.daily_rate_override !== undefined
          ? Number(a.daily_rate_override)
          : null,
      late_penalty_override:
        a.late_penalty_override !== null &&
        a.late_penalty_override !== undefined
          ? Number(a.late_penalty_override)
          : null,
      no_late_bonus_override:
        a.no_late_bonus_override !== null &&
        a.no_late_bonus_override !== undefined
          ? Number(a.no_late_bonus_override)
          : null,
      daily_count_override:
        a.daily_count_override !== null && a.daily_count_override !== undefined
          ? Number(a.daily_count_override)
          : null,
      late_count_override:
        a.late_count_override !== null && a.late_count_override !== undefined
          ? Number(a.late_count_override)
          : null,
      bonus_qty_override:
        a.bonus_qty_override !== null && a.bonus_qty_override !== undefined
          ? Number(a.bonus_qty_override)
          : null,
      bonus_override:
        a.bonus_override !== null && a.bonus_override !== undefined
          ? Number(a.bonus_override)
          : null,
      custom_desc: a.custom_desc || '',
      custom_qty: Number(a.custom_qty || 0),
      custom_unit_value: Number(a.custom_unit_value || 0),
      kasbon_qty: Number(a.kasbon_qty || 0),
      kasbon_unit_value: Number(a.kasbon_unit_value || 0),
      notes: a.notes || '',
    });
  }

  const enrichedLogs: AttendanceRecord[] = logsRaw.map((l) => {
    const emp = empMap.get(l.employee_name);
    const adj = adjMap.get(l.employee_name);
    const cutoff =
      adj?.shift_start_override || emp?.shift_start_time || '07:30';
    const inMins = timeToMinutes(l.clock_in);
    const cutoffMins = timeToMinutes(cutoff) ?? 450;

    const isClosingTap = l.anomaly_type === 'closing_tap';
    const diffMins = inMins !== null ? inMins - cutoffMins : 0;
    const isLate = !isClosingTap && inMins !== null && diffMins > 0;
    const lateMinutes = isLate ? diffMins : 0;
    const earlyMinutes =
      !isClosingTap && inMins !== null && diffMins < 0 ? Math.abs(diffMins) : 0;

    return {
      ...l,
      duration_seconds: Number(l.duration_seconds || 0),
      effective_hours: Number(l.effective_hours || 0),
      shift_start_time: cutoff,
      is_late: isLate,
      late_minutes: lateMinutes,
      early_minutes: earlyMinutes,
    };
  });

  const payslips: EmployeePayslipSummary[] = [];

  for (const emp of empMap.values()) {
    const empLogs = enrichedLogs.filter(
      (l) => l.employee_name === emp.employee_name
    );
    const adj = adjMap.get(emp.employee_name);

    if (!emp.is_active && empLogs.length === 0 && !adj) {
      continue;
    }

    const effectiveShiftStart =
      adj?.shift_start_override || emp.shift_start_time;
    const effectiveBasicSalary =
      adj?.basic_salary_override !== null &&
      adj?.basic_salary_override !== undefined
        ? adj.basic_salary_override
        : emp.basic_salary;
    const effectiveDailyRate =
      adj?.daily_rate_override !== null &&
      adj?.daily_rate_override !== undefined
        ? adj.daily_rate_override
        : emp.daily_rate;
    const effectiveLatePenaltyRate =
      adj?.late_penalty_override !== null &&
      adj?.late_penalty_override !== undefined
        ? adj.late_penalty_override
        : emp.late_penalty_rate;
    const effectiveNoLateBonus =
      adj?.no_late_bonus_override !== null &&
      adj?.no_late_bonus_override !== undefined
        ? adj.no_late_bonus_override
        : emp.no_late_bonus;

    const rawLogsCount = empLogs.length;
    const closingTapsCount = empLogs.filter(
      (l) => l.anomaly_type === 'closing_tap'
    ).length;
    const overnightRolloversCount = empLogs.filter(
      (l) => l.anomaly_type === 'overnight_rollover'
    ).length;
    const openShiftsCount = empLogs.filter(
      (l) => l.anomaly_type === 'missing_clock_out'
    ).length;
    const shortShiftsCount = empLogs.filter(
      (l) => l.anomaly_type === 'short_shift'
    ).length;
    const fullShiftsCount = Math.max(
      0,
      rawLogsCount - closingTapsCount - shortShiftsCount - openShiftsCount
    );

    const lateLogs = empLogs.filter((l) => l.is_late);
    const anomalyLogs = empLogs.filter((l) => l.anomaly_type !== 'none');

    const computedDailyCount = rawLogsCount;
    const computedLateCount = lateLogs.length;
    const onTimeCount = Math.max(
      0,
      rawLogsCount - computedLateCount - closingTapsCount
    );
    const punctualityRatePct =
      rawLogsCount > 0
        ? Number(
            (((rawLogsCount - computedLateCount) / rawLogsCount) * 100).toFixed(
              1
            )
          )
        : 100;

    const totalEffectiveHours = Number(
      empLogs.reduce((acc, r) => acc + r.effective_hours, 0).toFixed(1)
    );
    const avgEffectiveHours =
      rawLogsCount > 0
        ? Number((totalEffectiveHours / rawLogsCount).toFixed(1))
        : 0;
    const totalLateMinutes = lateLogs.reduce(
      (acc, r) => acc + r.late_minutes,
      0
    );

    // Payslip computation with per-period overrides
    const basicIsOverridden =
      adj?.basic_salary_override !== null &&
      adj?.basic_salary_override !== undefined;
    const basicQty = effectiveBasicSalary > 0 ? 1 : 0;
    const basicUnit = effectiveBasicSalary;
    const basicTotal = basicQty * basicUnit;

    const dailyIsOverridden =
      adj?.daily_count_override !== null &&
      adj?.daily_count_override !== undefined;
    const dailyRateIsOverridden =
      adj?.daily_rate_override !== null &&
      adj?.daily_rate_override !== undefined;
    const dailyQty = dailyIsOverridden
      ? adj!.daily_count_override!
      : computedDailyCount;
    const dailyUnit = effectiveDailyRate;
    const dailyTotal = dailyQty * dailyUnit;

    const lateIsOverridden =
      adj?.late_count_override !== null &&
      adj?.late_count_override !== undefined;
    const lateRateIsOverridden =
      adj?.late_penalty_override !== null &&
      adj?.late_penalty_override !== undefined;
    const lateQty = lateIsOverridden
      ? adj!.late_count_override!
      : computedLateCount;
    const lateUnit = effectiveLatePenaltyRate;
    const lateTotal = -(lateQty * lateUnit);

    const bonusQtyIsOverridden =
      adj?.bonus_qty_override !== null && adj?.bonus_qty_override !== undefined;
    const qualifiesBonus =
      lateQty === 0 && dailyQty >= 10 && effectiveNoLateBonus > 0;
    const bonusQty = bonusQtyIsOverridden
      ? adj!.bonus_qty_override!
      : qualifiesBonus
        ? 1
        : 0;
    const bonusUnit = effectiveNoLateBonus;
    const bonusTotal =
      adj?.bonus_override !== null && adj?.bonus_override !== undefined
        ? adj.bonus_override
        : bonusQty * bonusUnit;

    const customDesc = adj?.custom_desc || '';
    const customQty = adj?.custom_qty || 0;
    const customUnit = adj?.custom_unit_value || 0;
    const customTotal = customQty * customUnit;

    const grandTotal =
      basicTotal + dailyTotal + lateTotal + bonusTotal + customTotal;

    const kasbonQty = adj?.kasbon_qty || 0;
    const kasbonUnit = adj?.kasbon_unit_value || 0;
    const kasbonTotal = -(kasbonQty * kasbonUnit);

    const netTakeHomePay = grandTotal + kasbonTotal;

    payslips.push({
      employee: emp,
      period_key: periodKey,
      year: selectedCycle.year,
      month: selectedCycle.month,
      start_date: startDate,
      end_date: endDate,
      has_period_override: Boolean(adj),
      effective_shift_start: effectiveShiftStart,
      effective_basic_salary: effectiveBasicSalary,
      effective_daily_rate: effectiveDailyRate,
      effective_late_penalty_rate: effectiveLatePenaltyRate,
      effective_no_late_bonus: effectiveNoLateBonus,
      raw_logs_count: rawLogsCount,
      full_shifts_count: fullShiftsCount,
      short_shifts_count: shortShiftsCount,
      closing_taps_count: closingTapsCount,
      overnight_rollovers_count: overnightRolloversCount,
      open_shifts_count: openShiftsCount,
      computed_daily_count: computedDailyCount,
      computed_late_count: computedLateCount,
      on_time_count: onTimeCount,
      punctuality_rate_pct: punctualityRatePct,
      total_effective_hours: totalEffectiveHours,
      avg_effective_hours: avgEffectiveHours,
      total_late_minutes: totalLateMinutes,
      basic_qty: basicQty,
      basic_unit: basicUnit,
      basic_total: basicTotal,
      basic_is_overridden: basicIsOverridden,
      daily_qty: dailyQty,
      daily_is_overridden: dailyIsOverridden,
      daily_unit: dailyUnit,
      daily_rate_is_overridden: dailyRateIsOverridden,
      daily_total: dailyTotal,
      late_qty: lateQty,
      late_is_overridden: lateIsOverridden,
      late_unit: lateUnit,
      late_rate_is_overridden: lateRateIsOverridden,
      late_total: lateTotal,
      bonus_tidak_telat_qty: bonusQty,
      bonus_qty_is_overridden: bonusQtyIsOverridden,
      bonus_tidak_telat_unit: bonusUnit,
      bonus_tidak_telat_total: bonusTotal,
      custom_desc: customDesc,
      custom_qty: customQty,
      custom_unit: customUnit,
      custom_total: customTotal,
      grand_total: grandTotal,
      kasbon_qty: kasbonQty,
      kasbon_unit: kasbonUnit,
      kasbon_total: kasbonTotal,
      net_take_home_pay: netTakeHomePay,
      notes: adj?.notes || '',
      late_logs: lateLogs,
      anomaly_logs: anomalyLogs,
      all_logs: empLogs,
    });
  }

  payslips.sort((a, b) => {
    if (a.employee.employee_name === 'Aji') return -1;
    if (b.employee.employee_name === 'Aji') return 1;
    return b.daily_qty - a.daily_qty;
  });

  const activePayslips = payslips.filter(
    (p) => p.raw_logs_count > 0 || p.has_period_override
  );
  const totalAttendanceLogs = enrichedLogs.length;
  const totalWorkDaysPaid = payslips.reduce((s, p) => s + p.daily_qty, 0);
  const totalLateIncidents = payslips.reduce((s, p) => s + p.late_qty, 0);
  const overallPunctualityPct =
    totalAttendanceLogs > 0
      ? Number(
          (
            ((totalAttendanceLogs -
              enrichedLogs.filter((l) => l.is_late).length) /
              totalAttendanceLogs) *
            100
          ).toFixed(1)
        )
      : 100;

  const zeroLateAchievers = activePayslips.filter(
    (p) => p.bonus_tidak_telat_qty > 0
  ).length;
  const totalClosingTaps = enrichedLogs.filter(
    (l) => l.anomaly_type === 'closing_tap'
  ).length;
  const totalOvernightRollovers = enrichedLogs.filter(
    (l) => l.anomaly_type === 'overnight_rollover'
  ).length;
  const avgDailyShiftHours =
    totalAttendanceLogs > 0
      ? Number(
          (
            enrichedLogs.reduce((s, l) => s + l.effective_hours, 0) /
            totalAttendanceLogs
          ).toFixed(1)
        )
      : 0;

  const totalGrossPayroll = payslips.reduce((s, p) => s + p.grand_total, 0);
  const totalLatePenalties = payslips.reduce(
    (s, p) => s + Math.abs(p.late_total),
    0
  );
  const totalBonusesPaid = payslips.reduce(
    (s, p) => s + p.bonus_tidak_telat_total,
    0
  );
  const totalKasbonDeducted = payslips.reduce(
    (s, p) => s + Math.abs(p.kasbon_total),
    0
  );
  const totalNetTakeHome = payslips.reduce(
    (s, p) => s + p.net_take_home_pay,
    0
  );

  return {
    period_key: periodKey,
    year: selectedCycle.year,
    month: selectedCycle.month,
    cycle_label: cycleLabel,
    salary_code: salaryCode,
    start_date: startDate,
    end_date: endDate,
    is_current_running: selectedCycle.is_current_running,
    is_editable: selectedCycle.is_editable,
    available_years: years,
    available_cycles: cycles,
    overall: {
      active_employees: activePayslips.length,
      total_attendance_logs: totalAttendanceLogs,
      total_work_days_paid: totalWorkDaysPaid,
      total_late_incidents: totalLateIncidents,
      overall_punctuality_pct: overallPunctualityPct,
      zero_late_achievers: zeroLateAchievers,
      total_closing_taps: totalClosingTaps,
      total_overnight_rollovers: totalOvernightRollovers,
      avg_daily_shift_hours: avgDailyShiftHours,
      total_gross_payroll: totalGrossPayroll,
      total_late_penalties: totalLatePenalties,
      total_bonuses_paid: totalBonusesPaid,
      total_kasbon_deducted: totalKasbonDeducted,
      total_net_take_home: totalNetTakeHome,
    },
    payslips,
    recent_logs: enrichedLogs,
  };
}

export async function updateEmployeeAndPayrollAdjustment(payload: {
  employee_name: string;
  period_key: string;
  reset_period?: boolean;
  update_master_defaults?: boolean;
  full_name?: string;
  role?: string;
  join_date_label?: string;
  shift_start_override?: string | null;
  basic_salary_override?: number | null;
  daily_rate_override?: number | null;
  late_penalty_override?: number | null;
  no_late_bonus_override?: number | null;
  daily_count_override?: number | null;
  late_count_override?: number | null;
  bonus_qty_override?: number | null;
  custom_desc?: string;
  custom_qty?: number;
  custom_unit_value?: number;
  kasbon_qty?: number;
  kasbon_unit_value?: number;
  notes?: string;
}): Promise<void> {
  const maxDateRows = await runQuery<{ max_d: string | null }>(
    `SELECT CAST(MAX(work_date) AS VARCHAR) as max_d FROM fact_attendance`
  );
  const dbMaxDate = maxDateRows[0]?.max_d || '2026-09-26';
  const todayIso = new Date().toISOString().slice(0, 10);
  const referenceDate = dbMaxDate > todayIso ? dbMaxDate : todayIso;
  const endDatePart = payload.period_key.split('_to_')[1] || '';
  if (endDatePart > referenceDate) {
    throw new Error(
      'In-progress periods are read-only and cannot be edited until the period closes.'
    );
  }

  const db = await getDuckDB();
  const conn = await db.connect();
  try {
    if (payload.reset_period) {
      await conn.run(`
        DELETE FROM payroll_period_adjustments
        WHERE period_key = '${sqlEsc(payload.period_key)}'
          AND employee_name = '${sqlEsc(payload.employee_name)}';
      `);
      await conn.run(`CHECKPOINT;`);
      return;
    }

    // Update employee identity metadata (and optionally master rate defaults if requested)
    const sets: string[] = [];
    if (payload.full_name !== undefined)
      sets.push(`full_name = '${sqlEsc(payload.full_name)}'`);
    if (payload.role !== undefined)
      sets.push(`role = '${sqlEsc(payload.role)}'`);
    if (payload.join_date_label !== undefined)
      sets.push(`join_date_label = '${sqlEsc(payload.join_date_label)}'`);

    if (payload.update_master_defaults) {
      if (payload.shift_start_override)
        sets.push(`shift_start_time = '${sqlEsc(payload.shift_start_override)}'`);
      if (
        payload.basic_salary_override !== null &&
        payload.basic_salary_override !== undefined
      )
        sets.push(`basic_salary = ${Number(payload.basic_salary_override)}`);
      if (
        payload.daily_rate_override !== null &&
        payload.daily_rate_override !== undefined
      )
        sets.push(`daily_rate = ${Number(payload.daily_rate_override)}`);
      if (
        payload.late_penalty_override !== null &&
        payload.late_penalty_override !== undefined
      )
        sets.push(
          `late_penalty_rate = ${Number(payload.late_penalty_override)}`
        );
      if (
        payload.no_late_bonus_override !== null &&
        payload.no_late_bonus_override !== undefined
      )
        sets.push(`no_late_bonus = ${Number(payload.no_late_bonus_override)}`);
    }

    if (sets.length > 0) {
      await conn.run(`
        UPDATE dim_employees
        SET ${sets.join(', ')}
        WHERE employee_name = '${sqlEsc(payload.employee_name)}';
      `);
    }

    const toSqlNumOrNull = (val: number | null | undefined) =>
      val === null || val === undefined || Number.isNaN(Number(val))
        ? 'NULL'
        : String(Number(val));
    const toSqlStrOrNull = (val: string | null | undefined) =>
      !val || val.trim() === '' ? 'NULL' : `'${sqlEsc(val.trim())}'`;

    await conn.run(`
      INSERT INTO payroll_period_adjustments (
        period_key,
        employee_name,
        shift_start_override,
        basic_salary_override,
        daily_rate_override,
        late_penalty_override,
        no_late_bonus_override,
        daily_count_override,
        late_count_override,
        bonus_qty_override,
        bonus_override,
        custom_desc,
        custom_qty,
        custom_unit_value,
        kasbon_qty,
        kasbon_unit_value,
        notes
      )
      VALUES (
        '${sqlEsc(payload.period_key)}',
        '${sqlEsc(payload.employee_name)}',
        ${toSqlStrOrNull(payload.shift_start_override)},
        ${toSqlNumOrNull(payload.basic_salary_override)},
        ${toSqlNumOrNull(payload.daily_rate_override)},
        ${toSqlNumOrNull(payload.late_penalty_override)},
        ${toSqlNumOrNull(payload.no_late_bonus_override)},
        ${toSqlNumOrNull(payload.daily_count_override)},
        ${toSqlNumOrNull(payload.late_count_override)},
        ${toSqlNumOrNull(payload.bonus_qty_override)},
        NULL,
        '${sqlEsc(payload.custom_desc || '')}',
        ${Number(payload.custom_qty || 0)},
        ${Number(payload.custom_unit_value || 0)},
        ${Number(payload.kasbon_qty || 0)},
        ${Number(payload.kasbon_unit_value || 0)},
        '${sqlEsc(payload.notes || '')}'
      )
      ON CONFLICT (period_key, employee_name) DO UPDATE SET
        shift_start_override = EXCLUDED.shift_start_override,
        basic_salary_override = EXCLUDED.basic_salary_override,
        daily_rate_override = EXCLUDED.daily_rate_override,
        late_penalty_override = EXCLUDED.late_penalty_override,
        no_late_bonus_override = EXCLUDED.no_late_bonus_override,
        daily_count_override = EXCLUDED.daily_count_override,
        late_count_override = EXCLUDED.late_count_override,
        bonus_qty_override = EXCLUDED.bonus_qty_override,
        custom_desc = EXCLUDED.custom_desc,
        custom_qty = EXCLUDED.custom_qty,
        custom_unit_value = EXCLUDED.custom_unit_value,
        kasbon_qty = EXCLUDED.kasbon_qty,
        kasbon_unit_value = EXCLUDED.kasbon_unit_value,
        notes = EXCLUDED.notes;
    `);
    await conn.run(`CHECKPOINT;`);
  } finally {
    try {
      conn.closeSync();
    } catch {
      // ignore
    }
  }
}
