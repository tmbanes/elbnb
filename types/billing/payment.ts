import { PaymentMethod, PaymentStatus } from "./enums";

export interface Payment {
  id: string;

  billing_id: string;
  invoice_id?: string | null;
  tenant_id: string;

  amount: number;

  payment_method: PaymentMethod;
  status: PaymentStatus;

  paid_at?: string | null;
  reference_number?: string | null;

  provider?: string | null; //e.g., Gcash, PayPal
  provider_transaction_id?: string | null;

  notes?: string | null;
  metadata?: Record<string, unknown> | null; //additional data related to the payment

  created_at: string;
  updated_at: string;
}