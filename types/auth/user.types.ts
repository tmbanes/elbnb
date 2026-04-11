type UserRole = "student" | "dormitory_manager" | "housing_admin" | "guest";
type UserStatus = "active" | "inactive" | "deactivated";

interface UserCreationRequest {
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  password: string;
  role: UserRole;
  user_status: UserStatus;
}

interface StudentCreationRequest extends UserCreationRequest {
  student_number: string;
  degree_program: string;
  enrollment_status: "enrolled" | "graduated" | "dropped";
  // residency_status: "freshman" | "sophomore" | "junior" | "senior" | "delayed";
  residency_status: "resident" | "non-resident" | "evicted";
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

interface User {
  // Response type for data fetche
  user_id: string;
  first_name: string;
  last_name: string;
  middle_name?: string; // Optional middle name
  email: string;
  role: UserRole; // [To-Do:Define the role field with the UserRole type next]
  user_status: UserStatus;
  created_at: string; // ISO date string
}

export type {
  User,
  UserCreationRequest,
  StudentCreationRequest,
  GuestCreationRequest,
  DormitoryManagerCreationRequest,
  HousingAdminCreationRequest,
  UserRole,
  UserStatus,
};
