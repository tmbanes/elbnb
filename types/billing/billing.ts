import { BillingStatus } from "./enums";

type Timestamp = Date;

// Used when creating/updating billing
export interface BillingCreation {
  billing_id: string | null;
  assignment_id: string | null;

  amount: number;
  due_date: Date;
  billing_period_date: Date;

  status: BillingStatus;
  created_at: Timestamp;

  payment_method: string;
  transaction_reference: string | null;
}

// Used when fetching billing
export interface BillingInformation {
  billing_id: string;

  amount: number;
  due_date: Date;
  billing_period_date: Date;

  status: BillingStatus;
  created_at: Timestamp;

  payment_method: string;
  transaction_reference: string | null;
}
