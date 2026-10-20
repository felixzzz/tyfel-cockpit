import { describe, it, expect } from 'vitest';
import { categorizeTransaction } from '../finance-categories';

describe('Finance Transaction Auto-Categorization', () => {
  it('identifies GoFood, GrabFood, and ShopeeFood settlement payouts as revenue', () => {
    const gofood = categorizeTransaction('TRSF CR GOJEK SETTLEMENT OUTLET 1', 'CR');
    expect(gofood.type).toBe('REVENUE');
    expect(gofood.confidence).toBeGreaterThanOrEqual(0.5);

    const grab = categorizeTransaction('CR GRABFOOD PAYOUT 2026-10-04', 'CR');
    expect(grab.type).toBe('REVENUE');

    const shopee = categorizeTransaction('TRANSFER DARI AIRPAY SHOPEE PAYOUT', 'CR');
    expect(shopee.type).toBe('REVENUE');
  });

  it('categorizes supplier raw ingredient purchases as COGS', () => {
    const supplierEgg = categorizeTransaction('TRSF DB TOKO TELUR AYAM SEGAR', 'DB');
    expect(supplierEgg.type).toBe('COGS');

    const supplierMilk = categorizeTransaction('PEMBELIAN SUSU DIAMOND FRESH MILK', 'DB');
    expect(supplierMilk.type).toBe('COGS');
  });

  it('categorizes rent and utility payments as OPEX', () => {
    const pln = categorizeTransaction('BAYAR TAGIHAN LISTRIK PLN OUTLET', 'DB');
    expect(pln.type).toBe('OPEX');

    const pdam = categorizeTransaction('PEMBAYARAN PDAM AIR BERSIH', 'DB');
    expect(pdam.type).toBe('OPEX');
  });

  it('categorizes bank admin fees and interest properly', () => {
    const fee = categorizeTransaction('BIAYA ADM BULANAN REKENING', 'DB');
    expect(fee.category).toBe('Bank & Transaction Fees');

    const interest = categorizeTransaction('BUNGA REKENING', 'CR');
    expect(interest.category).toBe('Other Operating Income');
  });
});
