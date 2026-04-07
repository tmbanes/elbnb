// UNIT ENUM TYPES
export type UnitType = "room" | "bedspace" | "wholeunit"
export type FurnishingStatus = "furnished" | "unfurnished" | "semi-furnished";
export type BillingPeriod = "daily" | "weekly" | "monthly" | "one-time";

// ACCOMMODATION ENUM TYPES
export type AccommodationType = "dormitory" | "renting_space"
export type UnitAccommodationStatus = "active" | "inactive";

// RENTING_SPACE ACCOMMODATION ENUM TYPES
export type PropertyType = "apartment" | "boarding" | "transient" | "house";

// DORMITORY ACCOMMODATION ENUM TYPES
export type TermType = "semestral" | "annual";
export type College = "CAS" | "CEAT" | "CAFS" | "CVM" | "CDC" | "CEM" | "CHE" | "CFNR" | "SESAM" | "CPAf";
export type DegreePrograms = "";

// BASED ON SUPABASE PROPERTIES + vacant slots
export interface Unit {
    unit_id: string;
    accommodation_id: string;
    unit_number: string;
    unit_type: UnitType;
    max_occupancy: number;
    rental_fee: number;
    billing_period: BillingPeriod;
    min_stay_duration: number;
    max_stay_duration: number;
    created_at: string; // ISO date string
    furnishing_status: FurnishingStatus;
    current_occupancy: number;
    unit_status: UnitAccommodationStatus;
    vacant_slots: number;
}

// BASED ON SUPABASE PROPERTIES
export interface Accommodation {
    accommodation_id: string;
    name: string;
    location: string;
    accommodation_type: AccommodationType;
    manager_id: string;
    accommodation_status: UnitAccommodationStatus;
    total_capacity: number;
    allowed_application: string; // ISO date string
}

// BASED ON SUPABASE PROPERTIES
export interface Dormitory {
    accommodation_id: string;
    number_of_semestersAllowed: number;
    curfew_time: string; // ISO time string
    allowed_programs: College[]; // List of allowed colleges
    term_type: TermType
    separate_by_gender: boolean
}

// BASED ON SUPABASE PROPERTIES
export interface RentingSpace {
    accommodation_id: string
    property_type: PropertyType
    allow_shortterm_stay: boolean
    allow_longterm_stay: boolean
    minimum_stay_days: number
    maximum_stay_days: number
    security_deposit_required: boolean
}