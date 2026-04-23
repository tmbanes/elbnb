<<<<<<< Updated upstream
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

  admin_flag?: boolean;
  internal_notes?: string | null;
  reminded_at?: Date | null;
}
=======
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
>>>>>>> Stashed changes
