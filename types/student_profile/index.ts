// https://supabase.com/dashboard/project/cywurzembhxgwqvpsrlh/database/schemas

export type UserRole = 'Student' | 'Dormitory Manager' | 'Housing Administrator' | 'Guest';

export interface UserProfile {
    user_id: string;  // from supabase
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
    actual_Move_Out_Date?: string | null;
    application_id: string; 
    
    // optional for history checker 
    application?: {
    preferred_Unit_Type: string;
    preferred_Accomodation: string;
    };
}