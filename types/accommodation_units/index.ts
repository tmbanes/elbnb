// BASED ON SUPABASE PROPERTIES + vacant slots
export interface Unit {
    unit_id: string;
    accommodation_id: string;
    unit_number: string;
    unit_type: string;
    max_occupancy: number;
    rental_fee: number;
    billing_period: string;
    min_stay_duration: number;
    max_stay_duration: number;
    created_at: string; // ISO date string
    furnishing_status: string;
    current_occupancy: number;
    unit_status: string;
    vacant_slots: number;
}

// BASED ON SUPABASE PROPERTIES
export interface Accommodation {
    accommodation_id: string;
    name: string;
    location: string;
    accommodation_type: string;
    manager_id: string;
    accommodation_status: string;
    total_capacity: number;
    allowed_application_period: string; // ISO date string
}