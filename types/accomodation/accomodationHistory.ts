export interface AccommodationHistory {
  // Assignment fields
  assignment_id: string;
  user_id: string;
  accommodation_id: string;
  unit_id: string | null;

  move_in_date: string | null;
  expected_move_out_date: string | null;
  actual_move_out_date: string | null;
  assignment_status: string | null;

  // Accommodation Details
  accommodation: {
    accommodation_id: string;
    name: string;
    location: string;
    accommodation_type: string;
  } | null;

  // Unit Details
  unit: {
    unit_id: string;
    unit_number: string;
    unit_type: string;
    rental_fee: number;
    billing_period: string;
  } | null;
}