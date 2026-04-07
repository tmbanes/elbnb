export type UserRole = "student" | "dormitory_manager" | "housing_admin" | "guest";
export type UserStatus = "active" | "inactive" | "deactivated";
export type EnrollmentStatus = "enrolled" | "loa" | "awol";
export type ResidencyStatus = "resident" | "non-resident" | "evicted";
export type OccupancyStatus = ""
export type College = "CAS" | "CEAT" | "CAFS" | "CVM" | "CDC" | "CEM" | "CHE" | "CFNR" | "SESAM" | "CPAf";
export type DegreePrograms = "";

export interface UserCreationRequest {
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  password: string;
  role: UserRole;
  user_status: UserStatus;
}

export interface StudentCreationRequest extends UserCreationRequest {
  user_id: string
  student_number: string;
  degree_program: DegreePrograms;
  college: College
  home_address: string
  violation_count: number
  enrollment_status: EnrollmentStatus
  residency_status: ResidencyStatus
  emergency_person: string
  emergency_contact: string
  university_id: string
  form_5: string // document_id
}

export interface DormitoryManagerCreationRequest extends UserCreationRequest {
  user_id: string
  employee_id: string;
  office_location: string;
}

export interface HousingAdminCreationRequest extends UserCreationRequest {
  user_id: string
  admin_id: string;
}

export interface GuestCreationRequest extends UserCreationRequest {
  user_id: string
  valid_id: string;
  purpose_visit: string;
  occupancy_status: OccupancyStatus; 
}

//---------RESPONSE TYPES---------

export interface User {
  // Response type for data fetche
  user_id: string;
  first_name: string;
  last_name: string;
  middle_name?: string; // Optional middle name
  email: string;
  role: UserRole; // [To-Do:Define the role field with the UserRole type next]
  user_status: UserStatus;
  created_at: string; // ISO date string
  sex: string
  birthdate: string // ISO date string
  
}

