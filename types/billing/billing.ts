import { Timestamp } from "next/dist/server/lib/cache-handlers/types";
import { BillingStatus, BillingPeriodType } from "./enums";

// export interface Billing {
//   id: string;

//   room_id?: string | null;
//   bedspace_id?: string | null;

//   tenant_id: string;
//   booking_id?: string | null;
//   invoice_id?: string | null;

//   billing_number: string;
//   billingTitle: string;
//   description?: string | null;

//   billing_period_type: BillingPeriodType;
//   billing_period_start?: string | null;
//   billing_period_end?: string | null;

//   subtotal_amount: number;
//   discount_amount: number;
//   tax_amount: number;
//   penalty_amount: number;
//   total_amount: number;
//   paid_amount: number;
//   balance_due: number;
//   due_date: string;

//   status: BillingStatus;
//   notes?: string | null;

//   created_at: string;
//   updated_at: string;
// }

//BILLING INTERFACE BASED ON DB
export interface BillingCreation {
  billing_id: string | null;
  assignment_id: string | null;
  amount: number;
  due_date: Date;
  billing_period_date: Date;
  status: BillingStatus;
  created_at: Timestamp;
  payment_method: string;
  transaction_reference: string;
}

export interface BillingInformation { // Type when you get billing information
  amount: number,
  due_date: Date,
  billing_period_date: Date,
  status: BillingStatus,
  created_at: Timestamp,
  payment_method: Text,
  transaction_reference: string
}