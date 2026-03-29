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
    is_active: boolean;
    furnishing_status: string;
    unit_status: string;
    current_occupancy: number;
    vacant_slots: number;
}

export interface Accommodation {
    accommodation_id: string;
    name: string;
    location: string;
    accommodation_type: string;
    manager_id: string;
    accommodation_status: string;
    total_capacity: number;
    allowed_application_types: string[];
}