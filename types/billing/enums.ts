export enum BillingStatus {
  PARTIALLY_PAID = "partially_paid",
  PAID = "paid",
  UNPAID = "unpaid",  
  OVERDUE = "overdue",
  PAID_LATE = "paid_late",

  // for receipt verification flow
  PENDING_VERIFICATION = "pending_verification",
  FAILED = "failed",
  PENDING = "PENDING"
}

export enum BillingItemType {
  ROOM_RENT = "room_rent",
  SECURITY_DEPOSIT = "security_deposit",
  UTILITY = "utility",
  WATER = "water",
  ELECTRICITY = "electricity",
  INTERNET = "internet",
  MAINTENANCE = "maintenance",
  PENALTY = "penalty",
  DISCOUNT = "discount",
  OTHER = "other",
}

export enum InvoiceStatus {
  DRAFT = "draft",
  OPEN = "open",
  PARTIALLY_PAID = "partially_paid",
  PAID = "paid",
  VOID = "void",
  OVERDUE = "overdue",
}

export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SUCCEEDED = "succeeded",
  FAILED = "failed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
  PARTIALLY_REFUNDED = "partially_refunded",
}

export enum PaymentMethod {
  CASH = "cash"
}

export enum BillingPeriodType {
  ONE_TIME = "one_time",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  SEMESTRAL = "semestral",
  YEARLY = "yearly",
}
