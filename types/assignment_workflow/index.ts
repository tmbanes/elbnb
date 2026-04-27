// BASED ON SUPABASE PROPERTIES for renting_space 
export type PropertyType = "apartment" | "boarding" | "transient" | "house";

// BASED ON SUPABASE PROPERTIES
export type AssignmentStatus =
  | "active" // currently living in it
  | "completed" // finished the contract
  | "cancelled" // if rejected upon assignment/ not paid 
  | "terminated" // napatalsik siya/incompleted before contract ended
  | "pending" // dorm manager and admin
  | "waiting_payment"; // approved by admin, waiting for user payment

// BASED ON SUPABASE PROPERTIES
export interface AccommodationAssignment {
  assignment_id: string;
  application_id: string;
  unit_id: string;
  user_id: string;
  move_in_date: string;
  expected_move_out_date: string;
  actual_move_out_date?: string | null; // optional
  assignment_status: AssignmentStatus;
}