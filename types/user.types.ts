export type UserRole = "student" | "dormitory_manager" | "housing_admin" | "admin" | "guest";
export type UserStatus = "active" | "inactive" | "deactivated";
export type EnrollmentStatus = "enrolled" | "loa" | "awol";
export type ResidencyStatus = "resident" | "non-resident" | "evicted";
export const COLLEGE_DEGREE_MAP: Record<string, string[]> = {
  CAS: ["BA Communication Arts", "BA Philosophy", "BA Sociology", "BS Applied Mathematics", "BS Applied Physics", "BS Biology", "BS Chemistry", "BS Computer Science", "BS Mathematics", "BS Mathematics and Science Teaching", "BS Statistics", "BS Agricultural Chemistry (Jointly administered with CAFS)", "MA Communication Arts", "MA Sociology", "MS Applied Mathematics", "MS Botany", "MS Chemistry", "MS Computer Science", "MS Genetics", "MS Mathematics", "MS Microbiology", "MS Physics", "MS Statistics", "MS Zoology"],
  CEAT: ["BS Agricultural and Biosystems Engineering", "BS Chemical Engineering", "BS Civil Engineering", "BS Electrical Engineering", "BS Industrial Engineering", "BS Mechanical Engineering", "MS Agricultural Engineering", "MS Agrometeorology", "MS Chemical Engineering"],
  CAFS: ["BS Agriculture", "BS Agricultural Biotechnology", "BS Food Science and Technology", "BS Agricultural Chemistry (Jointly administered with CAS)", "MS Agronomy", "MS Animal Science", "MS Entomology", "MS Food Science", "MS Horticulture", "MS Plant Breeding", "MS Plant Pathology", "MS Soil Science", "MS Weed Science"],
  CVM: ["Doctor of Veterinary Medicine (DVM)", "MS Veterinary Medicine"],
  CDC: ["BS Development Communication", "Master of Development Communication", "MS Development Communication"],
  CEM: ["BS Accountancy", "BS Agribusiness Management and Entrepreneurship", "BS Agricultural and Applied Economics", "BS Economics", "Master of Management (MM)", "MS Agricultural Economics", "MS Economics"],
  CHE: ["BS Human Ecology", "BS Nutrition", "MS Applied Nutrition", "MS Clinical Nutrition", "MS Family Resource Management"],
  CFNR: ["BS Forestry", "MS Forestry", "MS Natural Resources Conservation"],
  SESAM: ["Master in Environmental Management (MEM)", "Professional Master in Tropical Marine Ecosystems Management (PMTMEM)", "MS Environmental Science"],
  CPAf: ["Master in Public Affairs (MPAf)", "MS Community Development", "MS Development Management and Governance", "MS Extension Education"]
};

export const COLLEGES = ["CAS", "CEAT", "CAFS", "CVM", "CDC", "CEM", "CHE", "CFNR", "SESAM", "CPAf"] as const;
export type College = typeof COLLEGES[number];
export type DegreePrograms = "";
export const SEX = ["M", "F"] as const;
export type Sex = typeof SEX[number];

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
  emergency_person?: string;
  emergency_contact?: string;
  home_address?: string;
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
