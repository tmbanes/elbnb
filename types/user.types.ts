export type UserRole = "student" | "dormitory_manager" | "housing_admin" | "guest";
export type UserStatus = "active" | "inactive" | "deactivated";
export type EnrollmentStatus = "enrolled" | "loa" | "awol";
export type ResidencyStatus = "resident" | "non-resident" | "evicted";
export type OccupancyStatus = ""
export const COLLEGES = ["CAS", "CEAT", "CAFS", "CVM", "CDC", "CEM", "CHE", "CFNR", "SESAM", "CPAf"] as const;
export type College = typeof COLLEGES[number];
export type DegreePrograms = "";

interface UserCreationRequest {
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  password: string;
  role?: UserRole | null;
  user_status?: UserStatus;
}

export interface UserWithRole {
  user: User;
  role: UserRole | null;
}

interface StudentCreationRequest extends UserCreationRequest {
  student_number: string;
  degree_program: string;
  enrollment_status: "enrolled" | "loa" | "awol";
  residency_status: ResidencyStatus;
  violation_count: number;
}

interface DormitoryManagerCreationRequest extends UserCreationRequest {
  employee_id: string;
}

interface HousingAdminCreationRequest extends UserCreationRequest {
  admin_id: string;
  office_location: string;
}

interface GuestCreationRequest extends UserCreationRequest {
  valid_id: string;
  purpose_visit: string;
  occupancy_status: string; // ISO date string
}

//---------RESPONSE TYPES---------

export interface User {
  // Response type for data fetche
  user_id: string;
  first_name: string;
  last_name: string;
  middle_name?: string; // Optional middle name
  email: string;
  role: UserRole | null;
  user_status: UserStatus;
  created_at: string; // ISO date string
  sex: string;
  birthdate: string; // ISO date string
  profile_picture_url?: string | null;
}

export type {
  UserCreationRequest,
  StudentCreationRequest,
  GuestCreationRequest,
  DormitoryManagerCreationRequest,
  HousingAdminCreationRequest,
};
