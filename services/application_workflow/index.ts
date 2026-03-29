import { ApplicationStatus } from "@/types/application_workflow";

const ACTIVE_APPLICATION_STATUSES: ApplicationStatus[] = [
  "pending",
  "pending_for_approval",
  "waiting_for_payment",
];

const CANCELLABLE_STATUSES: ApplicationStatus[] = [
  // for readability, can be changed
  "pending",
  "pending_for_approval",
  "waiting_for_payment",
];

const TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  pending: ["pending_for_approval", "rejected", "cancelled"],
  pending_for_approval: ["waiting_for_payment", "rejected", "cancelled"],
  waiting_for_payment: ["accepted", "cancelled"],
  accepted: [],
  rejected: [],
  cancelled: [],
};
