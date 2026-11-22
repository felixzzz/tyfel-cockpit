import { describe, it, expect } from 'vitest';
import { terbilang } from '@/components/attendance/PrintablePayslipModal';
import { formatAccountingRp } from '@/components/attendance/PayslipCard';

describe('Printable Operations Utilities', () => {
  describe('terbilang (Indonesian number to words converter)', () => {
    it('converts 0 correctly', () => {
      expect(terbilang(0)).toBe('Nol Rupiah');
    });

    it('converts basic units and teens', () => {
      expect(terbilang(5)).toBe('Lima Rupiah');
      expect(terbilang(11)).toBe('Sebelas Rupiah');
      expect(terbilang(17)).toBe('Tujuh Belas Rupiah');
    });

    it('converts tens and hundreds', () => {
      expect(terbilang(85000)).toBe('Delapan Puluh Lima Ribu Rupiah');
      expect(terbilang(150000)).toBe('Seratus Lima Puluh Ribu Rupiah');
    });

    it('converts millions for typical F&B salary take home pay', () => {
      expect(terbilang(1765000)).toBe('Satu Juta Tujuh Ratus Enam Puluh Lima Ribu Rupiah');
      expect(terbilang(2500000)).toBe('Dua Juta Lima Ratus Ribu Rupiah');
      expect(terbilang(3820000)).toBe('Tiga Juta Delapan Ratus Dua Puluh Ribu Rupiah');
    });

    it('handles negative numbers', () => {
      expect(terbilang(-50000)).toBe('Minus Lima Puluh Ribu Rupiah');
    });
  });

  describe('formatAccountingRp', () => {
    it('formats positive values with Rp symbol', () => {
      expect(formatAccountingRp(85000)).toBe('Rp 85.000');
    });

    it('formats negative accounting values in parentheses', () => {
      expect(formatAccountingRp(-20000)).toBe('(Rp 20.000)');
      expect(formatAccountingRp(-20000, false)).toBe('(20.000)');
    });

    it('formats zero properly', () => {
      expect(formatAccountingRp(0)).toBe('Rp 0');
      expect(formatAccountingRp(0, false)).toBe('0');
    });
  });
});
