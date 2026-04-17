import { BillingStatus } from "./enums";

type Timestamp = Date;

// Used when creating/updating billing
export interface BillingCreation {
  billing_id?: string;
  assignment_id: string;

  amount: number;
  due_date: Date;

  status: BillingStatus;
  created_at?: Timestamp;

  payment_method: string;
  transaction_reference?: string | null;
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

  admin_flag?: boolean;
  internal_notes?: string | null;
  reminded_at?: Date | null;
}
