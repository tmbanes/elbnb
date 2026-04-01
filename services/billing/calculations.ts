import { BillingItem } from "@/types/billing/billingItem";

export interface BillingTotalsInput {
  items: BillingItem[];
  discount_amount?: number;
  tax_rate?: number;
  penalty_amount?: number;
}

export interface BillingTotalsResult {
  subtotal_amount: number;
  discount_amount: number;
  taxable_amount: number;
  tax_amount: number;
  penalty_amount: number;
  total_amount: number;
}

export function calculateSubtotal(items: BillingItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

export function calculateTaxableAmount(
  items: BillingItem[],
  discount_amount: number = 0,
): number {
  const taxableSubtotal = items
    .filter((item) => item.taxable)
    .reduce((sum, item) => sum + item.amount, 0);

  return Math.max(0, taxableSubtotal - discount_amount);
}

export function calculateTaxAmount(
  taxable_amount: number,
  tax_rate: number = 0,
): number {
  return taxable_amount * tax_rate;
}

export function calculateTotalAmount(input: BillingTotalsInput): BillingTotalsResult {
  const subtotal_amount = calculateSubtotal(input.items);
  const discount_amount = input.discount_amount ?? 0;
  const penalty_amount = input.penalty_amount ?? 0;
  const taxable_amount = calculateTaxableAmount(input.items, discount_amount);
  const tax_amount = calculateTaxAmount(taxable_amount, input.tax_rate ?? 0);

  const total_amount = Math.max(
    0,
    subtotal_amount - discount_amount + tax_amount + penalty_amount,
  );

  return {
    subtotal_amount,
    discount_amount,
    taxable_amount,
    tax_amount,
    penalty_amount,
    total_amount,
  };
}

export function calculateBalanceDue(
  total_amount: number,
  paid_amount: number,
): number {
  return Math.max(0, total_amount - paid_amount);
}

export function calculatePaidAmount(amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + amount, 0);
}