// https://supabase.com/dashboard/project/cywurzembhxgwqvpsrlh/database/schemas

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
}

export interface AccommodationAssignment {
    assignment_id: string; 
    move_In_Date: string; 
    expected_Move_Out_Date: string;
    actual_Move_Out_Date?: string | null; // optional
    application_id: string; 
    
    // optional for history checker 
    application?: {
    preferred_Unit_Type: string;
    preferred_Accomodation: string;
    };
}



export interface AccommodationApplication {
    application_id: string;
    preferred_Accomodation: string;
    preferred_Unit_Type: string;
    date_Submitter: string; // pacheck if submitter ba talaga un or submitted
    duration_Of_Stay: number | null; 
    check_In: string | null;        
    check_Out: string | null;    
    number_Of_Companions: number | null;

    // https://supabase.com/dashboard/project/cywurzembhxgwqvpsrlh/database/schemas
    // no status ???? (acc supabase database)
    accomodation_assignment?: AccommodationAssignment | null; 
}