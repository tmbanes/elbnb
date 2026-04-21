<<<<<<< HEAD
import { BillingStatus, BillingPeriodType } from "./enums";

export interface Billing {
  id: string;

  room_id?: string | null;
  bedspace_id?: string | null;

  tenant_id: string;
  booking_id?: string | null;
  invoice_id?: string | null;

  billing_number: string;
  billingTitle: string;
  description?: string | null;

  billing_period_type: BillingPeriodType;
  billing_period_start?: string | null;
  billing_period_end?: string | null;

  subtotal_amount: number;
  discount_amount: number;
  tax_amount: number;
  penalty_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  due_date: string;

  status: BillingStatus;
  notes?: string | null;

  created_at: string;
  updated_at: string;
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

  admin_flag?: boolean;
  internal_notes?: string | null;
  reminded_at?: Date | null;
>>>>>>> 76e8f3255db7be2b6cbe835d611a2e1be74975e1
}
