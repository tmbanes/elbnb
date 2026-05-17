// admin/housing/types.ts

// For Property & Unit page
export interface Unit {
  unit_id: string;
  unit_number: string;
  unit_type: "room" | "bedspace" | "wholeunit";
  max_occupancy: number;
  current_occupancy: number;
  rental_fee: number;
  unit_status: "active" | "reserved" | "occupied" | "under_maintenance" | "inactive";
  furnishing_status?: string;
  min_stay_duration?: number;
  max_stay_duration?: number;
}

export interface Property {
  accommodation_id: string;
  name: string;
  location: string;
  accommodation_type: "dormitory" | "renting_space";
  accommodation_status: string;
  total_capacity: number;
  manager_id: string;
  dormitory_manager?: {
    employee_id: string;
    users: { first_name: string; last_name: string; email: string };
  };
  dormitory?: {
    number_of_semestersAllowed: number;
    curfew_time: string;
    allowed_programs: string;
    term_type: string;
    separate_by_gender: boolean;
  };
  renting_space?: {
    property_type: string;
    allow_shortterm_stay: boolean;
    allow_longterm_stay: boolean;
    minimum_stay_days: number;
    maximum_stay_days: number;
    security_deposit_required: boolean;
  };
  units?: Unit[];
}

// For manager page
export interface Manager {
  employee_id: string;
  office_location: string;
  users: {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
  accommodation?: { name: string }[];
}