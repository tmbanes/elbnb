import { InvoiceStatus } from "./enums";

export interface Invoice {
  id: string;

  billing_id: string;
  tenant_id: string;

  invoice_number: string;
  issued_at: string;
  due_at: string;

  subtotal_amount: number;
  discount_amount: number;
  tax_amount: number;
  penalty_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  status: InvoiceStatus;

  notes?: string | null;
  created_at: string;
  updated_at: string;
}