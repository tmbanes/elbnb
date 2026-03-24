import { PayoutStatus } from "./enums";

export interface Payout {
  id: string;

  billing_id: string;
  payee_id: string;

  gross_amount: number;
  platform_fee_amount: number;
  adjustment_amount: number;
  refund_deduction_amount: number;
  net_amount: number;
  status: PayoutStatus;

  scheduled_at?: string | null;
  paid_at?: string | null;
  reference_number?: string | null;

  notes?: string | null;
  metadata?: Record<string, unknown> | null;

  created_at: string;
  updated_at: string;
}
