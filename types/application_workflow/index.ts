export type ApplicationStatus =
  | "pending"
  | "pending_for_approval"
  | "waiting_for_payment"
  | "accepted"
  | "rejected"
  | "cancelled";

export interface SubmitAccommodationApplicationInput {
  accommodation_id: string;
  user_fname: string;
  user_lname: string;
  user_email: string;
  contact_number: string;
  check_in: string;
  check_out: string;
  files?: [];
  notes?: string;
}

export interface TransitionApplicationStatus {
  application_id: string;
  to_status: ApplicationStatus;
  remarks?: string;
}