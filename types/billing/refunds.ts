import { RefundReason, RefundStatus } from "./enums";

export interface Refund {
  id: string;

  billing_id: string;
  payment_id: string;
  tenant_id: string;

  amount: number;

  reason: RefundReason;
  status: RefundStatus;

  requested_at: string;
  processed_at?: string | null;
  reference_number?: string | null;

  notes?: string | null;
  metadata?: Record<string, unknown> | null;

  created_at: string;
  updated_at: string;
}