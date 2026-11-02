import { describe, it, expect } from 'vitest';
import { parseIndoNumber } from '../finance-parser';

describe('Bank Statement Currency & Number Parsing (parseIndoNumber)', () => {
  it('correctly parses Indonesian dot-thousand formats without decimals', () => {
    expect(parseIndoNumber('1.500.000')).toBe(1500000);
    expect(parseIndoNumber('25.000.000')).toBe(25000000);
    expect(parseIndoNumber('150.000')).toBe(150000);
    expect(parseIndoNumber('5.000')).toBe(5000);
  });

  it('correctly parses Indonesian formats with comma decimals', () => {
    expect(parseIndoNumber('1.234.567,89')).toBe(1234567.89);
    expect(parseIndoNumber('50.000,50')).toBe(50000.5);
    expect(parseIndoNumber('150,50')).toBe(150.5);
  });

  it('correctly parses BCA CSV English-style comma thousand with dot decimal', () => {
    expect(parseIndoNumber('1,234,567.89')).toBe(1234567.89);
    expect(parseIndoNumber('15,834.00')).toBe(15834);
    expect(parseIndoNumber('1,500')).toBe(1500);
  });

  it('correctly parses standard decimal numbers with dot', () => {
    expect(parseIndoNumber('150.50')).toBe(150.5);
    expect(parseIndoNumber('99.9')).toBe(99.9);
  });

  it('handles negative numbers and parentheses accounting formats', () => {
    expect(parseIndoNumber('-1.500.000')).toBe(-1500000);
    expect(parseIndoNumber('(250.000)')).toBe(-250000);
    expect(parseIndoNumber('-1,234.50')).toBe(-1234.5);
  });

  it('handles empty or malformed strings gracefully', () => {
    expect(parseIndoNumber('')).toBe(0);
    expect(parseIndoNumber('Rp -')).toBe(0);
    expect(parseIndoNumber('Rp 1.500.000,00')).toBe(1500000);
  });
});
