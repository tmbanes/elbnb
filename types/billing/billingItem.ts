import { BillingItemType } from "./enums";

export interface BillingItem {
  id: string;
  billing_id: string;

  type: BillingItemType;
  billLabel: string;
  description?: string | null;

  quantity: number;
  unit_price: number;
  amount: number;

  taxable: boolean;
  metadata?: Record<string, unknown> | null; //additional data related to the billing item

  created_at: string;
  updated_at: string;
}
