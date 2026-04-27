export enum BillingStatus {
  PARTIALLY_PAID = "partially_paid",
  PAID = "paid",
  UNPAID = "unpaid",
  OVERDUE = "overdue",
  PAID_LATE = "paid_late",

  // for receipt verification flow
  PENDING_VERIFICATION = "pending_verification",
  FAILED = "failed",
  PENDING = "pending"
}

export enum BillingItemType {
  ROOM_RENT = "room_rent",
  RESERVATION_FEE = "reservation_fee",
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

export enum TransactionStatus {
  PENDING = "pending",
  SUCCEEDED = "succeeded",
  FAILED = "failed",
  CANCELLED = "cancelled",
  POSTED = "posted",
}

export enum TransactionType {
  PAYMENT = "payment",
  REFUND = "refund",
  PAYOUT = "payout",
  CHARGE = "charge",
}

export enum PayoutStatus {
  SCHEDULED = "scheduled",
  PENDING = "pending",
  IN_TRANSIT = "in_transit",
  PAID = "paid",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum RefundStatus {
  PENDING = "pending",
  PROCESSED = "processed",
  SUCCEEDED = "succeeded",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum RefundReason {
  DUPLICATE = "duplicate",
  FRAUDULENT = "fraudulent",
  REQUESTED_BY_CUSTOMER = "requested_by_customer",
  ACCOMMODATION_UNAVAILABLE = "accommodation_unavailable",
  OTHER = "other",
}
