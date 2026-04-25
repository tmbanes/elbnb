import { TransactionStatus, TransactionType } from "./enums";

export interface Transaction {
  id: string;

  billing_id: string;
  tenant_id?: string | null;

  payment_id?: string | null;
  refund_id?: string | null;
  payout_id?: string | null;
  invoice_id?: string | null;

  type: TransactionType;
  status: TransactionStatus;

  amount: number;

  reference_number?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;

  occurred_at: string;
  created_at: string;
  updated_at: string;
}
