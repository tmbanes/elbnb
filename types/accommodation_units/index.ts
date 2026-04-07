import { College } from '@/types/user.types'

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


// AMENITIES/RULES ENUM TYPES
export type RuleCategory = "curfew" | "visitor" | "appliances" | "pets" | "cleanliness" | "other" 
export type AmenityCondition = "new" | "good" | "fair" | "need_repair" | "damaged" 

////////////////////////////////////////////////////////
//          UNIT - RELATED INTERFACES 
////////////////////////////////////////////////////////

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



////////////////////////////////////////////////////////
//          ACCOMMODATION - RELATED INTERFACES 
////////////////////////////////////////////////////////

// BASED ON SUPABASE PROPERTIES + property_type (to be filled in unit_accommodation service)
export interface Accommodation {
    accommodation_id: string;
    name: string;
    location: string;
    accommodation_type: AccommodationType;
    manager_id: string;
    accommodation_status: UnitAccommodationStatus;
    total_capacity: number;
    allowed_application: string; // ISO date string
    property_type: PropertyType
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

////////////////////////////////////////////////////////
//          ACCOMMODATION/UNIT AMENITIES/RULES
////////////////////////////////////////////////////////

export interface AccommodationRules {
    accommodation_id: string
    rule_id: string
}

export interface AccommodationAmenities {
    accommodation_id: string
    amenity_id: string
}

export interface Rule {
    rule_id: string
    rule_title: string
    rule_desc: string
    rule_category: RuleCategory
}

export interface UnitRule {
    unit_id: string
    rule_id: string
    date_implemented: string // ISO date format
}

export interface Amenity {
    amenity_id: string
    amenity_name: string
    description: string
}

export interface UnitAmenity {
    unit_id: string
    amenity_id: string
    quantity: number
    amenity_condition: AmenityCondition
}