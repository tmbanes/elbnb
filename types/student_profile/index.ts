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

