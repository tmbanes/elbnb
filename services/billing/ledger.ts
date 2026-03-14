import {
  Payment,
  Payout,
  Refund,
  Transaction,
  TransactionStatus,
  TransactionType,
} from "@/types/billing";

export interface CreateChargeTransactionInput {
  billing_id: string;
  tenant_id: string;
  invoice_id?: string | null;
  amount: number;
  occurred_at: string;
  description?: string | null;
}

export function createChargeTransaction(
  input: CreateChargeTransactionInput,
): Omit<Transaction, "id" | "created_at" | "updated_at"> {
  return {
    billing_id: input.billing_id,
    tenant_id: input.tenant_id,
    payment_id: null,
    refund_id: null,
    payout_id: null,
    invoice_id: input.invoice_id ?? null,
    type: TransactionType.CHARGE,
    status: TransactionStatus.POSTED,
    amount: input.amount,
    reference_number: null,
    description: input.description ?? "Billing charge created",
    metadata: null,
    occurred_at: input.occurred_at,
  };
}

export function createPaymentTransaction(
  payment: Payment,
): Omit<Transaction, "id" | "created_at" | "updated_at"> {
  return {
    billing_id: payment.billing_id,
    tenant_id: payment.tenant_id,
    payment_id: payment.id,
    refund_id: null,
    payout_id: null,
    invoice_id: payment.invoice_id ?? null,
    type: TransactionType.PAYMENT,
    status: TransactionStatus.POSTED,
    amount: payment.amount,
    reference_number: payment.reference_number ?? null,
    description: `Payment received via ${payment.payment_method}`,
    metadata: payment.metadata ?? null,
    occurred_at: payment.paid_at ?? payment.created_at,
  };
}

export function createRefundTransaction(
  refund: Refund,
): Omit<Transaction, "id" | "created_at" | "updated_at"> {
  return {
    billing_id: refund.billing_id,
    tenant_id: refund.tenant_id,
    payment_id: refund.payment_id,
    refund_id: refund.id,
    payout_id: null,
    invoice_id: null,
    type: TransactionType.REFUND,
    status: TransactionStatus.POSTED,
    amount: refund.amount,
    reference_number: refund.reference_number ?? null,
    description: `Refund processed: ${refund.reason}`,
    metadata: refund.metadata ?? null,
    occurred_at: refund.processed_at ?? refund.created_at,
  };
}

export function createPayoutTransaction(
  payout: Payout,
): Omit<Transaction, "id" | "created_at" | "updated_at"> {
  return {
    billing_id: payout.billing_id,
    tenant_id: null,
    payment_id: null,
    refund_id: null,
    payout_id: payout.id,
    invoice_id: null,
    type: TransactionType.PAYOUT,
    status: TransactionStatus.POSTED,
    amount: payout.net_amount,
    reference_number: payout.reference_number ?? null,
    description: "Host payout released",
    metadata: payout.metadata ?? null,
    occurred_at: payout.paid_at ?? payout.created_at,
  };
}