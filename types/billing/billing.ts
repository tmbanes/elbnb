import { BillingStatus } from "./enums";

type Timestamp = Date;

// Used when creating/updating billing
export interface BillingCreation {
  billing_id?: string;
  assignment_id: string;

  amount: number;
  billing_period_date: Date;
  due_date: Date;

  status: BillingStatus;
  created_at?: Timestamp;

  payment_method: string;
  transaction_reference?: string | null;
  receipt_files?: string[] | null;
  internal_notes?: string | null;
}

// Used when fetching billing
export interface BillingInformation {
  billing_id: string;

  amount: number;
  due_date: Date;

  status: BillingStatus;
  created_at: Timestamp;

  payment_method: string;
  transaction_reference: string | null;
  receipt_files?: string[] | null;

  internal_notes?: string | null;
  reminded_at?: Date | null;
}

export interface Billing {
  id: string;
  tenant_id: string;
  invoice_id?: string;
  billing_number: string;
  due_date: string;
  paid_amount: number;
  discount_amount: number;
  penalty_amount: number;
  notes?: string | null;
}
