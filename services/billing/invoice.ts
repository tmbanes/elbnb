import { Billing, BillingItem, Invoice, InvoiceStatus } from "@/types/billing";
import { calculateTotalAmount } from "./calculations";

export interface GenerateInvoiceInput {
  billing: Billing;
  items: BillingItem[];
  tax_rate?: number;
}

export function generateInvoiceFromBilling(
  input: GenerateInvoiceInput,
): Omit<Invoice, "id" | "created_at" | "updated_at"> {
  const totals = calculateTotalAmount({
    items: input.items,
    discount_amount: input.billing.discount_amount,
    tax_rate: input.tax_rate ?? 0,
    penalty_amount: input.billing.penalty_amount,
  });

  return {
    billing_id: input.billing.id,
    tenant_id: input.billing.tenant_id,
    invoice_number: input.billing.invoice_id ?? `INV-${input.billing.billing_number}`,
    issued_at: new Date().toISOString(),
    due_at: input.billing.due_date,
    subtotal_amount: totals.subtotal_amount,
    discount_amount: totals.discount_amount,
    tax_amount: totals.tax_amount,
    penalty_amount: totals.penalty_amount,
    total_amount: totals.total_amount,
    paid_amount: input.billing.paid_amount,
    balance_due: Math.max(0, totals.total_amount - input.billing.paid_amount),
    status: getInvoiceStatus(
      Math.max(0, totals.total_amount - input.billing.paid_amount),
      input.billing.paid_amount,
      input.billing.due_date,
    ),
    notes: input.billing.notes ?? null,
  };
}

export function getInvoiceStatus(
  balance_due: number,
  paid_amount: number,
  due_at: string,
): InvoiceStatus {
  if (balance_due <= 0) {
    return InvoiceStatus.PAID;
  }

  if (paid_amount > 0 && balance_due > 0) {
    return InvoiceStatus.PARTIALLY_PAID;
  }

  if (new Date() > new Date(due_at)) {
    return InvoiceStatus.OVERDUE;
  }

  return InvoiceStatus.OPEN;
}