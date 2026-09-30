import type { EnrichedCateringCustomer, EnrichedCateringPackage } from './catering';

export interface CateringInvoiceData {
  invoice_number: string;
  issue_date: string;
  due_date: string;
  customer_id: string;
  customer_name: string;
  phone: string;
  delivery_address: string;
  category_label: string;
  package_id: string;
  package_name: string;
  total_boxes: number;
  price_per_box: number;
  subtotal: number;
  discount: number;
  total_amount: number;
  payment_status: 'paid' | 'pending';
  bank_details: {
    bank_name: string;
    account_number: string;
    account_holder: string;
    qris_name: string;
  };
}

export function generateInvoiceForPackage(
  cust: EnrichedCateringCustomer,
  pkg: EnrichedCateringPackage
): CateringInvoiceData {
  const parts = pkg.package_id.split('-');
  const seq = parts.slice(2).join('') || '101';
  const invoiceNumber = `INV/HBX/2026/${seq.toUpperCase()}`;
  const subtotal = pkg.total_boxes * pkg.price_per_box;

  return {
    invoice_number: invoiceNumber,
    issue_date: pkg.start_date || '2026-08-01',
    due_date: pkg.start_date || '2026-08-01',
    customer_id: cust.customer_id,
    customer_name: cust.customer_name,
    phone: cust.phone,
    delivery_address: cust.delivery_address,
    category_label: cust.category_label,
    package_id: pkg.package_id,
    package_name: pkg.package_name,
    total_boxes: pkg.total_boxes,
    price_per_box: pkg.price_per_box,
    subtotal: subtotal,
    discount: 0,
    total_amount: subtotal,
    payment_status: pkg.payment_status,
    bank_details: {
      bank_name: 'BCA (Bank Central Asia)',
      account_number: '5271-8899-00',
      account_holder: 'PT HERBOX PANGAN SEHAT',
      qris_name: 'QRIS HERBOX ATELIER (GOPAY/OVO/BCA)',
    },
  };
}

export interface CateringExecutiveSummary {
  total_subscribers: number;
  active_subscribers: number;
  total_packages: number;
  total_revenue_billed: number;
  total_revenue_paid: number;
  total_revenue_pending: number;
  total_boxes_contracted: number;
  total_boxes_delivered: number;
  total_boxes_scheduled: number;
  total_boxes_skipped: number;
  fulfillment_rate_pct: number;
  estimated_mrr: number;
  category_breakdown: {
    category: string;
    label: string;
    subscribers: number;
    boxes: number;
    revenue: number;
  }[];
}
