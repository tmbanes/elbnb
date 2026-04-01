import { Payout, PayoutStatus } from "@/types/billing";

export interface HostPayoutCalculationInput {
  gross_amount: number;
  platform_fee_amount?: number;
  adjustment_amount?: number;
  refund_deduction_amount?: number;
}

export interface HostPayoutCalculationResult {
  gross_amount: number;
  platform_fee_amount: number;
  adjustment_amount: number;
  refund_deduction_amount: number;
  net_amount: number;
}

export function calculateHostPayout(
  input: HostPayoutCalculationInput,
): HostPayoutCalculationResult {
  const gross_amount = input.gross_amount;
  const platform_fee_amount = input.platform_fee_amount ?? 0;
  const adjustment_amount = input.adjustment_amount ?? 0;
  const refund_deduction_amount = input.refund_deduction_amount ?? 0;

  const net_amount = Math.max(
    0,
    gross_amount - platform_fee_amount + adjustment_amount - refund_deduction_amount,
  );

  return {
    gross_amount,
    platform_fee_amount,
    adjustment_amount,
    refund_deduction_amount,
    net_amount,
  };
}

export function getPayoutScheduleDate(
  reference_date: string,
  delay_in_days: number = 7,
): string {
  const date = new Date(reference_date);
  date.setDate(date.getDate() + delay_in_days);
  return date.toISOString();
}

export function isPayoutReady(
  scheduled_at: string,
  now: string = new Date().toISOString(),
): boolean {
  return new Date(now).getTime() >= new Date(scheduled_at).getTime();
}

export interface CreatePayoutInput {
  billing_id: string;
  payee_id: string;
  gross_amount: number;
  platform_fee_amount?: number;
  adjustment_amount?: number;
  refund_deduction_amount?: number;
  scheduled_at?: string | null;
  notes?: string | null;
}

export function createPayoutRecord(
  input: CreatePayoutInput,
): Omit<Payout, "id" | "created_at" | "updated_at"> {
  const payout = calculateHostPayout({
    gross_amount: input.gross_amount,
    platform_fee_amount: input.platform_fee_amount ?? 0,
    adjustment_amount: input.adjustment_amount ?? 0,
    refund_deduction_amount: input.refund_deduction_amount ?? 0,
  });

  return {
    billing_id: input.billing_id,
    payee_id: input.payee_id,
    gross_amount: payout.gross_amount,
    platform_fee_amount: payout.platform_fee_amount,
    adjustment_amount: payout.adjustment_amount,
    refund_deduction_amount: payout.refund_deduction_amount,
    net_amount: payout.net_amount,
    status: input.scheduled_at ? PayoutStatus.SCHEDULED : PayoutStatus.PENDING,
    scheduled_at: input.scheduled_at ?? null,
    paid_at: null,
    reference_number: null,
    notes: input.notes ?? null,
    metadata: null,
  };
}