export enum BillingStatus {
  DRAFT = "draft",
  PENDING = "pending",
  PARTIALLY_PAID = "partially_paid",
  PAID = "paid",
  OVERDUE = "overdue",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
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
  CASH = "cash",
  BANK_TRANSFER = "bank_transfer",
  GCASH = "gcash",
  MAYA = "maya",
  CARD = "card",
  ONLINE = "online",
  OTHER = "other",
}

export enum PayoutStatus {
  PENDING = "pending",
  SCHEDULED = "scheduled",
  PROCESSING = "processing",
  PAID = "paid",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum RefundStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  PROCESSED = "processed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum RefundReason {
  OVERPAYMENT = "overpayment",
  BILLING_ERROR = "billing_error",
  DUPLICATE_PAYMENT = "duplicate_payment",
  RESERVATION_CANCELLED = "reservation_cancelled",
  TENANT_REQUEST = "tenant_request",
  OTHER = "other",
}

export enum TransactionType {
  CHARGE = "charge",
  PAYMENT = "payment",
  REFUND = "refund",
  PAYOUT = "payout",
  ADJUSTMENT = "adjustment",
  PENALTY = "penalty",
  DISCOUNT = "discount",
}

export enum TransactionStatus {
  PENDING = "pending",
  POSTED = "posted",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum BillingPeriodType {
  ONE_TIME = "one_time",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  SEMESTRAL = "semestral",
  YEARLY = "yearly",
}
