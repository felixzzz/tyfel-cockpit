import { describe, it, expect } from 'vitest';
import { detectFileType } from '../ingest';

describe('Data Ingestion Engine · detectFileType', () => {
  it('identifies Klikit Orders CSV reports correctly', () => {
    const sample = [
      'Order ID,External ID,Short ID,Provider,Brand,Branch,Order Date,Status,Gross Order Value,Meal Preparation Time',
      'ORD-101,EXT-101,101,GrabFood,Herbox,Greenville,2026-09-28 12:00:00,Delivered,125000,14',
    ].join('\n');

    expect(detectFileType(sample, 'orders.csv')).toBe('klikit_orders');
    expect(detectFileType(sample)).toBe('klikit_orders');
  });

  it('identifies Klikit Items CSV reports correctly', () => {
    const sample = [
      'Order ID,Menu Items,Item Quantity,Item Sale Price,Subtotal,Brand,Category',
      'ORD-101,Kung Paow Chick Vegan Ricebox,2,45000,90000,Herbox,Ricebox',
    ].join('\n');

    expect(detectFileType(sample, 'items.csv')).toBe('klikit_items');
    expect(detectFileType(sample)).toBe('klikit_items');
  });

  it('identifies Majoo POS transaction reports', () => {
    const sampleSemicolon = [
      'No Transaksi;Waktu Order;Kasir;Total Penjualan;Metode Pembayaran',
      'TRX-20261004-01;2026-10-04 11:30;Siti;150000;QRIS',
    ].join('\n');

    expect(detectFileType(sampleSemicolon, 'majoo_greenville_2026-10-04.csv')).toBe('majoo');

    const sampleDetail = [
      'LAPORAN DETAIL PENJUALAN',
      'No Transaksi,Tanggal,Nama Barang,Qty,Harga,Subtotal',
      'TRX-001,2026-10-04,Truffle Cream Pasta,1,75000,75000',
    ].join('\n');
    expect(detectFileType(sampleDetail)).toBe('majoo');
  });

  it('identifies Majoo Employee Attendance reports', () => {
    const sampleAttendance = [
      'Laporan Absensi Karyawan',
      'Tanggal,Nama,Outlet,Jam Masuk,Jam Pulang,Durasi',
      '2026-10-04,Rian,Greenville,08:58,17:02,8 jam 4 menit',
    ].join('\n');

    expect(detectFileType(sampleAttendance, 'attendance_oct.csv')).toBe('majoo_attendance');

    const sampleByFilename = 'Nama,Tanggal\nRian,2026-10-04';
    expect(detectFileType(sampleByFilename, 'majoo_absensi_sept.csv')).toBe('majoo_attendance');
  });

  it('identifies unknown file formats gracefully', () => {
    const unknownSample = 'ColumnA,ColumnB,ColumnC\nfoo,bar,baz';
    expect(detectFileType(unknownSample, 'random_data.csv')).toBe('unknown');
    expect(detectFileType('', 'empty.txt')).toBe('unknown');
  });
});
