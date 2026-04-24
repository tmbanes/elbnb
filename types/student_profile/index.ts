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
  created_at?: string;
  profile_picture_url?: string | null;
}

export interface AccommodationAssignment {
  assignment_id: string;
  move_in_date: string;
  expected_move_out_date: string;
  actual_move_out_date?: string | null;
  application_id: string;

  application?: {
    preferred_Unit_Type: string;
    preferred_Accomodation: string;
  };
}

export interface AccommodationApplication {
  application_id: string;
  preferred_accommodation_id: string;
  preferred_unit_type: string;
  date_submitted: string;
  duration_of_stay: number | null;
  check_in: string | null;
  check_out: string | null;
  number_of_companions: number | null;
  application_status: string; 

  accommodation_assignment?: AccommodationAssignment | AccommodationAssignment[] | null; 
  
  accommodation?: {
    name: string;
    accommodation_type: string;
  };
  unit?: {
    unit_number: string;
  };
}