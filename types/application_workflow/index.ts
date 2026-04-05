export type ApplicationStatus =
  | "pending"
  | "pending_for_approval"
  | "waiting_for_payment"
  | "accepted"
  | "rejected"
  | "cancelled";

export interface AccommodationApplication {
  application_id: string;
  preferred_accommodation: string;
  preferred_unit_type: string;
  date_submitted: string; // ISO date string
  duration_of_stay: number; // in months
  check_in: string; // ISO date string
  check_out: string; // ISO date string
  number_of_companions: number;
  application_status: ApplicationStatus;
  user_id: string;
}

export interface TransitionApplicationStatus {
  application_id: string;
  to_status: ApplicationStatus;
  remarks?: string;
}