import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  isExcelFile,
  normalizeDateToIso,
  normalizeTimeToHHMM,
  parseCsvLine,
  convertExcelToCsv,
} from '../excel-parser';
import {
  parseMajooAttendanceCsv,
  parseMajooAttendanceWorkbook,
} from '../attendance';
import { processUploadedFile } from '../ingest';

const USER_SAMPLE_ATTENDANCE_CSV = `Laporan Absensi,,,,,,,Tyfel Coffee
,,,,,,,Semua Outlet
,,,,,,,
Periode,01 Oktober 2026 - 31 Oktober 2026,,,,,,
Zona Waktu,Asia/Jakarta (GMT +7),,,,,,
Status,Semua,,,,,,
Pencarian,,,,,,,
,,,,,,,
,,,,,,,Date Generated 26/10/2026 - 21:11 WIB
,,,,,,,
Tanggal,Nama,Outlet,Jam Masuk,Jam Pulang,Total Jam Kerja Aktual,Status,Catatan
2026-10-26,Aji,Tyfel Coffee,07:09,20:04,12 Jam 55 Menit 29 Detik,,
2026-10-26,Icin,Tyfel Coffee,06:22,20:42,14 Jam 20 Menit 9 Detik,,
2026-10-26,Fauzi,Tyfel Coffee,06:11,20:02,13 Jam 50 Menit 36 Detik,,
2026-10-26,Budi,Tyfel Coffee,05:56,12:21,6 Jam 25 Menit 17 Detik,,
2026-10-26,Agus,Tyfel Coffee,05:40,20:48,15 Jam 7 Menit 22 Detik,,
2026-10-25,Icin,Tyfel Coffee,20:45,20:46,50 Detik,,
2026-10-25,Aji,Tyfel Coffee,07:07,20:06,12 Jam 58 Menit 27 Detik,,
2026-10-25,Fauzi,Tyfel Coffee,06:33,20:26,13 Jam 52 Menit 27 Detik,,
2026-10-25,Agus,Tyfel Coffee,05:42,20:50,15 Jam 8 Menit 37 Detik,,
2026-10-24,Budi,Tyfel Coffee,16:41,16:41,8 Detik,,
2026-10-24,Aji,Tyfel Coffee,06:57,19:38,12 Jam 41 Menit 29 Detik,,
2026-10-24,Icin,Tyfel Coffee,06:21,20:59,14 Jam 37 Menit 28 Detik,,
2026-10-24,Fauzi,Tyfel Coffee,06:17,20:29,14 Jam 12 Menit 43 Detik,,
2026-10-24,Agus,Tyfel Coffee,05:46,21:01,15 Jam 15 Menit 6 Detik,,
2026-10-23,Aji,Tyfel Coffee,08:02,20:12,12 Jam 9 Menit 10 Detik,,
2026-10-23,Fauzi,Tyfel Coffee,06:32,20:55,14 Jam 22 Menit 57 Detik,,
2026-10-23,Icin,Tyfel Coffee,06:23,06:20,23 Jam 57 Menit 5 Detik,,
2026-10-23,Budi,Tyfel Coffee,05:59,16:06,10 Jam 6 Menit 5 Detik,,
2026-10-23,Agus,Tyfel Coffee,05:47,20:53,15 Jam 6 Menit 12 Detik,,
2026-10-22,Aji,Tyfel Coffee,07:04,20:07,13 Jam 3 Menit 35 Detik,,
2026-10-22,Icin,Tyfel Coffee,06:32,20:40,14 Jam 8 Menit 4 Detik,,
2026-10-22,Fauzi,Tyfel Coffee,06:18,20:24,14 Jam 6 Menit 26 Detik,,
2026-10-22,Budi,Tyfel Coffee,05:55,16:04,10 Jam 8 Menit 46 Detik,,
2026-10-22,Agus,Tyfel Coffee,05:32,20:52,15 Jam 20 Menit 11 Detik,,
2026-10-21,Agus,Tyfel Coffee,21:00,21:00,22 Detik,,
2026-10-21,Icin,Tyfel Coffee,06:21,21:06,14 Jam 45 Menit 2 Detik,,
2026-10-21,Fauzi,Tyfel Coffee,06:19,20:31,14 Jam 12 Menit 53 Detik,,
2026-10-21,Budi,Tyfel Coffee,05:48,16:02,10 Jam 14 Menit 32 Detik,,
2026-10-20,Budi,Tyfel Coffee,17:01,17:01,7 Detik,,
2026-10-20,Aji,Tyfel Coffee,07:26,20:01,12 Jam 34 Menit 47 Detik,,
2026-10-20,Icin,Tyfel Coffee,06:27,20:44,14 Jam 17 Menit 17 Detik,,
2026-10-20,Fauzi,Tyfel Coffee,05:52,20:19,14 Jam 26 Menit 11 Detik,,
2026-10-20,Agus,Tyfel Coffee,05:27,20:47,15 Jam 19 Menit 52 Detik,,
2026-10-19,Aji,Tyfel Coffee,07:55,20:05,12 Jam 9 Menit 13 Detik,,
2026-10-19,Icin,Tyfel Coffee,06:31,20:53,14 Jam 22 Menit 52 Detik,,
2026-10-19,Fauzi,Tyfel Coffee,06:25,20:27,14 Jam 2 Menit 24 Detik,,
2026-10-19,Agus,Tyfel Coffee,05:46,20:56,15 Jam 9 Menit 49 Detik,,
2026-10-18,Aji,Tyfel Coffee,07:05,20:03,12 Jam 57 Menit 41 Detik,,
2026-10-18,Icin,Tyfel Coffee,06:25,20:50,14 Jam 24 Menit 56 Detik,,
2026-10-18,Fauzi,Tyfel Coffee,06:17,20:00,13 Jam 43 Menit 3 Detik,,
2026-10-18,Agus,Tyfel Coffee,06:03,21:06,15 Jam 2 Menit 28 Detik,,
2026-10-18,Budi,Tyfel Coffee,05:53,12:08,6 Jam 15 Menit 22 Detik,,
2026-10-17,Budi,Tyfel Coffee,18:24,18:24,7 Detik,,
2026-10-17,Aji,Tyfel Coffee,06:58,19:53,12 Jam 55 Menit 40 Detik,,
2026-10-17,Fauzi,Tyfel Coffee,06:36,20:43,14 Jam 6 Menit 23 Detik,,
2026-10-17,Icin,Tyfel Coffee,06:32,21:13,14 Jam 41 Menit 19 Detik,,
2026-10-17,Agus,Tyfel Coffee,05:54,21:15,15 Jam 20 Menit 29 Detik,,
2026-10-16,Aji,Tyfel Coffee,07:54,20:03,12 Jam 9 Menit 19 Detik,,
2026-10-16,Fauzi,Tyfel Coffee,06:45,20:59,14 Jam 13 Menit 59 Detik,,
2026-10-16,Agus,Tyfel Coffee,05:46,21:04,15 Jam 18 Menit 31 Detik,,
2026-10-16,Budi,Tyfel Coffee,05:31,16:18,10 Jam 47 Menit 23 Detik,,
2026-10-15,Aji,Tyfel Coffee,08:07,07:53,23 Jam 46 Menit 46 Detik,,
2026-10-15,Icin,Tyfel Coffee,06:36,20:50,14 Jam 13 Menit 30 Detik,,
2026-10-15,Agus,Tyfel Coffee,05:56,20:53,14 Jam 57 Menit 13 Detik,,
2026-10-15,Budi,Tyfel Coffee,05:48,05:30,23 Jam 42 Menit 42 Detik,,
2026-10-14,Aji,Tyfel Coffee,07:43,08:06,24 Jam 23 Menit 51 Detik,,
2026-10-14,Icin,Tyfel Coffee,06:31,20:41,14 Jam 10 Menit 6 Detik,,
2026-10-14,Fauzi,Tyfel Coffee,06:16,19:59,13 Jam 42 Menit 50 Detik,,
2026-10-14,Agus,Tyfel Coffee,05:43,21:10,15 Jam 27 Menit 14 Detik,,
2026-10-14,Budi,Tyfel Coffee,05:40,16:50,11 Jam 10 Menit 36 Detik,,
2026-10-13,Aji,Tyfel Coffee,07:28,20:13,12 Jam 44 Menit 39 Detik,,
2026-10-13,Icin,Tyfel Coffee,06:40,20:38,13 Jam 58 Menit 17 Detik,,
2026-10-13,Fauzi,Tyfel Coffee,06:12,20:34,14 Jam 22 Menit 11 Detik,,
2026-10-13,Agus,Tyfel Coffee,06:01,20:58,14 Jam 56 Menit 28 Detik,,
2026-10-13,Budi,Tyfel Coffee,05:52,16:13,10 Jam 21 Menit 17 Detik,,
2026-10-12,Aji,Tyfel Coffee,07:30,20:03,12 Jam 33 Menit 35 Detik,,
2026-10-12,Fauzi,Tyfel Coffee,07:06,20:54,13 Jam 48 Menit 3 Detik,,
2026-10-12,Icin,Tyfel Coffee,06:38,21:01,14 Jam 22 Menit 50 Detik,,
2026-10-12,Agus,Tyfel Coffee,05:46,20:55,15 Jam 9 Menit 19 Detik,,
2026-10-12,Budi,Tyfel Coffee,05:39,05:52,24 Jam 12 Menit 30 Detik,,
2026-10-11,Budi,Tyfel Coffee,16:00,16:00,7 Detik,,
2026-10-11,Aji,Tyfel Coffee,07:21,20:04,12 Jam 43 Menit 22 Detik,,
2026-10-11,Fauzi,Tyfel Coffee,07:07,20:42,13 Jam 34 Menit 44 Detik,,
2026-10-11,Icin,Tyfel Coffee,06:36,20:52,14 Jam 16 Menit 27 Detik,,
2026-10-11,Agus,Tyfel Coffee,06:01,20:53,14 Jam 52 Menit 41 Detik,,
2026-10-10,Fauzi,Tyfel Coffee,07:20,20:43,13 Jam 22 Menit 43 Detik,,
2026-10-10,Aji,Tyfel Coffee,07:07,19:49,12 Jam 41 Menit 53 Detik,,
2026-10-10,Icin,Tyfel Coffee,06:36,20:59,14 Jam 22 Menit 59 Detik,,
2026-10-10,Agus,Tyfel Coffee,05:56,20:55,14 Jam 59 Menit 1 Detik,,
2026-10-09,Aji,Tyfel Coffee,07:58,20:05,12 Jam 7 Menit 9 Detik,,
2026-10-09,Fauzi,Tyfel Coffee,07:19,20:39,13 Jam 20 Menit 14 Detik,,
2026-10-09,Icin,Tyfel Coffee,06:32,20:48,14 Jam 15 Menit 46 Detik,,
2026-10-09,Budi,Tyfel Coffee,05:51,16:01,10 Jam 9 Menit 41 Detik,,
2026-10-09,Agus,Tyfel Coffee,05:46,21:00,15 Jam 14 Menit 20 Detik,,
2026-10-08,Aji,Tyfel Coffee,07:59,20:16,12 Jam 17 Menit 45 Detik,,
2026-10-08,Icin,Tyfel Coffee,06:24,20:30,14 Jam 6 Menit 1 Detik,,
2026-10-08,Agus,Tyfel Coffee,06:01,21:11,15 Jam 10 Menit 11 Detik,,
2026-10-08,Budi,Tyfel Coffee,05:49,16:36,10 Jam 46 Menit 55 Detik,,
2026-10-07,Fauzi,Tyfel Coffee,07:24,20:12,12 Jam 47 Menit 51 Detik,,
2026-10-07,Icin,Tyfel Coffee,06:33,20:27,13 Jam 54 Menit,,
2026-10-07,Budi,Tyfel Coffee,05:47,16:00,10 Jam 12 Menit 42 Detik,,
2026-10-07,Agus,Tyfel Coffee,05:46,20:59,15 Jam 13 Menit 1 Detik,,
2026-10-06,Aji,Tyfel Coffee,07:33,20:06,12 Jam 32 Menit 31 Detik,,
2026-10-06,Fauzi,Tyfel Coffee,07:13,20:36,13 Jam 22 Menit 19 Detik,,
2026-10-06,Icin,Tyfel Coffee,06:34,20:49,14 Jam 15 Menit 27 Detik,,
2026-10-06,Agus,Tyfel Coffee,05:54,20:56,15 Jam 2 Menit 8 Detik,,
2026-10-06,Budi,Tyfel Coffee,05:47,16:17,10 Jam 29 Menit 44 Detik,,
2026-10-05,Aji,Tyfel Coffee,07:44,20:05,12 Jam 20 Menit 23 Detik,,
2026-10-05,Fauzi,Tyfel Coffee,07:22,20:54,13 Jam 32 Menit 36 Detik,,
2026-10-05,Icin,Tyfel Coffee,06:40,20:52,14 Jam 11 Menit 33 Detik,,
2026-10-05,Agus,Tyfel Coffee,05:54,22:05,16 Jam 10 Menit 56 Detik,,
2026-10-04,Budi,Tyfel Coffee,18:26,18:26,7 Detik,,
2026-10-04,Fauzi,Tyfel Coffee,07:16,20:47,13 Jam 30 Menit 58 Detik,,
2026-10-04,Aji,Tyfel Coffee,07:09,20:32,13 Jam 23 Menit 32 Detik,,
2026-10-04,Icin,Tyfel Coffee,06:30,20:50,14 Jam 20 Menit 2 Detik,,
2026-10-04,Agus,Tyfel Coffee,05:59,20:55,14 Jam 55 Menit 38 Detik,,
2026-10-03,Agus,Tyfel Coffee,20:58,20:59,5 Detik,,
2026-10-03,Budi,Tyfel Coffee,16:08,16:08,7 Detik,,
2026-10-03,Aji,Tyfel Coffee,07:07,20:01,12 Jam 54 Menit 12 Detik,,
2026-10-03,Fauzi,Tyfel Coffee,07:05,20:53,13 Jam 48 Menit 38 Detik,,
2026-10-03,Icin,Tyfel Coffee,06:35,21:05,14 Jam 30 Menit 9 Detik,,
2026-10-02,Agus,Tyfel Coffee,20:52,20:52,6 Detik,,
2026-10-02,Aji,Tyfel Coffee,07:19,20:09,12 Jam 49 Menit 50 Detik,,
2026-10-02,Fauzi,Tyfel Coffee,07:13,20:05,12 Jam 52 Menit 10 Detik,,
2026-10-02,Icin,Tyfel Coffee,06:51,20:25,13 Jam 33 Menit 51 Detik,,
2026-10-02,Budi,Tyfel Coffee,05:56,16:00,10 Jam 3 Menit 49 Detik,,
2026-10-01,Icin,Tyfel Coffee,07:00,20:40,13 Jam 40 Menit 11 Detik,,
2026-10-01,Budi,Tyfel Coffee,05:55,16:05,10 Jam 10 Menit 3 Detik,,
2026-10-01,Agus,Tyfel Coffee,05:43,21:00,15 Jam 17 Menit 12 Detik,,
,,,,,,,
,,,,,,,
Powered by
`;

function createMockXlsxBuffer(csvContent: string): Buffer {
  const lines = csvContent.trim().split('\n');
  const rows = lines.map((l) => parseCsvLine(l));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Absensi');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

describe('Excel Parser & Converter Unit Tests', () => {
  it('correctly identifies Excel files by extension and magic bytes', () => {
    expect(isExcelFile('laporan.xlsx')).toBe(true);
    expect(isExcelFile('export.XLS')).toBe(true);
    expect(isExcelFile('laporan.csv')).toBe(false);

    // ZIP PK magic bytes
    const zipMagic = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00]);
    expect(isExcelFile('unnamed', zipMagic)).toBe(true);

    const textBuf = Buffer.from('Tanggal,Nama\n');
    expect(isExcelFile('unnamed', textBuf)).toBe(false);
  });

  it('normalizes various date formats into ISO YYYY-MM-DD', () => {
    expect(normalizeDateToIso('2026-10-26')).toBe('2026-10-26');
    expect(normalizeDateToIso('2026/10/26')).toBe('2026-10-26');
    expect(normalizeDateToIso('26/10/2026')).toBe('2026-10-26');
    expect(normalizeDateToIso('26-10-2026')).toBe('2026-10-26');
    expect(normalizeDateToIso('10/26/26')).toBe('2026-10-26');
    expect(normalizeDateToIso('26 Oktober 2026')).toBe('2026-10-26');
    expect(normalizeDateToIso('01 Okt 2026')).toBe('2026-10-01');

    // Date object
    expect(normalizeDateToIso(new Date(2026, 9, 26))).toBe('2026-10-26');

    // Excel serial number 46320 -> 2026-10-25
    expect(normalizeDateToIso(46320)).toBe('2026-10-25');

    // Invalid or empty values
    expect(normalizeDateToIso('')).toBe(null);
    expect(normalizeDateToIso('-')).toBe(null);
    expect(normalizeDateToIso(null)).toBe(null);
  });

  it('normalizes various time representations into 24-hour HH:MM', () => {
    expect(normalizeTimeToHHMM('07:09')).toBe('07:09');
    expect(normalizeTimeToHHMM('7:09:22')).toBe('07:09');
    expect(normalizeTimeToHHMM('20:04')).toBe('20:04');
    expect(normalizeTimeToHHMM('7:09 AM')).toBe('07:09');
    expect(normalizeTimeToHHMM('8:04 PM')).toBe('20:04');
    expect(normalizeTimeToHHMM('12:00 AM')).toBe('00:00');
    expect(normalizeTimeToHHMM('12:30 PM')).toBe('12:30');

    // Excel time fraction (7 hours, 9 mins)
    expect(normalizeTimeToHHMM(0.297916666666667)).toBe('07:09');

    // Empty or dash
    expect(normalizeTimeToHHMM('-')).toBe('-');
    expect(normalizeTimeToHHMM('')).toBe('-');
  });

  it('converts an Excel (.xlsx) buffer into standardized CSV text', () => {
    const xlsxBuf = createMockXlsxBuffer(USER_SAMPLE_ATTENDANCE_CSV);
    const converted = convertExcelToCsv(xlsxBuf);

    expect(converted.sheetName).toBe('Laporan Absensi');
    expect(converted.csv).toContain('Laporan Absensi');
    expect(converted.csv).toContain('Tanggal,Nama,Outlet,Jam Masuk,Jam Pulang');
    expect(converted.csv).toContain('2026-10-26,Aji,Tyfel Coffee,07:09,20:04');
  });

  it('parses the user October 2026 attendance dataset accurately (119 records)', () => {
    const { records, minDate, maxDate } = parseMajooAttendanceCsv(
      USER_SAMPLE_ATTENDANCE_CSV,
      'test_october.csv'
    );

    expect(records.length).toBe(119);
    expect(minDate).toBe('2026-10-01');
    expect(maxDate).toBe('2026-10-26');

    // Check unique employees
    const employees = Array.from(new Set(records.map((r) => r.employee_name)));
    expect(employees.sort()).toEqual(['Agus', 'Aji', 'Budi', 'Fauzi', 'Icin']);

    // Check closing tap anomaly detection
    const closingTaps = records.filter((r) => r.anomaly_type === 'closing_tap');
    expect(closingTaps.length).toBeGreaterThan(0);
    // Budi on 2026-10-20 (17:01, 7 detik)
    const budiOct20 = records.find(
      (r) => r.work_date === '2026-10-20' && r.employee_name === 'Budi'
    );
    expect(budiOct20?.anomaly_type).toBe('closing_tap');
    expect(budiOct20?.effective_hours).toBe(10.0);
  });

  it('parses attendance from an actual XLSX buffer via parseMajooAttendanceWorkbook', () => {
    const xlsxBuf = createMockXlsxBuffer(USER_SAMPLE_ATTENDANCE_CSV);
    const { records, minDate, maxDate, convertedCsv } = parseMajooAttendanceWorkbook(
      xlsxBuf,
      'Laporan_Absensi_Oktober_2026.xlsx'
    );

    expect(convertedCsv.length).toBeGreaterThan(100);
    expect(records.length).toBe(119);
    expect(minDate).toBe('2026-10-01');
    expect(maxDate).toBe('2026-10-26');
  });

  it('supports semicolon-delimited CSV formats', () => {
    const semicolonCsv = USER_SAMPLE_ATTENDANCE_CSV.replace(/,/g, ';');
    const { records, minDate, maxDate } = parseMajooAttendanceCsv(
      semicolonCsv,
      'semicolon_attendance.csv'
    );

    expect(records.length).toBe(119);
    expect(minDate).toBe('2026-10-01');
    expect(maxDate).toBe('2026-10-26');
  });

  it('processes an uploaded .xlsx file end-to-end via processUploadedFile', async () => {
    const xlsxBuf = createMockXlsxBuffer(USER_SAMPLE_ATTENDANCE_CSV);
    const summary = await processUploadedFile(
      'Laporan_Absensi_2026-10-01_2026-10-26.xlsx',
      xlsxBuf
    );

    expect(summary.success).toBe(true);
    expect(summary.fileType).toBe('majoo_attendance');
    expect(summary.fileName).toContain('majoo_attendance_2026-10-01_to_2026-10-26.csv');
    expect(summary.ordersProcessed).toBe(119);
    expect(summary.minDate).toBe('2026-10-01');
    expect(summary.maxDate).toBe('2026-10-26');
    expect(summary.message).toContain('Excel Converted');
  });
});
