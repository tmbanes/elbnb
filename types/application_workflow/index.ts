// BASED ON SUPABASE PROPERTIES
export type ApplicationStatus =
  | "pending_dorm_manager"
  | "pending_admin"
  | "pending_payment"
  | "accepted"
  | "rejected"
  | "cancelled";

// BASED ON SUPABASE PROPERTIES
export interface AccommodationApplication {
  application_id: string;
  preferred_accommodation: string; // REQUIRED, accommodation_id.
  preferred_unit_type: string;
  date_submitted: string; // ISO date string
  duration_of_stay: number; // in months
  check_in: string; // ISO date string
  check_out: string; // ISO date string
  number_of_companions: number;
  application_status: ApplicationStatus;
  user_id: string;
  unit_id: string;
}

export interface TransitionApplicationStatus {
  application_id: string;
  to_status: ApplicationStatus;
  remarks?: string;
}