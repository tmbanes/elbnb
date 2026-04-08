// BASED ON SUPABASE PROPERTIES for renting_space 
export type PropertyType = "apartment" | "boarding" | "transient" | "house";

// BASED ON SUPABASE PROPERTIES
export type AssignmentStatus =
  | "active" // currently living in it
  | "completed" // finished the contract
  | "cancelled" // if rejected upon assignment/ not paid 
  | "terminated" // napatalsik siya/incompleted before contract ended
  | "pending"; // dorm manager and admin

// BASED ON SUPABASE PROPERTIES
export interface AccommodationAssignment {
  assignment_id: string;
  application_id: string;
  unit_id: string;
  user_id: string;
  move_In_Date: string;
  expected_Move_Out_Date: string;
  actual_Move_Out_Date?: string | null; // optional
  assignment_status: AssignmentStatus;
}