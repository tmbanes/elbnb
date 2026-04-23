// /types/student_profile/index.ts
// https://supabase.com/dashboard/project/cywurzembhxgwqvpsrlh/database/schemas

import { Accommodation } from "../accommodation_units";

export type UserRole =
  | "Student"
  | "Dormitory Manager"
  | "Housing Administrator"
  | "Guest";

export interface UserProfile {
  user_id: string; // from supabase
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  email: string;
  role: UserRole;
  user_status: string;
  profile_picture_url?: string | null;
  created_at?: string;
}

export interface AccommodationAssignment {
  assignment_id: string;
  move_In_Date: string; // btw is this ok? yung database column is "move_in_date" but in the interface it's "move_In_Date", 
  expected_Move_Out_Date: string; // same for the rest, just want to confirm if this is fine or should we change it to match the database column names? 
  actual_Move_Out_Date?: string | null; // optional
  application_id: string;

  // optional for history checker 
  application?: {
    preferred_Unit_Type: string;
    preferred_Accomodation: string;
  };
}


// renamed the interface properties to match the database table columns
export interface AccommodationApplication {
  application_id: string;
  preferred_accommodation_id: string;
  preferred_unit_type: string;
  date_submitted: string;
  duration_of_stay: number | null;
  check_in: string | null;
  check_out: string | null;
  number_of_companions: number | null;
  application_status: string; // values: pending_admin, approved, rejected, pending_payment, cancelled, pending_dorm_manager

  accomodation_assignment?: AccommodationAssignment | null;
  accommodation?: {
    name: string;
  };
  unit?: {
    unit_number: string;
  };
}