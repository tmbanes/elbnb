import { Payment, Refund, RefundReason, RefundStatus } from "@/types/billing";

export interface RefundCalculationInput {
  payment_amount: number;
  already_refunded_amount?: number;
  requested_refund_amount: number;
}

export interface RefundCalculationResult {
  refundable_amount: number;
  approved_refund_amount: number;
  remaining_payment_amount: number;
}

export function calculateRefundableAmount(
  payment_amount: number,
  already_refunded_amount: number = 0,
): number {
  return Math.max(0, payment_amount - already_refunded_amount);
}

export function calculateRefundAmount(
  input: RefundCalculationInput,
): RefundCalculationResult {
  const refundable_amount = calculateRefundableAmount(
    input.payment_amount,
    input.already_refunded_amount ?? 0,
  );

  const approved_refund_amount = Math.min(
    refundable_amount,
    Math.max(0, input.requested_refund_amount),
  );

  const remaining_payment_amount = Math.max(
    0,
    input.payment_amount -
      (input.already_refunded_amount ?? 0) -
      approved_refund_amount,
  );

  return {
    refundable_amount,
    approved_refund_amount,
    remaining_payment_amount,
  };
}

export interface CreateRefundInput {
  billing_id: string;
  payment_id: string;
  tenant_id: string;
  amount: number;
  reason: RefundReason;
  requested_at: string;
  notes?: string | null;
}

export function createRefundRecord(
  input: CreateRefundInput,
): Omit<Refund, "id" | "created_at" | "updated_at"> {
  return {
    billing_id: input.billing_id,
    payment_id: input.payment_id,
    tenant_id: input.tenant_id,
    amount: input.amount,
    reason: input.reason,
    status: RefundStatus.PENDING,
    requested_at: input.requested_at,
    processed_at: null,
    reference_number: null,
    notes: input.notes ?? null,
    metadata: null,
  };
}

export function sumProcessedRefunds(refunds: Refund[]): number {
  return refunds
    .filter((refund) => refund.status === RefundStatus.PROCESSED)
    .reduce((sum, refund) => sum + refund.amount, 0);
}

export function getPaymentRefundStatus(
  payment: Payment,
  processed_refund_total: number,
) {
  if (processed_refund_total <= 0) {
    return payment.status;
  }

  if (processed_refund_total >= payment.amount) {
    return "refunded";
  }

  return "partially_refunded";
}
