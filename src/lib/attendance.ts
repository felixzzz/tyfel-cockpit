import fs from 'fs';
import path from 'path';
import { DuckDBConnection, DuckDBInstance } from '@duckdb/node-api';
import { getDuckDB, runQuery } from './duckdb';

const RAW_DIR =
  process.env.RAW_REPORTS_DIR ||
  path.resolve(process.cwd(), '../reports/raw');

export interface EmployeeMaster {
  employee_name: string;
  full_name: string;
  role: string;
  outlet: string;
  join_date_label: string;
  shift_start_time: string; // HH:MM e.g. '07:30'
  basic_salary: number;
  daily_rate: number;
  late_penalty_rate: number;
  no_late_bonus: number;
  is_active: boolean;
}

export interface PayrollAdjustment {
  period_key: string;
  employee_name: string;
  daily_count_override: number | null;
  late_count_override: number | null;
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
  // Computed against employee shift schedule
  shift_start_time: string;
  is_late: boolean;
  late_minutes: number;
  early_minutes: number;
}

export interface EmployeePayslipSummary {
  employee: EmployeeMaster;
  period_key: string;
  start_date: string;
  end_date: string;
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

  daily_qty: number;
  daily_is_overridden: boolean;
  daily_unit: number;
  daily_total: number;

  late_qty: number;
  late_is_overridden: boolean;
  late_unit: number; // positive number; rendered as negative (Rp (20,000))
  late_total: number; // negative number e.g. -100000

  bonus_tidak_telat_qty: number;
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
  label: string;
  short_label: string;
  salary_code: string;
  start_date: string;
  end_date: string;
  badge: string;
  is_default?: boolean;
}

export interface AttendanceCycleReport {
  period_key: string;
  cycle_label: string;
  salary_code: string;
  start_date: string;
  end_date: string;
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
  // Micro-punch (< 5 minutes): employee forgot morning clock-in and tapped in/out at closing
  if (durationSeconds > 0 && durationSeconds < 300) {
    return { anomalyType: 'closing_tap', effectiveHours: 10.0 };
  }
  // Overnight rollover (>= 18 hours): employee forgot evening clock-out and closed next day
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await conn.run(`
      CREATE TABLE IF NOT EXISTS payroll_period_adjustments (
        period_key VARCHAR NOT NULL,
        employee_name VARCHAR NOT NULL,
        daily_count_override INTEGER,
        late_count_override INTEGER,
        bonus_override DOUBLE,
        custom_desc VARCHAR DEFAULT '',
        custom_qty INTEGER DEFAULT 0,
        custom_unit_value DOUBLE DEFAULT 0,
        kasbon_qty INTEGER DEFAULT 0,
        kasbon_unit_value DOUBLE DEFAULT 0,
        notes VARCHAR DEFAULT '',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (period_key, employee_name)
      );
    `);

    // Seed dim_employees (DO NOTHING on conflict so user edits persist)
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
        ${e.is_active ? 'TRUE' : 'FALSE'},
        CURRENT_TIMESTAMP
      )`
    ).join(',\n');

    await conn.run(`
      INSERT INTO dim_employees (
        employee_name, full_name, role, outlet, join_date_label,
        shift_start_time, basic_salary, daily_rate, late_penalty_rate,
        no_late_bonus, is_active, updated_at
      )
      VALUES ${empValues}
      ON CONFLICT (employee_name) DO NOTHING;
    `);

    // Seed default Salary_8 adjustment for Aji (2026-08-16_to_2026-09-15) matching reference payslip
    await conn.run(`
      INSERT INTO payroll_period_adjustments (
        period_key, employee_name, daily_count_override, late_count_override,
        bonus_override, custom_desc, custom_qty, custom_unit_value,
        kasbon_qty, kasbon_unit_value, notes, updated_at
      )
      VALUES (
        '2026-08-16_to_2026-09-15', 'Aji', 27, NULL,
        NULL, '', 0, 0,
        1, 900000, 'Salary_8 reference payslip (27 full days + Rp 900,000 Kasbon)', CURRENT_TIMESTAMP
      )
      ON CONFLICT (period_key, employee_name) DO NOTHING;
    `);

    // Auto-ingest any majoo_attendance_*.csv in RAW_DIR if fact_attendance is empty
    const countRes = await conn.run(`SELECT count(*) FROM fact_attendance`);
    const countRows = await countRes.getRows();
    const existingCount = Number(countRows[0]?.[0] ?? 0);

    if (existingCount === 0 && fs.existsSync(RAW_DIR)) {
      const files = fs
        .readdirSync(RAW_DIR)
        .filter((f) => f.startsWith('majoo_attendance_') && f.endsWith('.csv'));
      for (const f of files) {
        const fullPath = path.join(RAW_DIR, f);
        const content = fs.readFileSync(fullPath, 'utf-8');
        await upsertAttendanceCsvToConn(conn, content, f);
      }
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

  // Ensure any newly discovered employee names in the CSV exist in dim_employees
  const uniqueNames = Array.from(new Set(records.map((r) => r.employee_name)));
  for (const name of uniqueNames) {
    await conn.run(`
      INSERT INTO dim_employees (
        employee_name, full_name, role, outlet, join_date_label,
        shift_start_time, basic_salary, daily_rate, late_penalty_rate,
        no_late_bonus, is_active, updated_at
      )
      VALUES (
        '${sqlEsc(name)}', '${sqlEsc(name)}', 'Staff', 'Tyfel Coffee',
        'Join 2025', '07:30', 800000, 85000, 20000, 85000, TRUE, CURRENT_TIMESTAMP
      )
      ON CONFLICT (employee_name) DO NOTHING;
    `);
  }

  const idsSql = records.map((r) => `'${sqlEsc(r.attendance_id)}'`).join(',');
  const existingRes = await conn.run(`
    SELECT count(*) FROM fact_attendance WHERE attendance_id IN (${idsSql})
  `);
  const existingRows = await existingRes.getRows();
  const updatedCount = Number(existingRows[0]?.[0] ?? 0);
  const newInserted = Math.max(0, records.length - updatedCount);

  const BATCH_SIZE = 200;
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
          '${sqlEsc(r.source_file)}',
          CURRENT_TIMESTAMP
        )`
      )
      .join(',\n');

    await conn.run(`
      INSERT INTO fact_attendance (
        attendance_id, work_date, employee_name, outlet, clock_in, clock_out,
        raw_duration, duration_seconds, effective_hours, anomaly_type,
        status, notes, source_file, updated_at
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
        source_file = EXCLUDED.source_file,
        updated_at = EXCLUDED.updated_at;
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

export function getPayrollCycleOptions(): PayrollCycleOption[] {
  return [
    {
      period_key: '2026-08-16_to_2026-09-15',
      label: '16 Aug 2026 – 15 Sep 2026 (Salary_8 Cycle)',
      short_label: '16 Aug – 15 Sep 2026',
      salary_code: 'Salary_8',
      start_date: '2026-08-16',
      end_date: '2026-09-15',
      badge: 'Completed 16–15 Cycle',
      is_default: true,
    },
    {
      period_key: '2026-09-16_to_2026-10-15',
      label: '16 Sep 2026 – 15 Oct 2026 (Salary_9 Running)',
      short_label: '16 Sep – 15 Oct 2026',
      salary_code: 'Salary_9',
      start_date: '2026-09-16',
      end_date: '2026-10-15',
      badge: 'Active Cycle (In Progress)',
    },
    {
      period_key: '2026-07-16_to_2026-08-15',
      label: '16 Jul 2026 – 15 Aug 2026 (Salary_7 Partial)',
      short_label: '16 Jul – 15 Aug 2026',
      salary_code: 'Salary_7',
      start_date: '2026-07-16',
      end_date: '2026-08-15',
      badge: 'Aug 1–15 Logs Available',
    },
    {
      period_key: '2026-08-01_to_2026-09-26',
      label: '01 Aug 2026 – 26 Sep 2026 (Full 2-Month Audit)',
      short_label: '01 Aug – 26 Sep 2026',
      salary_code: 'Full_Audit',
      start_date: '2026-08-01',
      end_date: '2026-09-26',
      badge: 'All Imported Logs',
    },
  ];
}

export async function getAttendanceCycleReport(params?: {
  periodKey?: string;
  from?: string;
  to?: string;
}): Promise<AttendanceCycleReport> {
  await getDuckDB();
  const cycles = getPayrollCycleOptions();

  let selectedCycle =
    cycles.find((c) => c.period_key === params?.periodKey) || cycles[0];

  let startDate = selectedCycle.start_date;
  let endDate = selectedCycle.end_date;
  let periodKey = selectedCycle.period_key;
  let cycleLabel = selectedCycle.label;
  let salaryCode = selectedCycle.salary_code;

  if (
    params?.from &&
    params?.to &&
    /^\d{4}-\d{2}-\d{2}$/.test(params.from) &&
    /^\d{4}-\d{2}-\d{2}$/.test(params.to)
  ) {
    startDate = params.from;
    endDate = params.to;
    periodKey = `${startDate}_to_${endDate}`;
    const matched = cycles.find(
      (c) => c.start_date === startDate && c.end_date === endDate
    );
    if (matched) {
      selectedCycle = matched;
      cycleLabel = matched.label;
      salaryCode = matched.salary_code;
    } else {
      cycleLabel = `Custom Period (${startDate} – ${endDate})`;
      salaryCode = 'Custom_Salary';
    }
  }

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
      daily_count_override: number | null;
      late_count_override: number | null;
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
        daily_count_override,
        late_count_override,
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
      daily_count_override:
        a.daily_count_override !== null && a.daily_count_override !== undefined
          ? Number(a.daily_count_override)
          : null,
      late_count_override:
        a.late_count_override !== null && a.late_count_override !== undefined
          ? Number(a.late_count_override)
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
    const cutoff = emp?.shift_start_time || '07:30';
    const inMins = timeToMinutes(l.clock_in);
    const cutoffMins = timeToMinutes(cutoff) ?? 450;

    // A closing_tap (< 5 mins duration at evening closing) is a missed morning punch, not a late morning arrival
    const isClosingTap = l.anomaly_type === 'closing_tap';
    const diffMins = inMins !== null ? inMins - cutoffMins : 0;
    const isLate = !isClosingTap && inMins !== null && diffMins > 0;
    const lateMinutes = isLate ? diffMins : 0;
    const earlyMinutes = !isClosingTap && inMins !== null && diffMins < 0 ? Math.abs(diffMins) : 0;

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

  // Build payslip per employee
  const payslips: EmployeePayslipSummary[] = [];

  for (const emp of empMap.values()) {
    const empLogs = enrichedLogs.filter(
      (l) => l.employee_name === emp.employee_name
    );
    const adj = adjMap.get(emp.employee_name);

    // Skip inactive relief staff if they have 0 logs in this cycle
    if (!emp.is_active && empLogs.length === 0) {
      continue;
    }

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
    const onTimeCount = Math.max(0, rawLogsCount - computedLateCount - closingTapsCount);
    const punctualityRatePct =
      rawLogsCount > 0
        ? Number((((rawLogsCount - computedLateCount) / rawLogsCount) * 100).toFixed(1))
        : 100;

    const totalEffectiveHours = Number(
      empLogs.reduce((acc, r) => acc + r.effective_hours, 0).toFixed(1)
    );
    const avgEffectiveHours =
      rawLogsCount > 0
        ? Number((totalEffectiveHours / rawLogsCount).toFixed(1))
        : 0;
    const totalLateMinutes = lateLogs.reduce((acc, r) => acc + r.late_minutes, 0);

    // Payslip computation matching Salary_8
    const basicQty = emp.basic_salary > 0 ? 1 : 0;
    const basicUnit = emp.basic_salary;
    const basicTotal = basicQty * basicUnit;

    const dailyIsOverridden =
      adj?.daily_count_override !== null &&
      adj?.daily_count_override !== undefined;
    const dailyQty = dailyIsOverridden
      ? adj!.daily_count_override!
      : computedDailyCount;
    const dailyUnit = emp.daily_rate;
    const dailyTotal = dailyQty * dailyUnit;

    const lateIsOverridden =
      adj?.late_count_override !== null &&
      adj?.late_count_override !== undefined;
    const lateQty = lateIsOverridden
      ? adj!.late_count_override!
      : computedLateCount;
    const lateUnit = emp.late_penalty_rate;
    const lateTotal = -(lateQty * lateUnit);

    // Bonus Tidak Telat: 1 x no_late_bonus if lateQty === 0 and worked at least 10 days
    const qualifiesBonus = lateQty === 0 && dailyQty >= 10 && emp.no_late_bonus > 0;
    const bonusQty = qualifiesBonus ? 1 : 0;
    const bonusUnit = emp.no_late_bonus;
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
      start_date: startDate,
      end_date: endDate,
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
      daily_qty: dailyQty,
      daily_is_overridden: dailyIsOverridden,
      daily_unit: dailyUnit,
      daily_total: dailyTotal,
      late_qty: lateQty,
      late_is_overridden: lateIsOverridden,
      late_unit: lateUnit,
      late_total: lateTotal,
      bonus_tidak_telat_qty: bonusQty,
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

  // Sort payslips so Aji is first (hero reference) followed by highest workdays
  payslips.sort((a, b) => {
    if (a.employee.employee_name === 'Aji') return -1;
    if (b.employee.employee_name === 'Aji') return 1;
    return b.daily_qty - a.daily_qty;
  });

  const activePayslips = payslips.filter((p) => p.raw_logs_count > 0);
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
    cycle_label: cycleLabel,
    salary_code: salaryCode,
    start_date: startDate,
    end_date: endDate,
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
  full_name?: string;
  role?: string;
  join_date_label?: string;
  shift_start_time?: string;
  basic_salary?: number;
  daily_rate?: number;
  late_penalty_rate?: number;
  no_late_bonus?: number;
  daily_count_override?: number | null;
  late_count_override?: number | null;
  custom_desc?: string;
  custom_qty?: number;
  custom_unit_value?: number;
  kasbon_qty?: number;
  kasbon_unit_value?: number;
  notes?: string;
}): Promise<void> {
  const db = await getDuckDB();
  const conn = await db.connect();
  try {
    if (
      payload.full_name !== undefined ||
      payload.role !== undefined ||
      payload.join_date_label !== undefined ||
      payload.shift_start_time !== undefined ||
      payload.basic_salary !== undefined ||
      payload.daily_rate !== undefined ||
      payload.late_penalty_rate !== undefined ||
      payload.no_late_bonus !== undefined
    ) {
      const sets: string[] = [];
      if (payload.full_name !== undefined)
        sets.push(`full_name = '${sqlEsc(payload.full_name)}'`);
      if (payload.role !== undefined)
        sets.push(`role = '${sqlEsc(payload.role)}'`);
      if (payload.join_date_label !== undefined)
        sets.push(`join_date_label = '${sqlEsc(payload.join_date_label)}'`);
      if (payload.shift_start_time !== undefined)
        sets.push(`shift_start_time = '${sqlEsc(payload.shift_start_time)}'`);
      if (payload.basic_salary !== undefined)
        sets.push(`basic_salary = ${Number(payload.basic_salary)}`);
      if (payload.daily_rate !== undefined)
        sets.push(`daily_rate = ${Number(payload.daily_rate)}`);
      if (payload.late_penalty_rate !== undefined)
        sets.push(`late_penalty_rate = ${Number(payload.late_penalty_rate)}`);
      if (payload.no_late_bonus !== undefined)
        sets.push(`no_late_bonus = ${Number(payload.no_late_bonus)}`);
      sets.push(`updated_at = CURRENT_TIMESTAMP`);

      await conn.run(`
        UPDATE dim_employees
        SET ${sets.join(', ')}
        WHERE employee_name = '${sqlEsc(payload.employee_name)}';
      `);
    }

    const dailyOv =
      payload.daily_count_override === null ||
      payload.daily_count_override === undefined
        ? 'NULL'
        : String(Number(payload.daily_count_override));
    const lateOv =
      payload.late_count_override === null ||
      payload.late_count_override === undefined
        ? 'NULL'
        : String(Number(payload.late_count_override));

    await conn.run(`
      INSERT INTO payroll_period_adjustments (
        period_key, employee_name, daily_count_override, late_count_override,
        bonus_override, custom_desc, custom_qty, custom_unit_value,
        kasbon_qty, kasbon_unit_value, notes, updated_at
      )
      VALUES (
        '${sqlEsc(payload.period_key)}',
        '${sqlEsc(payload.employee_name)}',
        ${dailyOv},
        ${lateOv},
        NULL,
        '${sqlEsc(payload.custom_desc || '')}',
        ${Number(payload.custom_qty || 0)},
        ${Number(payload.custom_unit_value || 0)},
        ${Number(payload.kasbon_qty || 0)},
        ${Number(payload.kasbon_unit_value || 0)},
        '${sqlEsc(payload.notes || '')}',
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (period_key, employee_name) DO UPDATE SET
        daily_count_override = EXCLUDED.daily_count_override,
        late_count_override = EXCLUDED.late_count_override,
        custom_desc = EXCLUDED.custom_desc,
        custom_qty = EXCLUDED.custom_qty,
        custom_unit_value = EXCLUDED.custom_unit_value,
        kasbon_qty = EXCLUDED.kasbon_qty,
        kasbon_unit_value = EXCLUDED.kasbon_unit_value,
        notes = EXCLUDED.notes,
        updated_at = EXCLUDED.updated_at;
    `);
  } finally {
    try {
      conn.closeSync();
    } catch {
      // ignore
    }
  }
}
